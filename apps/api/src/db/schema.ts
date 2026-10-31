import { bigserial, boolean, index, integer, jsonb, pgTable, real, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type { Classification, Quality, Room, Standard, Style, VariationCheck, Verdict } from "@imob/shared";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
});

export type PublishState = "none" | "publishing" | "published" | "failed";

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    style: text("style").$type<Style>(),
    standard: text("standard").$type<Standard>(),
    publishState: text("publish_state").$type<PublishState>().notNull().default("none"),
    publishError: text("publish_error"),
    slug: text("slug").unique(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    qrKey: text("qr_key"),
    dossierKey: text("dossier_key"),
    dossierSha256: text("dossier_sha256"),
    auditHead: text("audit_head"),
    createdAt: createdAt(),
  },
  (t) => [index("properties_user_idx").on(t.userId)],
);

export type PhotoStatusDb = "classifying" | "ready" | "generating" | "generated" | "failed";

export interface PhotoFinal {
  key: string;
  sha256: string;
  sealText: string;
  items: string[];
  variationId: string;
  variationIndex: number;
  operatorConfirmedReview: boolean;
  exports: Record<string, string>;
  publishedAt: string;
}

export type StoredClassification = Classification & { model: string; classifiedAt: string };

export const photos = pgTable(
  "photos",
  {
    id: uuid("id").primaryKey(),
    propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    sourceName: text("source_name").notNull(),
    originalKey: text("original_key").notNull(),
    workingKey: text("working_key").notNull(),
    viewKey: text("view_key").notNull(),
    thumbKey: text("thumb_key").notNull(),
    sha256: text("sha256").notNull(),
    originalWidth: integer("original_width").notNull(),
    originalHeight: integer("original_height").notNull(),
    exifPresent: boolean("exif_present").notNull(),
    status: text("status").$type<PhotoStatusDb>().notNull(),
    error: text("error"),
    classification: jsonb("classification").$type<StoredClassification>(),
    roomConfirmed: text("room_confirmed").$type<Room>(),
    include: boolean("include").notNull().default(true),
    currentGenerationId: uuid("current_generation_id"),
    chosenVariationId: uuid("chosen_variation_id"),
    reviewConfirmed: boolean("review_confirmed").notNull().default(false),
    final: jsonb("final").$type<PhotoFinal>(),
    createdAt: createdAt(),
  },
  (t) => [index("photos_property_idx").on(t.propertyId)],
);

export const generations = pgTable(
  "generations",
  {
    id: uuid("id").primaryKey(),
    photoId: uuid("photo_id").notNull().references(() => photos.id, { onDelete: "cascade" }),
    model: text("model").notNull(),
    quality: text("quality").$type<Quality>().notNull(),
    size: text("size").notNull(),
    templateVersion: text("template_version").notNull(),
    room: text("room").$type<Room>().notNull(),
    style: text("style").$type<Style>().notNull(),
    standard: text("standard").$type<Standard>().notNull(),
    prompt: text("prompt").notNull(),
    inputKey: text("input_key").notNull(),
    inputSha256: text("input_sha256").notNull(),
    usage: jsonb("usage"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("generations_photo_idx").on(t.photoId)],
);

export const variations = pgTable(
  "variations",
  {
    id: uuid("id").primaryKey(),
    generationId: uuid("generation_id").notNull().references(() => generations.id, { onDelete: "cascade" }),
    photoId: uuid("photo_id").notNull().references(() => photos.id, { onDelete: "cascade" }),
    index: integer("index").notNull(),
    key: text("key").notNull(),
    previewKey: text("preview_key").notNull(),
    sha256: text("sha256").notNull(),
    verdict: text("verdict").$type<Verdict>().notNull(),
    check: jsonb("check").$type<VariationCheck>().notNull(),
    edgeScore: real("edge_score").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("variations_generation_index_idx").on(t.generationId, t.index)],
);

// payload é guardado como o texto exato usado no hash; jsonb reordenaria as chaves e quebraria a cadeia.
export const auditEvents = pgTable(
  "audit_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
    ts: text("ts").notNull(),
    action: text("action").notNull(),
    payload: text("payload").notNull(),
    prevHash: text("prev_hash").notNull(),
    hash: text("hash").notNull(),
  },
  (t) => [index("audit_events_property_idx").on(t.propertyId, t.id)],
);

export type UserRow = typeof users.$inferSelect;
export type PropertyRow = typeof properties.$inferSelect;
export type PhotoRow = typeof photos.$inferSelect;
export type GenerationRow = typeof generations.$inferSelect;
export type VariationRow = typeof variations.$inferSelect;
