"use client";

import { useMemo, useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { countryCodes, countryName } from "@/lib/countries";
import { CountryFlag } from "./country-flag";

type CountryOption = { value: string; label: string };

/** One accessible, searchable country control shared by both travel fields. */
export function CountryPicker({
  id,
  value,
  onChange,
  exclude = [],
  placeholder,
  required = false,
  invalid = false,
  describedBy,
  name,
  label,
}: {
  id: string;
  value: string;
  onChange: (code: string) => void;
  exclude?: string[];
  placeholder?: string;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  name?: string;
  label?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("quote");
  const [inputText, setInputText] = useState<string | null>(null);
  const options = useMemo(
    () =>
      countryCodes
        .map((code) => ({ value: code, label: countryName(code, locale) }))
        .sort((a, b) => a.label.localeCompare(b.label, locale)),
    [locale],
  );
  const available = options.filter((option) => !exclude.includes(option.value));
  const selected = options.find((option) => option.value === value) ?? null;
  const showFlag = selected && (inputText === null || inputText === selected.label);

  return (
    <Combobox.Root<CountryOption>
      items={available}
      value={selected}
      onInputValueChange={setInputText}
      onValueChange={(option) => {
        setInputText(null);
        onChange(option?.value ?? "");
      }}
      isItemEqualToValue={(a, b) => a.value === b.value}
      autoHighlight
      required={required}
      name={name}
    >
      <div className={`country-input-group${showFlag ? " has-country-flag" : ""}`}>
        {showFlag && <span className="country-input-flag"><CountryFlag code={selected.value} /></span>}
        <Combobox.Input
          id={id}
          aria-label={label}
          className="input"
          aria-required={required || undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          placeholder={placeholder ?? t("selectCountry")}
        />
        <Combobox.Trigger
          className="country-trigger"
          aria-label={placeholder ?? label ?? t("selectCountry")}
        >
          <ChevronDown size={16} aria-hidden="true" />
        </Combobox.Trigger>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className="popover-positioner" sideOffset={6} positionMethod="fixed">
          <Combobox.Popup className="country-popup">
            <div className="country-search-hint">
              <Search size={14} />
              {t("countrySearch")}
            </div>
            <Combobox.Empty className="country-empty">
              {t("countryEmpty")}
            </Combobox.Empty>
            <Combobox.List className="country-list">
              {(option: CountryOption) => (
                <Combobox.Item
                  key={option.value}
                  value={option}
                  className="country-option country-option-flagged"
                >
                  <CountryFlag code={option.value} />
                  <span className="country-option-name">{option.label}</span>
                  <span className="country-code">{option.value}</span>
                  <Combobox.ItemIndicator>
                    <Check size={16} aria-hidden="true" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
