import type { FilterRow } from '../catalog/types';

export function findMissingFilterSlugs(
  referencedSlugs: readonly string[],
  filters: readonly Pick<FilterRow, 'slug'>[],
): string[] {
  const availableSlugs = new Set(filters.map((filter) => filter.slug));

  return [
    ...new Set(
      referencedSlugs.filter((filterSlug) => !availableSlugs.has(filterSlug)),
    ),
  ];
}
