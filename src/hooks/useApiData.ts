import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

// =====================================
// useApiData
//
// The backend is the only source of
// truth. There is no bundled fallback:
// if a call fails the page says so and
// shows an empty state, because a
// dashboard that invents plausible
// numbers is worse than one that admits
// it has none.
// =====================================

export type ApiData<T> = {
  /** Null until the first successful load. */
  data: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
};

export type ApiDataOptions = {
  /**
   * Poll interval. "Live" pages pass this so
   * the numbers keep moving; the analytics
   * endpoints default to the last 15 minutes
   * when called with no range, which is
   * exactly what a poll wants.
   */
  refreshMs?: number;
};

export function useApiData<T>(
  fetcher: (
    signal: AbortSignal
  ) => Promise<T>,
  deps: unknown[] = [],
  options: ApiDataOptions = {}
): ApiData<T> {
  const { refreshMs } = options;

  const [data, setData] =
    useState<T | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<Error | null>(null);

  const [reloadCount, setReloadCount] =
    useState(0);

  // Keep the latest fetcher without making it a
  // dependency — callers pass an inline arrow,
  // which would otherwise refetch every render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;

    setLoading(true);

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (disposed) {
          return;
        }

        setData(result);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (
          disposed ||
          controller.signal.aborted
        ) {
          return;
        }

        // The previous data is left on screen
        // rather than blanked: a single failed
        // poll should not clear a working page.
        setError(
          cause instanceof Error
            ? cause
            : new Error(String(cause))
        );
      })
      .finally(() => {
        if (!disposed) {
          setLoading(false);
        }
      });

    return () => {
      disposed = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadCount]);

  const reload = useCallback(() => {
    setReloadCount((n) => n + 1);
  }, []);

  // Polling is a separate effect so changing
  // the interval does not re-run the fetch, and
  // an in-flight request is never interrupted
  // by its own timer.
  useEffect(() => {
    if (!refreshMs) {
      return;
    }

    const timer = window.setInterval(
      reload,
      refreshMs
    );

    return () => {
      window.clearInterval(timer);
    };
  }, [refreshMs, reload]);

  return { data, loading, error, reload };
}
