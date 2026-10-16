import { expect, it } from "vitest";
import { dateForInput, dateInputToIso, isCalendarDate } from "../src/lib/date-input";

it("keeps the same calendar date through customer entry, saved ISO and reopened editing", () => {
  for (const entry of ["20/05/1996", "20.05.1996", "20-05-1996", "1996-05-20"]) {
    const saved = dateInputToIso(entry);
    expect(saved).toBe("1996-05-20");
    expect(dateInputToIso(dateForInput(saved))).toBe(saved);
  }
  expect(dateInputToIso("5/2/1996")).toBe("1996-02-05");
});
it("preserves incomplete edits and does not reinterpret an invalid month as a different valid date", () => {
  expect(dateForInput(dateInputToIso("20/05/199"))).toBe("20/05/199");
  expect(dateInputToIso("05/20/1996")).toBe("1996-20-05");
});
it("completes the date using only mobile number-pad digits and preserves a year edit", () => {
  let input = "";
  for (const digit of "20051996") input = dateForInput(dateInputToIso(input + digit));
  expect(input).toBe("20/05/1996");
  expect(dateInputToIso(input)).toBe("1996-05-20");
  expect(dateInputToIso("20051996")).toBe("1996-05-20");
  expect(dateForInput(input.slice(0, -1))).toBe("20/05/199");
});

it("preserves day, month and year boundaries when editing the middle of a partial date", () => {
  for (const partial of ["0/05/199", "20/5/199", "20/05/199", "20//1996"]) {
    expect(dateForInput(dateInputToIso(partial))).toBe(partial);
  }
});

it("rejects partial and impossible incident dates while preserving real leap days", () => {
  for (const invalid of ["2026-02-29", "2026-04-31", "2026-13-01", "13/10/202", "2026-1-2", ""]) {
    expect(isCalendarDate(invalid)).toBe(false);
  }
  expect(isCalendarDate(dateInputToIso("29/02/2024"))).toBe(true);
  expect(isCalendarDate(dateInputToIso("13102026"))).toBe(true);
});
