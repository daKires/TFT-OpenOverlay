import { useEffect, useRef, useState } from 'react';

// useState com persistência em localStorage: lê o valor inicial e grava a cada mudança.
// Tudo em try/catch — se o localStorage falhar ou estiver indisponível, cai no valor em memória.
export function usePersistentState<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });

  const keyRef = useRef(key);

  useEffect(() => {
    try {
      localStorage.setItem(keyRef.current, JSON.stringify(state));
    } catch {
      // localStorage indisponível — segue só em memória.
    }
  }, [state]);

  return [state, setState];
}
