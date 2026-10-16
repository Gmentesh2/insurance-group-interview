"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ProductIcon } from "./product-icon";

export function AccountNavigation({
  children,
  policiesCount,
}: {
  children?: ReactNode;
  policiesCount?: number;
}) {
  const t = useTranslations("account");
  const d = useTranslations("workspaceDesign");
  const locale = useLocale();
  const pathname = usePathname();
  const base = `/${locale}/account`;
  const links = [
    {
      href: base,
      label: d("navPolicies"),
      icon: "policies" as const,
      current: pathname === base || pathname.startsWith(`${base}/policies/`),
      count: policiesCount,
    },
    {
      href: `${base}/documents`,
      label: d("navDocuments"),
      icon: "documents" as const,
      current: pathname.startsWith(`${base}/documents`),
    },
    {
      href: `${base}/claims`,
      label: d("navClaims"),
      icon: "claims" as const,
      current: pathname.startsWith(`${base}/claims`),
    },
  ];

  return (
    <div className="workspace-navigation">
      <nav className="workspace-nav-links" aria-label={t("account")}>
        {links.map(({ href, label, icon, current, count }) => (
          <Link key={href} href={href} aria-current={current ? "page" : undefined}>
            <ProductIcon name={icon} size={22} />
            <span>{label}</span>
            {count !== undefined && <span className="workspace-nav-count">{count}</span>}
          </Link>
        ))}
      </nav>
      {children && <div className="workspace-nav-accessory">{children}</div>}
    </div>
  );
}
