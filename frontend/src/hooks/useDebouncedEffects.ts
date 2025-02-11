// hooks/useDebouncedEffect.ts
import { useEffect, useRef } from 'react';

/**
 * Custom hook to debounce a value.
 * @param {Function} callback - The function to debounce.
 * @param {number} delay - The debounce delay in milliseconds.
 * @param {Array} deps - Dependencies array.
 */
function useDebouncedEffect(callback: () => void, delay: number, deps: any[]) {
  const handler = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (handler.current) {
      clearTimeout(handler.current);
    }

    handler.current = setTimeout(() => {
      callback();
    }, delay);

    return () => {
      if (handler.current) {
        clearTimeout(handler.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}

export default useDebouncedEffect;
