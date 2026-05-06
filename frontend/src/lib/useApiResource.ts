"use client";

import { useCallback, useEffect, useState } from "react";

export function useApiResource<T>(loader: (refresh?: boolean) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      setLoading(true);
      setError(null);
      try {
        setData(await loader(refresh));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "API error");
      } finally {
        setLoading(false);
      }
    },
    [loader],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void load(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  return { data, loading, error, refresh: () => load(true) };
}
