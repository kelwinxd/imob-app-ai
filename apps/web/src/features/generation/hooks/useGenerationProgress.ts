import { useEffect, useRef, useState } from "react";
import type { StagingPhotoDTO } from "@imob/shared";

// A OpenAI não informa progresso; a barra é uma estimativa por tempo, corrigida pelas fotos que já terminaram.
const SECONDS_PER_PHOTO = 45;
const PARALLEL_PHOTOS = 2;

interface Batch {
  startedAt: number;
  photoIds: Set<string>;
}

export function useGenerationProgress(photos: StagingPhotoDTO[]) {
  const generating = photos.filter((p) => p.status === "generating").map((p) => p.photoId);
  const key = generating.join(",");
  const batch = useRef<Batch | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (generating.length === 0) {
      batch.current = null;
      return;
    }
    if (!batch.current) batch.current = { startedAt: Date.now(), photoIds: new Set() };
    for (const id of generating) batch.current.photoIds.add(id);
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [key]);

  const b = batch.current;
  if (!b || generating.length === 0) return { active: false, pct: 0, done: 0, total: 0, remainingSec: 0 };

  const total = b.photoIds.size;
  const done = total - generating.length;
  const expected = Math.ceil(total / PARALLEL_PHOTOS) * SECONDS_PER_PHOTO;
  const elapsed = (now - b.startedAt) / 1000;
  const byTime = Math.min(0.95, elapsed / expected);
  const byDone = done / total;
  return {
    active: true,
    pct: Math.round(Math.max(byTime, byDone) * 100),
    done,
    total,
    remainingSec: Math.max(0, Math.round(expected - elapsed)),
  };
}
