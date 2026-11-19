import { useState } from "react";

export function loadSessionValue<T>(key: string, fallback: T): T {
  try {
    const saved = window.sessionStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

export function storeSessionValue<T>(key: string, value: T) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The current page remains usable when storage is unavailable.
  }
}

export function useSessionState<T>(key: string, fallback: T) {
  const [value, setValue] = useState(() => loadSessionValue(key, fallback));
  const update = (next: T) => {
    storeSessionValue(key, next);
    setValue(next);
  };
  return [value, update] as const;
}
