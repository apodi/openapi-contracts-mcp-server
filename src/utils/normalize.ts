/**
 * Conservative normalization:
 * - ensures stable ordering to reduce noisy diffs
 * - does NOT try to “interpret” spec semantics
 */
export function normalizeSpec(spec: any) {
  if (!spec || typeof spec !== "object") return spec;
  return deepSortKeys(spec);
}

function deepSortKeys(value: any): any {
  if (Array.isArray(value)) return value.map(deepSortKeys);
  if (value && typeof value === "object") {
    const out: any = {};
    for (const k of Object.keys(value).sort((a, b) => a.localeCompare(b))) {
      out[k] = deepSortKeys(value[k]);
    }
    return out;
  }
  return value;
}