import { env } from "./env";
import { generatePhotoJob } from "./features/generation/generation.service";
import { classifyPhotoJob } from "./features/photos/photos.service";
import { publishPropertyJob } from "./features/publishing/publishing.service";
import { QUEUES, registerWorker } from "./shared/queue";

export async function registerJobs() {
  await registerWorker(QUEUES.classifyPhoto, 4, ({ photoId }) => classifyPhotoJob(photoId));
  await registerWorker(QUEUES.generatePhoto, env.WORKER_CONCURRENCY, ({ photoId }) => generatePhotoJob(photoId));
  await registerWorker(QUEUES.publishProperty, 1, ({ propertyId }) => publishPropertyJob(propertyId));
  console.log(`[worker] filas ativas · IA ${env.AI_MOCK ? "SIMULADA" : `${env.IMAGE_MODEL} + ${env.VISION_MODEL}`}`);
}
