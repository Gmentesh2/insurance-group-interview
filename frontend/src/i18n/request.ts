import { getRequestConfig } from "next-intl/server";
import type { Locale } from "@/lib/contracts";
import { messagesFor } from "@/messages";
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale =
    requested === "de" || requested === "ru" ? requested : "en";
  return {
    locale,
    timeZone: "UTC",
    messages: messagesFor(locale),
  };
});
