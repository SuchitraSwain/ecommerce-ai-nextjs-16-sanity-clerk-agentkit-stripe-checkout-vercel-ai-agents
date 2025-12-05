import type { StoreApi, UseBoundStore } from "zustand";

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

/**
 * Auto-generates selectors for a Zustand store
 * @see https://zustand.docs.pmnd.rs/guides/auto-generating-selectors
 *
 * Usage:
 * const useStore = createSelectors(useStoreBase)
 * const bears = useStore.use.bears()
 */
export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S
) => {
  const store = _store as WithSelectors<typeof _store>;
  store.use = {} as typeof store.use;

  for (const k of Object.keys(store.getState())) {
    (store.use as Record<string, () => unknown>)[k] = () =>
      store((s) => s[k as keyof typeof s]);
  }

  return store;
};
