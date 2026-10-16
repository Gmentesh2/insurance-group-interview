export const countryCodes = [
  "AL",
  "AR",
  "AM",
  "AU",
  "AT",
  "AZ",
  "BE",
  "BR",
  "BG",
  "CA",
  "CN",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EG",
  "EE",
  "FI",
  "FR",
  "GE",
  "DE",
  "GR",
  "HU",
  "IS",
  "IN",
  "ID",
  "IE",
  "IL",
  "IT",
  "JP",
  "KZ",
  "LV",
  "LT",
  "LU",
  "MY",
  "MT",
  "MX",
  "ME",
  "MA",
  "NL",
  "NZ",
  "NO",
  "PL",
  "PT",
  "QA",
  "RO",
  "RU",
  "SA",
  "RS",
  "SG",
  "SK",
  "SI",
  "ZA",
  "KR",
  "ES",
  "SE",
  "CH",
  "TH",
  "TR",
  "UA",
  "AE",
  "GB",
  "US",
  "UZ",
  "VN",
] as const;
export function countryName(code: string, locale: string) {
  return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
}
export function money(cents: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
export function tripDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
export function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function destinationNames(countries: string[], locale: string) {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  return countries
    .map((code) => {
      try {
        return names.of(code) ?? code;
      } catch {
        return code;
      }
    })
    .join(", ");
}
