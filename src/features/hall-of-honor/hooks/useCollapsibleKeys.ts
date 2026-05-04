import { useCallback, useState } from "react";

/**
 * Set key đang thu gọn (accordion năm học / học bổng) — thay lặp useState(new Set()).
 */
export function useCollapsibleKeys<K extends string = string>() {
  const [collapsedKeys, setCollapsedKeys] = useState(() => new Set<K>());

  const toggleKey = useCallback((key: K) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const clearKeys = useCallback(() => {
    setCollapsedKeys(new Set());
  }, []);

  return { collapsedKeys, setCollapsedKeys, toggleCollapsedKey: toggleKey, clearCollapsedKeys: clearKeys };
}
