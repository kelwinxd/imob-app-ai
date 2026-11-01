import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import QRCode from "qrcode";
import { z } from "zod";
import {
  buildDossier, createAi, DEFAULT_EDGE_THRESHOLD, defaultChoice, loadTemplates, makeWorkingCopy, parseSize,
  renderFinal, renderPublicPage, runGeneration, sha256, shortUrlOf, toJpeg,
  type PublicPagePhoto,
} from "@imob/core";
import {
  privacyAlerts, PORTALS, QUALITIES, ROOM_LABELS, ROOMS, shouldIncludeByDefault, STANDARDS, STYLES,
  type Quality, type Standard, type Style,
} from "@imob/shared";
import { appendEvent, verifyChain } from "./audit";
import { env } from "./config";
import {
  loadManifest, outPaths, readJson, saveManifest, writeJson,
  type ChoicesFile, type Manifest, type PhotoEntry, type RoomsFile,
} from "./manifest";

const USAGE = `Uso: npm run concierge -- <comando> [opções]

  classificar  --entrada <pasta de fotos> --saida <pasta> [--titulo "Apto 42 Moema"]
  gerar        --saida <pasta> --estilo <${STYLES.join("|")}> --padrao <${STANDARDS.join("|")}>
               [--variacoes 3] [--qualidade ${QUALITIES.join("|")}] [--lado 1536 | --tamanho 1536x1024]
               [--fotos p01,p02] [--refazer] [--limiar ${DEFAULT_EDGE_THRESHOLD}] [--paralelo 2]
  publicar     --saida <pasta> --url <endereço onde a pasta site/ será publicada>
  verificar    --saida <pasta>

  --simulado   roda tudo sem chamar a OpenAI (para testar o fluxo)`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    entrada: { type: "string" },
    saida: { type: "string" },
    titulo: { type: "string" },
    estilo: { type: "string" },
    padrao: { type: "string" },
    variacoes: { type: "string", default: "3" },
    qualidade: { type: "string" },
    lado: { type: "string", default: "1536" },
    tamanho: { type: "string" },
    fotos: { type: "string" },
    refazer: { type: "boolean", default: false },
    limiar: { type: "string", default: String(DEFAULT_EDGE_THRESHOLD) },
    paralelo: { type: "string", default: "2" },
    url: { type: "string" },
    simulado: { type: "boolean", default: false },
    ajuda: { type: "boolean", short: "h", default: false },
  },
});

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
let aiInstance: ReturnType<typeof createAi> | undefined;
const ai = () => (aiInstance ??= createAi({ ...env, mock: values.simulado }));

class UserError extends Error {}

function required(name: keyof typeof values): string {
  const v = values[name];
  if (typeof v !== "string" || !v) throw new UserError(`Faltou --${name}.\n\n${USAGE}`);
  return v;
}

function oneOf<T extends string>(name: keyof typeof values, allowed: readonly T[], fallback?: T): T {
  const v = (values[name] as string | undefined) ?? fallback;
  if (!v || !allowed.includes(v as T)) throw new UserError(`--${name} deve ser um de: ${allowed.join(", ")}`);
  return v as T;
}

function positiveInt(name: keyof typeof values, max: number): number {
  const n = Number(values[name]);
  if (!Number.isInteger(n) || n < 1 || n > max) throw new UserError(`--${name} deve ser um inteiro entre 1 e ${max}`);
  return n;
}

async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    }),
  );
}

let saving: Promise<unknown> = Promise.resolve();
function saveSerial(out: string, m: Manifest): Promise<void> {
  const run = saving.then(() => saveManifest(out, m));
  saving = run.catch(() => undefined);
  return run;
}

// ---------- classificar ----------

async function cmdClassify() {
  const input = resolve(required("entrada"));
  const out = resolve(required("saida"));
  const { events, rooms: roomsFile } = outPaths(out);
  await mkdir(join(out, "originais"), { recursive: true });
  await mkdir(join(out, "trabalho"), { recursive: true });

  const m: Manifest = existsSync(outPaths(out).manifest)
    ? await loadManifest(out)
    : { schema: 1, property: { title: values.titulo ?? basename(input), createdAt: new Date().toISOString() }, photos: [] };
  if (values.titulo) m.property.title = values.titulo;

  const names = (await readdir(input)).sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
  const skipped = names.filter((n) => !IMAGE_EXT.has(extname(n).toLowerCase()));
  if (skipped.length) console.warn(`Ignorados (formato não suportado; converta HEIC para JPG): ${skipped.join(", ")}`);

  for (const name of names.filter((n) => IMAGE_EXT.has(extname(n).toLowerCase()))) {
    if (m.photos.some((p) => p.sourceName === name)) continue;
    const id = `p${String(m.photos.length + 1).padStart(2, "0")}`;
    const original = await readFile(join(input, name));
    const hash = sha256(original);
    const originalFile = `originais/${id}${extname(name).toLowerCase()}`;
    await copyFile(join(input, name), join(out, originalFile));
    if (sha256(await readFile(join(out, originalFile))) !== hash) throw new Error(`Cópia de ${name} não confere com o original.`);
    const work = await makeWorkingCopy(original);
    const workingFile = `trabalho/${id}.png`;
    await writeFile(join(out, workingFile), work.buffer);
    m.photos.push({
      id, sourceName: name, originalFile, sha256: hash,
      originalWidth: work.originalWidth, originalHeight: work.originalHeight, exifPresent: work.exifPresent,
      workingFile, ingestedAt: new Date().toISOString(),
    });
    await appendEvent(events, "receber_foto", { id, arquivo: name, sha256: hash });
    console.log(`${id}  ${name}  sha256 ${hash.slice(0, 12)}…`);
  }
  await saveManifest(out, m);
  if (m.photos.length === 0) throw new UserError(`Nenhuma foto JPG/PNG/WEBP em ${input}.`);

  await pool(m.photos.filter((p) => !p.classification), 4, async (p) => {
    const c = await ai().classify(await readFile(join(out, p.workingFile)));
    p.classification = { ...c, model: ai().visionModel, classifiedAt: new Date().toISOString() };
    await appendEvent(events, "classificar", { id: p.id, ...c });
    await saveSerial(out, m);
  });

  const previous: RoomsFile = existsSync(roomsFile) ? await readJson<RoomsFile>(roomsFile) : {};
  const rooms: RoomsFile = {};
  for (const p of m.photos) {
    const c = p.classification!;
    rooms[p.id] = previous[p.id] ?? {
      arquivo: p.sourceName,
      sugerido: c.comodo,
      confianca: Math.round(c.confianca * 100) / 100,
      alertas: privacyAlerts(c),
      confirmado: c.comodo,
      publicar: shouldIncludeByDefault(c),
    };
  }
  await writeJson(roomsFile, rooms);

  console.log("\nFoto  Sugerido         Publicar  Alertas");
  for (const [id, r] of Object.entries(rooms)) {
    console.log(`${id}   ${ROOM_LABELS[r.sugerido].padEnd(16)} ${(r.publicar ? "sim" : "não").padEnd(9)} ${r.alertas.join("; ")}`);
  }
  console.log(`\nPróximo passo: revise ${roomsFile} (campos "confirmado" e "publicar") e rode "gerar".`);
}

// ---------- gerar ----------

const RoomsFileSchema = z.record(z.string(), z.looseObject({ confirmado: z.enum(ROOMS), publicar: z.boolean() }));

async function cmdGenerate() {
  const out = resolve(required("saida"));
  const style = oneOf<Style>("estilo", STYLES);
  const standard = oneOf<Standard>("padrao", STANDARDS);
  const quality = oneOf<Quality>("qualidade", QUALITIES, env.imageQuality);
  const n = positiveInt("variacoes", 10);
  const parallel = positiveInt("paralelo", 8);
  const longEdge = positiveInt("lado", 3840);
  const threshold = Number(values.limiar);
  if (!(threshold > 0 && threshold < 1)) throw new UserError("--limiar deve estar entre 0 e 1");
  const fixedSize = values.tamanho ? parseSize(values.tamanho) : undefined;
  const only = values.fotos?.split(",").map((s) => s.trim()).filter(Boolean);

  const m = await loadManifest(out);
  const { events, rooms: roomsPath, choices: choicesPath } = outPaths(out);
  if (!existsSync(roomsPath)) throw new UserError(`Não achei ${roomsPath}. Rode "classificar" primeiro.`);
  const parsedRooms = RoomsFileSchema.safeParse(await readJson(roomsPath));
  if (!parsedRooms.success) throw new UserError(`comodos.json inválido: ${parsedRooms.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  const rooms = parsedRooms.data;
  const templates = await loadTemplates();
  m.property.style = style;
  m.property.standard = standard;
  await mkdir(join(out, "geradas"), { recursive: true });

  const targets = m.photos.filter((p) => rooms[p.id]?.publicar && (!only || only.includes(p.id)) && (values.refazer || !p.generation));
  if (targets.length === 0) {
    console.log("Nada para gerar (fotos já geradas ou marcadas para não publicar). Use --refazer para gerar de novo.");
    return;
  }
  console.log(`Gerando ${targets.length} foto(s) × ${n} variações · ${values.simulado ? "SIMULADO" : `${env.imageModel}, qualidade ${quality}`}\n`);

  const failures: string[] = [];
  await pool(targets, parallel, async (p) => {
    try {
      const room = rooms[p.id].confirmado;
      const outcome = await runGeneration({
        ai: ai(), templates, working: await readFile(join(out, p.workingFile)),
        room, style, standard, quality, variations: n, longEdge, fixedSize, edgeThreshold: threshold,
      });
      const inputFile = `trabalho/${p.id}-entrada.png`;
      await writeFile(join(out, inputFile), outcome.input);
      const variations = [];
      for (const v of outcome.variations) {
        const file = `geradas/${p.id}-v${v.index}.png`;
        await writeFile(join(out, file), v.image);
        variations.push({ index: v.index, file, sha256: v.sha256, check: v.check });
      }
      p.generation = {
        createdAt: outcome.createdAt, model: outcome.model, quality, size: outcome.size,
        templateVersion: outcome.templateVersion, room, style, standard, prompt: outcome.prompt,
        inputFile, inputSha256: outcome.inputSha256, usage: outcome.usage, variations,
      };
      delete p.final;
      await appendEvent(events, "gerar", {
        id: p.id, modelo: outcome.model, tamanho: outcome.size, instrucoes: outcome.templateVersion,
        entrada_sha256: outcome.inputSha256,
        variacoes: variations.map((v) => ({ n: v.index, sha256: v.sha256, veredito: v.check.verdict, bordas: Number(v.check.edgeScore.toFixed(3)) })),
      });
      await saveSerial(out, m);
      console.log(`${p.id}  ${ROOM_LABELS[room].padEnd(16)} ${variations.map((v) => `v${v.index}: ${v.check.verdict} (bordas ${v.check.edgeScore.toFixed(2)})`).join("  ")}`);
    } catch (err) {
      failures.push(p.id);
      console.error(`${p.id}  ERRO: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  const choices: ChoicesFile = existsSync(choicesPath) ? await readJson<ChoicesFile>(choicesPath) : {};
  for (const p of targets) {
    if (!p.generation || failures.includes(p.id)) continue;
    choices[p.id] = defaultChoice(p.generation.variations);
  }
  await writeJson(choicesPath, choices);
  printUsage(m);

  console.log(`\nVariações em ${join(out, "geradas")}. Escolha uma por foto em ${choicesPath} (número da variação, ou null para não publicar) e rode "publicar".`);
  if (failures.length) {
    console.error(`\nFalharam: ${failures.join(", ")}. Rode de novo com --fotos ${failures.join(",")}.`);
    process.exitCode = 1;
  }
}

function printUsage(m: Manifest) {
  let input = 0, output = 0;
  for (const p of m.photos) {
    const u = p.generation?.usage as { input_tokens?: number; output_tokens?: number } | null | undefined;
    input += u?.input_tokens ?? 0;
    output += u?.output_tokens ?? 0;
  }
  if (input || output) console.log(`\nTokens de imagem acumulados no imóvel: entrada ${input}, saída ${output}. Confira o custo no painel da OpenAI.`);
}

// ---------- publicar ----------

async function cmdPublish() {
  const out = resolve(required("saida"));
  const url = required("url").replace(/\/+$/, "");
  if (!/^https?:\/\/[^\s/]+/.test(url)) throw new UserError("--url deve começar com http:// ou https://");

  const m = await loadManifest(out);
  const { events, choices: choicesPath } = outPaths(out);
  if (!existsSync(choicesPath)) throw new UserError(`Não achei ${choicesPath}. Rode "gerar" primeiro.`);
  const choices = await readJson<ChoicesFile>(choicesPath);
  m.property.publicUrl = url;

  const selected: PhotoEntry[] = [];
  for (const p of m.photos) {
    const choice = choices[p.id];
    if (choice == null || !p.generation) continue;
    const v = p.generation.variations.find((x) => x.index === choice);
    if (!v) throw new UserError(`${p.id}: variação ${choice} não existe.`);
    if (v.check?.verdict === "reprovado") {
      throw new UserError(`${p.id}: a variação ${choice} foi reprovada na trava de estrutura. Escolha outra ou gere de novo com --refazer --fotos ${p.id}.`);
    }
    selected.push(p);
  }
  if (selected.length === 0) throw new UserError("Nenhuma foto escolhida em escolhas.json.");

  for (const dir of ["final", "site/img", ...PORTALS.map((f) => `portais/${f.id}`)]) await mkdir(join(out, dir), { recursive: true });

  for (const p of selected) {
    const v = p.generation!.variations.find((x) => x.index === choices[p.id])!;
    const rendered = await renderFinal(await readFile(join(out, v.file)), v.check?.vision.itens_adicionados ?? [], shortUrlOf(url));
    const file = `final/${p.id}.jpg`;
    await writeFile(join(out, file), rendered.final);
    const exports: Record<string, string> = {};
    for (const [portal, buf] of Object.entries(rendered.exports)) {
      exports[portal] = `portais/${portal}/${p.id}.jpg`;
      await writeFile(join(out, exports[portal]), buf);
    }
    const review = v.check?.verdict === "revisar";
    if (review) console.warn(`${p.id}: variação ${v.index} estava marcada para revisão; registrada como confirmada pelo operador.`);
    p.final = {
      variation: v.index, operatorConfirmedReview: review, file, sha256: rendered.finalSha256,
      sealText: rendered.sealText, exports, publishedAt: new Date().toISOString(),
    };
    await appendEvent(events, "publicar_foto", { id: p.id, variacao: v.index, sha256_selo: rendered.finalSha256, selo: rendered.sealText, revisao_confirmada: review });
  }

  const qrPng = await QRCode.toBuffer(url, { type: "png", width: 600, margin: 2, errorCorrectionLevel: "M" });
  await writeFile(join(out, "qrcode.png"), qrPng);
  const pageHead = await appendEvent(events, "pagina_publica", { url, fotos: selected.map((p) => p.id) });

  const pagePhotos: PublicPagePhoto[] = [];
  for (const p of selected) {
    await writeFile(join(out, "site/img", `${p.id}-decorada.jpg`), await toJpeg(await readFile(join(out, p.final!.file)), 1600, 85));
    pagePhotos.push({ roomLabel: ROOM_LABELS[p.generation!.room], decoratedSrc: `img/${p.id}-decorada.jpg` });
  }
  const siteFile = join(out, "site", "index.html");
  await writeFile(siteFile, renderPublicPage({ title: m.property.title, publishedAt: new Date(), registry: pageHead, photos: pagePhotos }), "utf8");

  const chain = await verifyChain(events);
  if (!chain.ok) throw new Error(`Registro de eventos corrompido na linha ${chain.brokenAt}.`);
  const first = selected[0].generation!;
  const pdf = await buildDossier({
    title: m.property.title, style: first.style, standard: first.standard, publicUrl: url, qrPng, auditHead: chain.head,
    photos: await Promise.all(
      selected.map(async (p) => {
        const gen = p.generation!;
        const chosen = gen.variations.find((v) => v.index === p.final!.variation)!;
        return {
          label: p.id,
          roomLabel: ROOM_LABELS[gen.room],
          roomSuggestedLabel: p.classification ? ROOM_LABELS[p.classification.comodo] : null,
          sourceName: p.sourceName, receivedAt: p.ingestedAt,
          originalWidth: p.originalWidth, originalHeight: p.originalHeight, exifPresent: p.exifPresent, sha256: p.sha256,
          original: await readFile(join(out, p.workingFile)),
          final: await readFile(join(out, p.final!.file)),
          finalSha256: p.final!.sha256, sealText: p.final!.sealText, operatorConfirmedReview: p.final!.operatorConfirmedReview,
          generation: gen,
          chosen: { index: chosen.index, sha256: chosen.sha256, check: chosen.check ?? null },
          others: gen.variations.filter((v) => v.index !== chosen.index).map((v) => ({ index: v.index, verdict: v.check?.verdict ?? null })),
        };
      }),
    ),
  });
  await writeFile(join(out, "dossie.pdf"), pdf);
  const pdfHash = sha256(pdf);
  await appendEvent(events, "dossie", { sha256: pdfHash, registro_no_dossie: chain.head });
  m.dossier = { file: "dossie.pdf", sha256: pdfHash, createdAt: new Date().toISOString(), auditHead: chain.head };
  await saveManifest(out, m);

  console.log(`Publicadas ${selected.length} foto(s).
  Fotos com selo:   ${join(out, "final")}
  Por portal:       ${join(out, "portais")}
  Página pública:   ${siteFile}  → publique a pasta site/ em ${url}
  QR code:          ${join(out, "qrcode.png")}
  Dossiê:           ${join(out, "dossie.pdf")}  (sha256 ${pdfHash.slice(0, 16)}…)`);
}

// ---------- verificar ----------

async function cmdVerify() {
  const out = resolve(required("saida"));
  const m = await loadManifest(out);
  const problems: string[] = [];
  const check = async (rel: string, expected: string) => {
    const f = join(out, rel);
    if (!existsSync(f)) problems.push(`${rel}: arquivo ausente`);
    else if (sha256(await readFile(f)) !== expected) problems.push(`${rel}: hash não confere`);
  };
  let files = 0;
  for (const p of m.photos) {
    await check(p.originalFile, p.sha256); files++;
    for (const v of p.generation?.variations ?? []) { await check(v.file, v.sha256); files++; }
    if (p.final) { await check(p.final.file, p.final.sha256); files++; }
  }
  if (m.dossier) { await check(m.dossier.file, m.dossier.sha256); files++; }
  const chain = await verifyChain(outPaths(out).events);
  if (!chain.ok) problems.push(`eventos.jsonl: cadeia quebrada na linha ${chain.brokenAt}`);

  console.log(`Arquivos conferidos: ${files} · eventos: ${chain.count} · último hash ${chain.head.slice(0, 16)}…`);
  if (problems.length) {
    console.error(problems.map((p) => `  ✗ ${p}`).join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Tudo confere.");
  }
}

// ---------- main ----------

const commands: Record<string, () => Promise<void>> = {
  classificar: cmdClassify,
  gerar: cmdGenerate,
  publicar: cmdPublish,
  verificar: cmdVerify,
};

const cmd = positionals[0];
if (values.ajuda || !cmd || !commands[cmd]) {
  console.log(USAGE);
  process.exitCode = values.ajuda ? 0 : 1;
} else {
  commands[cmd]().catch((err) => {
    console.error(err instanceof UserError ? err.message : err);
    process.exitCode = 1;
  });
}
