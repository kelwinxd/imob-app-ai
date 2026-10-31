import { Card } from "../../../shared/ui/Card";
import { ListingForm } from "../components/ListingForm";
import type { ListingForm as ListingFormState } from "../hooks/useListingForm";

export function ListingStep({ form }: { form: ListingFormState }) {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="anuncio-titulo">
      <div>
        <h2 id="anuncio-titulo" className="text-lg font-semibold">Dados do anúncio</h2>
        <p className="mt-1 text-sm text-stone-600">
          Aparecem na página pública de todas as decorações deste imóvel. Tudo é opcional e pode ser mudado depois de publicar.
        </p>
      </div>
      <Card className="p-5 sm:p-6">
        <ListingForm
          values={form.values}
          errors={form.errors}
          onChange={form.setField}
          onSubmit={(e) => {
            e.preventDefault();
            form.submit();
          }}
          saving={form.saving}
          saved={form.saved}
          dirty={form.dirty}
          error={form.error}
        />
      </Card>
    </section>
  );
}
