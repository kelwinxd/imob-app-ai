CREATE TABLE "staging_photos" (
	"staging_id" uuid NOT NULL,
	"photo_id" uuid NOT NULL,
	"include" boolean NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"current_generation_id" uuid,
	"chosen_variation_id" uuid,
	"review_confirmed" boolean DEFAULT false NOT NULL,
	"final" jsonb,
	CONSTRAINT "staging_photos_staging_id_photo_id_pk" PRIMARY KEY("staging_id","photo_id")
);
--> statement-breakpoint
CREATE TABLE "staging_references" (
	"id" uuid PRIMARY KEY NOT NULL,
	"staging_id" uuid NOT NULL,
	"key" text NOT NULL,
	"sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stagings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"name" text NOT NULL,
	"style" text,
	"standard" text,
	"furniture_colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"publish_state" text DEFAULT 'none' NOT NULL,
	"publish_error" text,
	"slug" text,
	"published_at" timestamp with time zone,
	"qr_key" text,
	"dossier_key" text,
	"dossier_sha256" text,
	"audit_head" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stagings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN "staging_id" uuid;--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN "options" jsonb DEFAULT '{"furnitureColors":[],"referenceSha256":[]}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "staging_photos" ADD CONSTRAINT "staging_photos_staging_id_stagings_id_fk" FOREIGN KEY ("staging_id") REFERENCES "public"."stagings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staging_photos" ADD CONSTRAINT "staging_photos_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staging_references" ADD CONSTRAINT "staging_references_staging_id_stagings_id_fk" FOREIGN KEY ("staging_id") REFERENCES "public"."stagings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stagings" ADD CONSTRAINT "stagings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staging_references_staging_idx" ON "staging_references" USING btree ("staging_id");--> statement-breakpoint
CREATE INDEX "stagings_property_idx" ON "stagings" USING btree ("property_id");--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_staging_id_stagings_id_fk" FOREIGN KEY ("staging_id") REFERENCES "public"."stagings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "generations_staging_idx" ON "generations" USING btree ("staging_id");--> statement-breakpoint
INSERT INTO "stagings" ("property_id", "name", "style", "standard", "publish_state", "publish_error", "slug", "published_at", "qr_key", "dossier_key", "dossier_sha256", "audit_head", "created_at")
SELECT p."id", 'Decoração 1', p."style", p."standard", p."publish_state", p."publish_error", p."slug", p."published_at", p."qr_key", p."dossier_key", p."dossier_sha256", p."audit_head", p."created_at"
FROM "properties" p
WHERE p."style" IS NOT NULL
   OR EXISTS (SELECT 1 FROM "photos" ph WHERE ph."property_id" = p."id" AND ph."current_generation_id" IS NOT NULL);--> statement-breakpoint
INSERT INTO "staging_photos" ("staging_id", "photo_id", "include", "status", "error", "current_generation_id", "chosen_variation_id", "review_confirmed", "final")
SELECT s."id", ph."id", ph."include",
  CASE
    WHEN ph."status" = 'generated' AND ph."current_generation_id" IS NOT NULL THEN 'generated'
    WHEN ph."status" = 'generating' THEN 'failed'
    WHEN ph."status" = 'failed' AND ph."classification" IS NOT NULL THEN 'failed'
    ELSE 'pending'
  END,
  CASE
    WHEN ph."status" = 'generating' THEN 'A geração foi interrompida. Gere de novo.'
    WHEN ph."status" = 'failed' AND ph."classification" IS NOT NULL THEN ph."error"
    ELSE NULL
  END,
  ph."current_generation_id", ph."chosen_variation_id", ph."review_confirmed", ph."final"
FROM "photos" ph
JOIN "stagings" s ON s."property_id" = ph."property_id";--> statement-breakpoint
UPDATE "generations" g SET "staging_id" = s."id"
FROM "photos" ph JOIN "stagings" s ON s."property_id" = ph."property_id"
WHERE g."photo_id" = ph."id";--> statement-breakpoint
DELETE FROM "generations" WHERE "staging_id" IS NULL;--> statement-breakpoint
UPDATE "photos" SET
  "status" = CASE
    WHEN "status" = 'classifying' THEN 'classifying'
    WHEN "classification" IS NULL AND "room_confirmed" IS NULL THEN 'failed'
    ELSE 'ready'
  END,
  "error" = CASE WHEN "classification" IS NULL AND "room_confirmed" IS NULL THEN "error" ELSE NULL END;
