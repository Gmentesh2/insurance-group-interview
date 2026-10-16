"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, Plus } from "lucide-react";
import { AccountNavigation } from "./account-navigation";
import { ProductIcon } from "./product-icon";

/** The customer workspace keeps navigation separate from each feature's data. */
export function CustomerWorkspace({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations("workspaceDesign");
  return <div className="container customer-workspace">
    <aside className="workspace-rail">
      <p className="workspace-rail-label">{t("accountLabel")}</p>
      <AccountNavigation />
      <Link className="workspace-new-trip" href={`/${locale}?product=travel#quote`}><Plus size={18} aria-hidden="true" />{t("newTrip")}</Link>
      <Link className="workspace-help" href={`/${locale}/help`}><ProductIcon name="assistance" size={22} /><span>{t("help")}</span><ArrowUpRight size={15} aria-hidden="true" /></Link>
    </aside>
    <div className="workspace-content">{children}</div>
  </div>;
}
