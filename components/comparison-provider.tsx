'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react';
import {
  loadComparisonIds,
  saveComparisonIds,
  toggleComparisonId,
  COMPARISON_LIMIT,
} from '../lib/storage/comparison-storage';

interface SelectionState {
  ids: number[];
  ready: boolean;
  removedUnavailable: boolean;
}

type SelectionAction =
  | { type: 'restore'; ids: number[] }
  | { type: 'toggle'; id: number }
  | { type: 'reconcile'; availableIds: number[] }
  | { type: 'clear' };

function selectionReducer(
  state: SelectionState,
  action: SelectionAction,
): SelectionState {
  switch (action.type) {
    case 'restore':
      return {
        ...state,
        ids: [...new Set([...action.ids, ...state.ids])].slice(
          0,
          COMPARISON_LIMIT,
        ),
        ready: true,
      };
    case 'toggle':
      return { ...state, ids: toggleComparisonId(state.ids, action.id) };
    case 'clear':
      return { ...state, ids: [], removedUnavailable: false };
    case 'reconcile': {
      const ids = state.ids.filter((id) => action.availableIds.includes(id));
      return ids.length === state.ids.length
        ? state
        : { ...state, ids, removedUnavailable: true };
    }
  }
}

interface ComparisonContextValue extends SelectionState {
  toggle: (id: number) => void;
  clear: () => void;
  reconcile: (availableIds: number[]) => void;
}

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(selectionReducer, {
    ids: [],
    ready: false,
    removedUnavailable: false,
  });

  useEffect(() => {
    dispatch({ type: 'restore', ids: loadComparisonIds() });
  }, []);
  useEffect(() => {
    if (state.ready) saveComparisonIds(state.ids);
  }, [state.ids, state.ready]);

  const toggle = useCallback(
    (id: number) => dispatch({ type: 'toggle', id }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);
  const reconcile = useCallback(
    (availableIds: number[]) => dispatch({ type: 'reconcile', availableIds }),
    [],
  );

  return (
    <ComparisonContext.Provider value={{ ...state, toggle, clear, reconcile }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context)
    throw new Error('Comparison controls require ComparisonProvider.');
  return context;
}
