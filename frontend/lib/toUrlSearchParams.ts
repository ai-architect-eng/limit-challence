export type SearchParams = Record<string, string | string[] | undefined>;

export function toURLSearchParams(values: SearchParams): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const entry of value) params.append(key, entry);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params;
}
