import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { PropertyDetailsSchema, type PropertyDetailDTO, type PropertyDetails } from "@imob/shared";
import { errorText } from "../../../shared/api/http";
import { useZodForm } from "../../../shared/lib/useZodForm";
import { propertiesApi } from "../../properties/api/properties.api";
import { useApplyPropertyDetail } from "../../properties/hooks/useProperties";

const intField = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d+$/.test(v), `${label}: use só números`)
    .transform((v) => (v === "" ? null : Number(v)));

const ListingFormSchema = z
  .object({
    description: z.string(),
    purpose: z.enum(["", "venda", "aluguel"]),
    price: z
      .string()
      .trim()
      .transform((v) => v.replace(/[^\d]/g, ""))
      .transform((v) => (v === "" ? null : Number(v))),
    bedrooms: intField("Quartos"),
    bathrooms: intField("Banheiros"),
    parkingSpots: intField("Vagas"),
    areaM2: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d+([.,]\d+)?$/.test(v), "Área: use só números")
      .transform((v) => (v === "" ? null : Number(v.replace(",", ".")))),
    neighborhood: z.string(),
    city: z.string(),
  })
  .transform((v) => ({ ...v, purpose: v.purpose === "" ? null : v.purpose }))
  .pipe(PropertyDetailsSchema);

export type ListingValues = z.input<typeof ListingFormSchema>;

const toValues = (d: PropertyDetails): ListingValues => ({
  description: d.description,
  purpose: d.purpose ?? "",
  price: d.price != null ? d.price.toLocaleString("pt-BR") : "",
  bedrooms: d.bedrooms?.toString() ?? "",
  bathrooms: d.bathrooms?.toString() ?? "",
  parkingSpots: d.parkingSpots?.toString() ?? "",
  areaM2: d.areaM2 != null ? String(d.areaM2).replace(".", ",") : "",
  neighborhood: d.neighborhood,
  city: d.city,
});

export function useListingForm(property: PropertyDetailDTO) {
  const initial = toValues(property.details);
  const form = useZodForm(ListingFormSchema, initial);
  const apply = useApplyPropertyDetail();
  const save = useMutation({ mutationFn: (details: PropertyDetails) => propertiesApi.update(property.id, details), onSuccess: apply });
  const dirty = (Object.keys(initial) as (keyof ListingValues)[]).some((k) => form.values[k] !== initial[k]);

  // Valida e salva; chama onDone quando não há nada para salvar ou depois de salvar.
  const submit = (onDone?: () => void) => {
    const data = form.validate();
    if (!data) return;
    if (!dirty) return onDone?.();
    save.mutate(data, { onSuccess: () => onDone?.() });
  };

  return {
    values: form.values,
    errors: form.errors,
    setField: form.setField,
    submit,
    dirty,
    saving: save.isPending,
    saved: save.isSuccess && !dirty,
    error: save.error ? errorText(save.error) : null,
  };
}

export type ListingForm = ReturnType<typeof useListingForm>;
