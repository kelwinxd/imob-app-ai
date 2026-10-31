import PgBoss from "pg-boss";
import { env } from "../env";

export const QUEUES = {
  classifyPhoto: "photo-classify",
  generatePhoto: "photo-generate",
  publishProperty: "property-publish",
} as const;

export interface JobPayloads {
  [QUEUES.classifyPhoto]: { photoId: string };
  [QUEUES.generatePhoto]: { photoId: string };
  [QUEUES.publishProperty]: { propertyId: string };
}

type QueueName = keyof JobPayloads;

export const boss = new PgBoss({ connectionString: env.DATABASE_URL, schema: "pgboss" });
boss.on("error", (err) => console.error("[fila]", err));

let started: Promise<void> | undefined;

export function startQueue(): Promise<void> {
  started ??= (async () => {
    await boss.start();
    for (const name of Object.values(QUEUES)) {
      await boss.createQueue(name, { name, retryLimit: 0, expireInMinutes: 15 });
    }
  })();
  return started;
}

// Erros são tratados dentro dos handlers (a foto vai para "failed"), por isso a fila não refaz jobs.
export async function enqueue<Q extends QueueName>(queue: Q, data: JobPayloads[Q]): Promise<void> {
  await startQueue();
  await boss.send(queue, data);
}

export async function registerWorker<Q extends QueueName>(queue: Q, concurrency: number, handler: (data: JobPayloads[Q]) => Promise<void>) {
  await startQueue();
  for (let i = 0; i < concurrency; i++) {
    await boss.work<JobPayloads[Q]>(queue, { batchSize: 1, pollingIntervalSeconds: 1 }, async ([job]) => {
      await handler(job.data);
    });
  }
}
