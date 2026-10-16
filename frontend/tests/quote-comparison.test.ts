import { describe, expect, it } from "vitest";
import type { Coverage } from "../src/lib/contracts";
import { comparisonBenefits, exclusionsDiffer } from "../src/lib/quote-comparison";

const medical: Coverage = { key: "medical", status: "covered", limitCents: 100000, scope: "per_person", deductibleCents: 0 };
const baggage: Coverage = { ...medical, key: "baggage" };
const plans = (...coverage: Coverage[][]) => coverage.map(items => ({ coverage: items }));

describe("complete quote comparison", () => {
  it("includes benefits found only in later plans, in either selection order", () => {
    expect(comparisonBenefits(plans([medical], [medical, baggage]), false)).toEqual(["medical", "baggage"]);
    expect(comparisonBenefits(plans([medical], [medical, baggage]), true)).toEqual(["baggage"]);
    expect(comparisonBenefits(plans([medical, baggage], [medical]), true)).toEqual(["baggage"]);
  });
  it("compares semantic fields without treating property order as a difference", () => {
    const reordered: Coverage = { deductibleCents: 0, scope: "per_person", limitCents: 100000, status: "covered", key: "medical" };
    expect(comparisonBenefits(plans([medical], [reordered]), true)).toEqual([]);
    for (const change of [{ limitCents: 200000 }, { deductibleCents: 50 }, { scope: "per_trip" as const }, { status: "conditional" as const, condition: "listed_reasons" }]) {
      expect(comparisonBenefits(plans([medical], [{ ...medical, ...change }]), true)).toEqual(["medical"]);
    }
  });
  it("keeps missing information distinct from an excluded benefit", () => {
    expect(comparisonBenefits(plans([], [{ ...baggage, status: "excluded" }]), true)).toEqual(["baggage"]);
    expect(comparisonBenefits([], true)).toEqual([]);
  });
  it("ignores exclusion ordering but retains a different exclusion", () => {
    expect(exclusionsDiffer([{ exclusions: ["sports", "known"] }, { exclusions: ["known", "sports"] }])).toBe(false);
    expect(exclusionsDiffer([{ exclusions: ["sports"] }, { exclusions: ["known"] }])).toBe(true);
  });
});
