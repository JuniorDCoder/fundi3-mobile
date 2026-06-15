import { useEffect, useRef, useState } from "react";

/**
 * Keeps a loading flag `true` for at least `minMs` so fast (or cached)
 * resolutions still paint the skeleton instead of flashing past it in a
 * single frame. Pass the real loading flag in; render against the value
 * returned here.
 *
 * Behaviour:
 *  - When `loading` goes true, the floor timer restarts.
 *  - When `loading` goes false, the returned value stays true until the
 *    floor has elapsed since loading first became true.
 *
 * @param loading the underlying loading flag (e.g. from useState/fetch)
 * @param minMs   minimum time the skeleton should remain visible (default 500ms)
 */
export function useMinimumLoading(loading: boolean, minMs = 500): boolean {
  const [delayed, setDelayed] = useState(loading);
  const startedAt = useRef<number | null>(loading ? Date.now() : null);

  useEffect(() => {
    if (loading) {
      // Loading (re)started — restart the floor and show the skeleton.
      startedAt.current = Date.now();
      setDelayed(true);
      return;
    }

    // Loading finished — keep the skeleton until the floor has elapsed.
    const elapsed = startedAt.current ? Date.now() - startedAt.current : minMs;
    const remaining = Math.max(0, minMs - elapsed);

    if (remaining === 0) {
      setDelayed(false);
      return;
    }

    const id = setTimeout(() => setDelayed(false), remaining);
    return () => clearTimeout(id);
  }, [loading, minMs]);

  return delayed;
}
