import { useEffect, useState } from "react";

export type CounterTargets = Record<string, number>;

/**
 * Đếm số animated từ 0 → target khi `startWhen` = true (homepage thống kê).
 */
export function useAnimatedCounters(
  targetCounts: CounterTargets,
  startWhen: boolean,
  durationMs = 1000,
  steps = 60,
) {
  const initial = Object.fromEntries(
    Object.keys(targetCounts).map((k) => [k, 0]),
  ) as CounterTargets;
  const [counts, setCounts] = useState<CounterTargets>(initial);

  useEffect(() => {
    if (!startWhen) return;

    const interval = durationMs / steps;
    const counters: Record<string, ReturnType<typeof setInterval>> = {};

    for (const key of Object.keys(targetCounts)) {
      const target = targetCounts[key];
      const increment = target / steps;
      let current = 0;

      counters[key] = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(counters[key]);
        }
        setCounts((prev) => ({
          ...prev,
          [key]: Math.floor(current),
        }));
      }, interval);
    }

    return () => {
      for (const c of Object.values(counters)) {
        clearInterval(c);
      }
    };
  }, [startWhen, durationMs, steps, targetCounts]);

  return counts;
}
