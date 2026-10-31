import { and, desc, eq, inArray } from "drizzle-orm";
import type { CreatePropertyInput, PropertyDetailDTO, PropertySummaryDTO } from "@imob/shared";
import { db } from "../../db/client";
import { generations, photos, properties, variations, type PhotoRow, type PropertyRow } from "../../db/schema";
import { notFound } from "../../shared/http";
import { toPropertyDetailDTO, toPropertySummaryDTO } from "./properties.mapper";

export async function getOwnedProperty(userId: string, propertyId: string): Promise<PropertyRow> {
  const [p] = await db.select().from(properties).where(and(eq(properties.id, propertyId), eq(properties.userId, userId)));
  if (!p) throw notFound("Imóvel não encontrado.");
  return p;
}

export async function listProperties(userId: string): Promise<PropertySummaryDTO[]> {
  const rows = await db.select().from(properties).where(eq(properties.userId, userId)).orderBy(desc(properties.createdAt));
  if (rows.length === 0) return [];
  const allPhotos = await db.select().from(photos).where(inArray(photos.propertyId, rows.map((r) => r.id)));
  return rows.map((p) =>
    toPropertySummaryDTO(
      p,
      allPhotos.filter((ph) => ph.propertyId === p.id).sort((a, b) => a.position - b.position),
    ),
  );
}

export async function createProperty(userId: string, input: CreatePropertyInput): Promise<PropertyDetailDTO> {
  const [p] = await db.insert(properties).values({ userId, title: input.title }).returning();
  return toPropertyDetailDTO(p, [], [], []);
}

export async function loadPropertyDetail(property: PropertyRow): Promise<PropertyDetailDTO> {
  const photoRows: PhotoRow[] = await db.select().from(photos).where(eq(photos.propertyId, property.id));
  const genIds = photoRows.map((ph) => ph.currentGenerationId).filter((id): id is string => Boolean(id));
  const [genRows, varRows] = genIds.length
    ? await Promise.all([
        db.select().from(generations).where(inArray(generations.id, genIds)),
        db.select().from(variations).where(inArray(variations.generationId, genIds)),
      ])
    : [[], []];
  return toPropertyDetailDTO(property, photoRows, genRows, varRows);
}

export async function getPropertyDetail(userId: string, propertyId: string): Promise<PropertyDetailDTO> {
  return loadPropertyDetail(await getOwnedProperty(userId, propertyId));
}
