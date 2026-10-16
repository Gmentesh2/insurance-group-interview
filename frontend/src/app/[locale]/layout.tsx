import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import "@fontsource-variable/source-sans-3";
import "../globals.css";
import "@/styles/account.css";
import "@/styles/quotes.css";
import "@/styles/comparison.css";
import "@/styles/auth.css";
import "@/styles/landing.css";
import "@/styles/checkout.css";
import "@/styles/support.css";
import "@/styles/workspace.css";
import "@/styles/wallet.css";
import "@/styles/operations.css";
import "@/styles/demo.css";
import "@/styles/feedback.css";
import "@/styles/flow.css";
import "@/styles/country-flags.css";
import "@/styles/site-shell.css";
import "@/styles/products.css";
import "@/styles/currency.css";
import "@/styles/illustrations.css";
import "@/styles/assistant.css";

import { messagesFor } from "@/messages";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { AssistantWidget } from "@/features/assistant/widget";
import { CurrencyProvider } from "@/components/currency-provider";
import type { Locale } from "@/lib/contracts";
export const metadata: Metadata = {
  title: {
    default: "Insurance Group — Cover, made clear",
    template: "%s · Insurance Group",
  },
  description:
    "Explore insurance products, compare travel cover and manage your policies in one place.",
  robots: { index: false, follow: false },
};
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "de" }, { locale: "ru" }];
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!["en", "de", "ru"].includes(locale)) notFound();
  const lang = locale as Locale;
  setRequestLocale(lang);
  return (
    <html lang={lang} data-scroll-behavior="smooth">
      <body>
        <NextIntlClientProvider
          locale={lang}
          messages={messagesFor(lang)}
          timeZone="UTC"
        >
          <CurrencyProvider><SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter /><AssistantWidget /></CurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
