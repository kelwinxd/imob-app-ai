ALTER TABLE "properties" DROP CONSTRAINT "properties_slug_unique";--> statement-breakpoint
ALTER TABLE "generations" ALTER COLUMN "staging_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" DROP COLUMN "include";--> statement-breakpoint
ALTER TABLE "photos" DROP COLUMN "current_generation_id";--> statement-breakpoint
ALTER TABLE "photos" DROP COLUMN "chosen_variation_id";--> statement-breakpoint
ALTER TABLE "photos" DROP COLUMN "review_confirmed";--> statement-breakpoint
ALTER TABLE "photos" DROP COLUMN "final";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "style";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "standard";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "publish_state";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "publish_error";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "published_at";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "qr_key";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "dossier_key";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "dossier_sha256";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "audit_head";