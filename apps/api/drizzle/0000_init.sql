CREATE TABLE "audit_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"property_id" uuid NOT NULL,
	"ts" text NOT NULL,
	"action" text NOT NULL,
	"payload" text NOT NULL,
	"prev_hash" text NOT NULL,
	"hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"photo_id" uuid NOT NULL,
	"model" text NOT NULL,
	"quality" text NOT NULL,
	"size" text NOT NULL,
	"template_version" text NOT NULL,
	"room" text NOT NULL,
	"style" text NOT NULL,
	"standard" text NOT NULL,
	"prompt" text NOT NULL,
	"input_key" text NOT NULL,
	"input_sha256" text NOT NULL,
	"usage" jsonb,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"property_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"source_name" text NOT NULL,
	"original_key" text NOT NULL,
	"working_key" text NOT NULL,
	"view_key" text NOT NULL,
	"thumb_key" text NOT NULL,
	"sha256" text NOT NULL,
	"original_width" integer NOT NULL,
	"original_height" integer NOT NULL,
	"exif_present" boolean NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"classification" jsonb,
	"room_confirmed" text,
	"include" boolean DEFAULT true NOT NULL,
	"current_generation_id" uuid,
	"chosen_variation_id" uuid,
	"review_confirmed" boolean DEFAULT false NOT NULL,
	"final" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"style" text,
	"standard" text,
	"publish_state" text DEFAULT 'none' NOT NULL,
	"publish_error" text,
	"slug" text,
	"published_at" timestamp with time zone,
	"qr_key" text,
	"dossier_key" text,
	"dossier_sha256" text,
	"audit_head" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "properties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "variations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"generation_id" uuid NOT NULL,
	"photo_id" uuid NOT NULL,
	"index" integer NOT NULL,
	"key" text NOT NULL,
	"preview_key" text NOT NULL,
	"sha256" text NOT NULL,
	"verdict" text NOT NULL,
	"check" jsonb NOT NULL,
	"edge_score" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variations" ADD CONSTRAINT "variations_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variations" ADD CONSTRAINT "variations_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_property_idx" ON "audit_events" USING btree ("property_id","id");--> statement-breakpoint
CREATE INDEX "generations_photo_idx" ON "generations" USING btree ("photo_id");--> statement-breakpoint
CREATE INDEX "photos_property_idx" ON "photos" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "properties_user_idx" ON "properties" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variations_generation_index_idx" ON "variations" USING btree ("generation_id","index");