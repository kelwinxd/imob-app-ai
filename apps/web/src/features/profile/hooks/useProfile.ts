import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UpdateProfileInputSchema, formatPhoneBR, type ProfileDTO } from "@imob/shared";
import { errorText, isApiError } from "../../../shared/api/http";
import { useZodForm } from "../../../shared/lib/useZodForm";
import { profileApi } from "../api/profile.api";

export const profileKey = ["profile"] as const;

export function useProfile() {
  return useQuery({ queryKey: profileKey, queryFn: profileApi.get });
}

export function useProfileForm(profile: ProfileDTO) {
  const qc = useQueryClient();
  const form = useZodForm(UpdateProfileInputSchema, {
    companyName: profile.companyName,
    brandColor: profile.brandColor,
    whatsapp: profile.whatsapp ? formatPhoneBR(profile.whatsapp) : "",
    phone: profile.phone ? formatPhoneBR(profile.phone) : "",
    creci: profile.creci,
  });
  const save = useMutation({
    mutationFn: profileApi.save,
    onSuccess: (data) => qc.setQueryData(profileKey, data),
    onError: (err) => {
      if (isApiError(err)) form.applyServerErrors(err.fields);
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const data = form.validate();
    if (data) save.mutate(data);
  };

  return {
    values: form.values,
    errors: form.errors,
    setField: form.setField,
    submit,
    saving: save.isPending,
    saved: save.isSuccess,
    error: save.error && !(isApiError(save.error) && Object.keys(save.error.fields).length) ? errorText(save.error) : null,
  };
}

export function useLogo() {
  const qc = useQueryClient();
  const upload = useMutation({ mutationFn: profileApi.uploadLogo, onSuccess: (d) => qc.setQueryData(profileKey, d) });
  const remove = useMutation({ mutationFn: profileApi.removeLogo, onSuccess: (d) => qc.setQueryData(profileKey, d) });
  const error = upload.error ?? remove.error;
  return {
    upload: (file: File) => upload.mutate(file),
    remove: () => remove.mutate(),
    busy: upload.isPending || remove.isPending,
    error: error ? errorText(error) : null,
  };
}
