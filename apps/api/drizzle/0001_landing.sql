CREATE TABLE "company_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"brand_color" text NOT NULL,
	"whatsapp" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"creci" text DEFAULT '' NOT NULL,
	"logo_key" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "purpose" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "price" bigint;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "bedrooms" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "bathrooms" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "parking_spots" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "area_m2" real;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "neighborhood" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "city" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;