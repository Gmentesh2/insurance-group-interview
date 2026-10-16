/** Complete day/month/year input becomes ISO; incomplete edits stay intact. */
export function dateInputToIso(value: string) {
  const parts = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(value.trim());
  if (parts) return `${parts[3]}-${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
  if (/^\d{8}$/.test(value)) return `${value.slice(4)}-${value.slice(2, 4)}-${value.slice(0, 2)}`;
  return value;
}

export function dateForInput(value: string) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (parts) return `${parts[3]}/${parts[2]}/${parts[1]}`;
  // Format numeric entry without moving digits between existing date segments.
  if (/^\d{1,8}$/.test(value)) return value.slice(0, 2) + (value.length > 2 ? `/${value.slice(2, 4)}` : "") + (value.length > 4 ? `/${value.slice(4)}` : "");
  const appendedYear = /^(\d{2})\/(\d{3,6})$/.exec(value);
  if (appendedYear) return `${appendedYear[1]}/${appendedYear[2].slice(0, 2)}/${appendedYear[2].slice(2)}`;
  return value;
}

/** Reject partial input and dates that JavaScript would normalize into another day. */
export function isCalendarDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
