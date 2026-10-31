import { createApp } from "./app";
import { runMigrations } from "./db/client";
import { env } from "./env";
import { registerJobs } from "./jobs";
import { startQueue } from "./shared/queue";

await runMigrations();
await startQueue();
if (env.RUN_WORKER) await registerJobs();

createApp().listen(env.API_PORT, () => {
  console.log(`[api] http://localhost:${env.API_PORT}`);
});
