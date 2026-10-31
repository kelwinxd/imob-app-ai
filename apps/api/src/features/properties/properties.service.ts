import { and, desc, eq, inArray } from "drizzle-orm";
import type { CreatePropertyInput, PropertyDetailDTO, PropertySummaryDTO, UpdatePropertyInput } from "@imob/shared";
import { db } from "../../db/client";
import { photos, properties, type PropertyRow } from "../../db/schema";
import { notFound } from "../../shared/http";
import { stagingSummariesFor } from "../stagings/stagings.model";
import { toPropertyDetailDTO, toPropertySummaryDTO } from "./properties.mapper";

export async function getOwnedProperty(userId: string, propertyId: string): Promise<PropertyRow> {
  const [p] = await db.select().from(properties).where(and(eq(properties.id, propertyId), eq(properties.userId, userId)));
  if (!p) throw notFound("Imóvel não encontrado.");
  return p;
}

export async function listProperties(userId: string): Promise<PropertySummaryDTO[]> {
  const rows = await db.select().from(properties).where(eq(properties.userId, userId)).orderBy(desc(properties.createdAt));
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const allPhotos = await db.select().from(photos).where(inArray(photos.propertyId, ids));
  const summaries = await stagingSummariesFor(ids, allPhotos);
  return rows.map((p) => toPropertySummaryDTO(p, allPhotos.filter((ph) => ph.propertyId === p.id), summaries.get(p.id) ?? []));
}

export async function createProperty(userId: string, input: CreatePropertyInput): Promise<PropertyDetailDTO> {
  const [p] = await db.insert(properties).values({ userId, title: input.title }).returning();
  return toPropertyDetailDTO(p, [], []);
}

// Dados da landing não entram no dossiê: a página lê o valor atual, sem precisar publicar de novo.
export async function updateProperty(userId: string, propertyId: string, input: UpdatePropertyInput): Promise<PropertyDetailDTO> {
  await getOwnedProperty(userId, propertyId);
  const patch = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
  if (Object.keys(patch).length) await db.update(properties).set(patch).where(eq(properties.id, propertyId));
  return getPropertyDetail(userId, propertyId);
}

export async function loadPropertyDetail(property: PropertyRow): Promise<PropertyDetailDTO> {
  const photoRows = await db.select().from(photos).where(eq(photos.propertyId, property.id));
  const summaries = await stagingSummariesFor([property.id], photoRows);
  return toPropertyDetailDTO(property, photoRows, summaries.get(property.id) ?? []);
}

export async function getPropertyDetail(userId: string, propertyId: string): Promise<PropertyDetailDTO> {
  return loadPropertyDetail(await getOwnedProperty(userId, propertyId));
}
