import { runMigrations } from "./db/client";
import { registerJobs } from "./jobs";

await runMigrations();
await registerJobs();
