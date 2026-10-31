import { asc, desc, eq, sql } from "drizzle-orm";
import { GENESIS_HASH, hashChainEntry, verifyEntries } from "@imob/core";
import { db } from "../../db/client";
import { auditEvents, properties } from "../../db/schema";

// Cadeia por imóvel: o lock na linha do imóvel serializa eventos concorrentes (várias fotos gerando ao mesmo tempo).
export async function appendEvent(propertyId: string, action: string, payload: Record<string, unknown>): Promise<string> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select ${properties.id} from ${properties} where ${properties.id} = ${propertyId} for update`);
    const [last] = await tx
      .select({ hash: auditEvents.hash })
      .from(auditEvents)
      .where(eq(auditEvents.propertyId, propertyId))
      .orderBy(desc(auditEvents.id))
      .limit(1);
    const entry = { ts: new Date().toISOString(), action, payload, prev_hash: last?.hash ?? GENESIS_HASH };
    const hash = hashChainEntry(entry);
    await tx.insert(auditEvents).values({ propertyId, ts: entry.ts, action, payload: JSON.stringify(payload), prevHash: entry.prev_hash, hash });
    return hash;
  });
}

export async function verifyPropertyChain(propertyId: string) {
  const rows = await db.select().from(auditEvents).where(eq(auditEvents.propertyId, propertyId)).orderBy(asc(auditEvents.id));
  return verifyEntries(rows.map((r) => ({ ts: r.ts, action: r.action, payload: JSON.parse(r.payload), prev_hash: r.prevHash, hash: r.hash })));
}
