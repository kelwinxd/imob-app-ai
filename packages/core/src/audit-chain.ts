import { sha256 } from "./imaging";

export const GENESIS_HASH = "0".repeat(64);

export interface ChainEntry {
  ts: string;
  action: string;
  payload: unknown;
  prev_hash: string;
}

export const hashChainEntry = (e: ChainEntry) =>
  sha256(JSON.stringify({ ts: e.ts, action: e.action, payload: e.payload, prev_hash: e.prev_hash }));

export function verifyEntries(entries: (ChainEntry & { hash: string })[]): { ok: boolean; count: number; head: string; brokenAt?: number } {
  let prev = GENESIS_HASH;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.prev_hash !== prev || hashChainEntry(e) !== e.hash) return { ok: false, count: entries.length, head: prev, brokenAt: i + 1 };
    prev = e.hash;
  }
  return { ok: true, count: entries.length, head: prev };
}
