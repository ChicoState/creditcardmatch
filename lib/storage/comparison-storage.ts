export const COMPARISON_STORAGE_KEY = 'ccm:comparison:v1';
export const COMPARISON_LIMIT = 4;

export function parseComparisonIds(raw: string | null): number[] {
  if (!raw || raw.length > 1024) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return [
      ...new Set(
        value.filter((id): id is number => Number.isSafeInteger(id) && id > 0),
      ),
    ].slice(0, COMPARISON_LIMIT);
  } catch {
    return [];
  }
}

export function toggleComparisonId(ids: number[], id: number): number[] {
  if (ids.includes(id)) return ids.filter((selected) => selected !== id);
  return ids.length < COMPARISON_LIMIT ? [...ids, id] : ids;
}

export function loadComparisonIds(): number[] {
  try {
    return parseComparisonIds(
      window.sessionStorage.getItem(COMPARISON_STORAGE_KEY),
    );
  } catch {
    return [];
  }
}

export function saveComparisonIds(ids: number[]): void {
  try {
    window.sessionStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Selection remains usable in memory when browser storage is unavailable.
  }
}
