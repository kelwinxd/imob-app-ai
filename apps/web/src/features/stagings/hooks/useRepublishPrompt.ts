import { useEffect, useRef, useState } from "react";
import type { StagingDetailDTO } from "@imob/shared";

// Quando uma decoração já publicada termina uma nova geração, pergunta na hora se deve atualizar a página.
export function useRepublishPrompt(staging: StagingDetailDTO) {
  const previous = useRef(staging.status);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (previous.current === "generating" && staging.status === "choosing" && staging.published) setOpen(true);
    if (staging.status === "publishing" || staging.status === "published") setOpen(false);
    previous.current = staging.status;
  }, [staging.status, staging.published]);

  return { open, close: () => setOpen(false) };
}
