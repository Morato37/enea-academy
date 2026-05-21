import { useEffect, useRef, useState, useCallback } from 'react';

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  options: { debounceMs?: number; enabled?: boolean } = {}
) {
  const { debounceMs = 1500, enabled = true } = options;

  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDataRef = useRef<T>(data);
  const isFirstRender = useRef(true);
  const isSavingRef = useRef(false);

  const saveNow = useCallback(async (d: T) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setStatus('saving');
    try {
      await saveFn(d);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    } catch {
      setStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [saveFn]);

  useEffect(() => {
    latestDataRef.current = data;

    if (!enabled) return;

    // Skip the initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setStatus('pending');

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveNow(latestDataRef.current);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, enabled, debounceMs, saveNow]);

  const flushSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    return saveNow(latestDataRef.current);
  }, [saveNow]);

  return { status, flushSave };
}
