'use client';

import type { FilterRow } from '../lib/catalog/types';

interface ResultsFilterControlsProps {
  activeFilters: string[];
  filters: FilterRow[];
  onAddFilter: (filterSlug: string) => void;
  onRemoveFilter: (filterSlug: string) => void;
}

export function ResultsFilterControls({
  activeFilters,
  filters,
  onAddFilter,
  onRemoveFilter,
}: ResultsFilterControlsProps) {
  const filterBySlug = new Map(filters.map((filter) => [filter.slug, filter]));

  return (
    <>
      <div aria-label="Active filters" className="filter-chips">
        {activeFilters.length === 0 ? (
          <span className="no-filters">No filters selected</span>
        ) : (
          activeFilters.map((filterSlug) => {
            const label = filterBySlug.get(filterSlug)?.label ?? filterSlug;

            return (
              <span className="filter-chip" key={filterSlug}>
                {label}
                <button
                  aria-label={`Remove ${label} filter`}
                  onClick={() => onRemoveFilter(filterSlug)}
                  type="button"
                >
                  ×
                </button>
              </span>
            );
          })
        )}
      </div>

      <label className="filter-select">
        <span className="visually-hidden">Add a filter</span>
        <select
          aria-label="Add a filter"
          onChange={(event) => {
            if (!event.target.value) return;
            onAddFilter(event.target.value);
          }}
          value=""
        >
          <option value="">+ Add filter</option>
          {filters.map((filter) => (
            <option
              disabled={activeFilters.includes(filter.slug)}
              key={filter.slug}
              value={filter.slug}
            >
              {filter.label}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
