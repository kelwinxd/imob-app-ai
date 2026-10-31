import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { CreatePropertyInputSchema } from "@imob/shared";
import { errorText } from "../../../shared/api/http";
import { useZodForm } from "../../../shared/lib/useZodForm";
import { Card } from "../../../shared/ui/Card";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { CreatePropertyForm } from "../components/CreatePropertyForm";
import { useCreateProperty } from "../hooks/useProperties";

export function NewPropertyPage() {
  const navigate = useNavigate();
  const form = useZodForm(CreatePropertyInputSchema, { title: "" });
  const create = useCreateProperty();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const data = form.validate();
    if (data) create.mutate(data, { onSuccess: (p) => navigate(`/imoveis/${p.id}`, { replace: true }) });
  };

  return (
    <>
      <PageHeader title="Novo imóvel" back={{ to: "/", label: "Imóveis" }} />
      <Card className="p-5 sm:p-6">
        <CreatePropertyForm
          title={form.values.title}
          error={form.errors.title}
          formError={create.error ? errorText(create.error) : null}
          submitting={create.isPending}
          onTitleChange={(v) => form.setField("title", v)}
          onSubmit={submit}
        />
      </Card>
    </>
  );
}
