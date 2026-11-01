ALTER TABLE "stagings" ADD COLUMN "custom_instructions" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "stagings" ADD COLUMN "page_theme" text DEFAULT 'auto' NOT NULL;--> statement-breakpoint
ALTER TABLE "stagings" ADD COLUMN "page_compare" text DEFAULT 'completo' NOT NULL;