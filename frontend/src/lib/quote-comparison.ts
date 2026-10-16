import type { Coverage, Quote } from "./contracts";

function sameBenefit(a: Coverage | undefined, b: Coverage | undefined) {
  if (!a || !b) return a === b;
  return a.status === b.status && a.limitCents === b.limitCents &&
    a.scope === b.scope && a.deductibleCents === b.deductibleCents &&
    (a.condition ?? "") === (b.condition ?? "");
}

/** Compare the union, so an absent benefit never hides another plan's cover. */
export function comparisonBenefits(quotes: Pick<Quote, "coverage">[], differences: boolean): Coverage["key"][] {
  const keys = [...new Set(quotes.flatMap(quote => quote.coverage.map(item => item.key)))];
  return keys.filter(key => !differences || quotes.some(quote =>
    !sameBenefit(quotes[0]?.coverage.find(item => item.key === key), quote.coverage.find(item => item.key === key)),
  ));
}

export function exclusionsDiffer(quotes: Pick<Quote, "exclusions">[]) {
  const normalized = quotes.map(quote => JSON.stringify([...new Set(quote.exclusions)].sort()));
  return normalized.some(value => value !== normalized[0]);
}
