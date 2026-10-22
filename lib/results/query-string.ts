const FILTER_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ResultsMode = 'browse' | 'survey';

function uniqueValidSlugs(slugs: string[]): string[] {
  return [
    ...new Set(
      slugs
        .map((slug) => slug.trim())
        .filter((slug) => FILTER_SLUG_PATTERN.test(slug)),
    ),
  ];
}

export function parseFilterSlugs(
  value: string | string[] | null | undefined,
): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return uniqueValidSlugs(values.flatMap((part) => part.split(',')));
}

export function parseResultsMode(
  value: string | null | undefined,
): ResultsMode {
  return value === 'survey' ? 'survey' : 'browse';
}

export function buildResultsHref(
  filterSlugs: string[],
  mode: ResultsMode = 'browse',
): string {
  const normalizedSlugs = uniqueValidSlugs(filterSlugs);
  const modeQuery = mode === 'survey' ? 'mode=survey' : '';
  if (normalizedSlugs.length === 0) {
    return modeQuery ? `/results?${modeQuery}` : '/results';
  }

  return `/results?${modeQuery ? `${modeQuery}&` : ''}filters=${normalizedSlugs.map(encodeURIComponent).join(',')}`;
}

export function addFilterSlug(
  activeFilters: string[],
  filterSlug: string,
): string[] {
  return uniqueValidSlugs([...activeFilters, filterSlug]);
}

export function removeFilterSlug(
  activeFilters: string[],
  filterSlug: string,
): string[] {
  return activeFilters.filter((activeFilter) => activeFilter !== filterSlug);
}
