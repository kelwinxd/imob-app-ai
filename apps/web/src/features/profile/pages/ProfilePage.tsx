import type { ProfileDTO } from "@imob/shared";
import { errorText } from "../../../shared/api/http";
import { Alert } from "../../../shared/ui/Alert";
import { Card } from "../../../shared/ui/Card";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { FullPageSpinner } from "../../../shared/ui/Spinner";
import { BrandPreview } from "../components/BrandPreview";
import { LogoUploader } from "../components/LogoUploader";
import { ProfileForm } from "../components/ProfileForm";
import { useLogo, useProfile, useProfileForm } from "../hooks/useProfile";

export function ProfilePage() {
  const profile = useProfile();
  return (
    <>
      <PageHeader title="Minha marca" subtitle="Aparece no topo das páginas públicas dos seus imóveis." back={{ to: "/", label: "Imóveis" }} />
      {profile.isPending ? (
        <FullPageSpinner />
      ) : profile.isError ? (
        <Alert tone="danger">{errorText(profile.error)}</Alert>
      ) : (
        <ProfileEditor profile={profile.data} />
      )}
    </>
  );
}

function ProfileEditor({ profile }: { profile: ProfileDTO }) {
  const form = useProfileForm(profile);
  const logo = useLogo();
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <Card className="flex flex-col gap-6 p-5 sm:p-6">
        <LogoUploader logoUrl={profile.logoUrl} busy={logo.busy} onUpload={logo.upload} onRemove={logo.remove} />
        {logo.error && <Alert tone="danger">{logo.error}</Alert>}
        <ProfileForm
          values={form.values}
          errors={form.errors}
          onChange={form.setField}
          onSubmit={form.submit}
          saving={form.saving}
          saved={form.saved}
          error={form.error}
        />
      </Card>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-stone-700">Prévia</p>
        <BrandPreview name={form.values.companyName} color={form.values.brandColor} logoUrl={profile.logoUrl} hasWhatsapp={Boolean(form.values.whatsapp.trim())} />
      </div>
    </div>
  );
}
