import Image from "next/image";
import { countryCodes } from "@/lib/countries";

const supported = new Set<string>(countryCodes);

/** Decorative country artwork. Always pair it with a visible localized name. */
export function CountryFlag({
  code,
  size = "default",
}: {
  code: string;
  size?: "small" | "default";
}) {
  const normalized = code.toUpperCase();
  if (!supported.has(normalized)) return null;
  return (
    <span className={`country-flag${size === "small" ? " country-flag-small" : ""}`} aria-hidden="true">
      <Image
        src={`/flags/${normalized.toLowerCase()}.svg`}
        alt=""
        width={24}
        height={24}
        draggable={false}
        unoptimized
      />
    </span>
  );
}
