import { useState, useEffect } from "react";

/**
 * Next.js SSR-safe store hook
 *
 * Prevents hydration mismatch by waiting for client-side mount
 * before returning persisted store data.
 *
 * @see https://zustand.docs.pmnd.rs/integrations/persisting-store-data#usage-in-next.js
 *
 * @example
 * // Instead of:
 * const bears = useBearStore((state) => state.bears)
 *
 * // Use:
 * const bears = useStore(useBearStore, (state) => state.bears)
 */
const useStore = <T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  callback: (state: T) => F
): F | undefined => {
  const result = store(callback) as F;
  const [data, setData] = useState<F>();

  useEffect(() => {
    setData(result);
  }, [result]);

  return data;
};

export default useStore;
