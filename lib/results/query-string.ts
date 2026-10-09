const FILTER_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

export function buildResultsHref(filterSlugs: string[]): string {
  const normalizedSlugs = uniqueValidSlugs(filterSlugs);
  if (normalizedSlugs.length === 0) return '/results';

  return `/results?filters=${normalizedSlugs.map(encodeURIComponent).join(',')}`;
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
