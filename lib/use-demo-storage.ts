"use client";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

/** Fictional demo values survive reloads in this tab; no server or credentials. */
export function useDemoStorage<T>(
  key: string,
  initial: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const storageKey = `mind-nexus-editorial-v1:${key}`;
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    queueMicrotask(() => {
      if (!alive.current) return;
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved !== null) setValue(JSON.parse(saved) as T);
      } catch {
        /* Storage can be unavailable; the in-memory demo still works. */
      }
      setReady(true);
    });
    return () => {
      alive.current = false;
    };
  }, [storageKey]);
  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* In-memory fallback. */
    }
  }, [value, ready, storageKey]);
  return [value, setValue];
}
