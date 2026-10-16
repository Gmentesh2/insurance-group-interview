"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import type { Locale } from "@/lib/contracts";
import { getPrivateDraft, setPrivateDraft } from "@/lib/private-drafts";
export { DocumentLanguage } from "./document-language-select";

/** Shared by the library and policy; cleared with the owner's private session. */
export function useDocumentLanguage(userId: string) {
  const locale = useLocale() as Locale;
  const [language, setLanguage] = useState<Locale>(() =>
    getPrivateDraft<Locale>(userId, "document-language")
      ?? getPrivateDraft<{ language?: Locale }>(userId, "documents-preferences")?.language
      ?? locale,
  );
  useEffect(() => {
    setPrivateDraft(userId, "document-language", language);
  }, [userId, language]);
  return [language, setLanguage] as const;
}
