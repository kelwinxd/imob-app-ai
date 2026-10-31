import { appendFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { GENESIS_HASH, hashChainEntry, verifyEntries, type ChainEntry } from "@imob/core";

type StoredEntry = ChainEntry & { hash: string };

async function readEntries(file: string): Promise<StoredEntry[]> {
  if (!existsSync(file)) return [];
  const text = await readFile(file, "utf8");
  return text.split("\n").filter(Boolean).map((l) => JSON.parse(l) as StoredEntry);
}

// Serializa as escritas: gerações rodam em paralelo e cada evento depende do hash do anterior.
let tail: Promise<unknown> = Promise.resolve();

export function appendEvent(file: string, action: string, payload: unknown): Promise<string> {
  const run = tail.then(async () => {
    const entries = await readEntries(file);
    const base: ChainEntry = { ts: new Date().toISOString(), action, payload, prev_hash: entries.at(-1)?.hash ?? GENESIS_HASH };
    const hash = hashChainEntry(base);
    await appendFile(file, JSON.stringify({ ...base, hash }) + "\n", "utf8");
    return hash;
  });
  tail = run.catch(() => undefined);
  return run;
}

export async function verifyChain(file: string) {
  return verifyEntries(await readEntries(file));
}
