import { useRef, useCallback } from "react";

type AnyFunction = (...args: any[]) => any;

/**
 * A hook that returns a memoized version of the function that only changes if one of the function's dependencies changes.
 * Unlike useCallback, it ensures that the function reference remains stable between renders
 * even if the function body changes (assuming the function is defined within a component).
 * This is particularly useful for functions that are dependencies of other hooks and for event handlers.
 *
 * @param fn The function to memoize
 * @returns A memoized version of the function
 */
export function useMemoizedFn<T extends AnyFunction>(fn: T): T {
  // Use a ref to store the function to keep its identity stable
  const fnRef = useRef<T>(fn);

  // Update the ref value when the function changes
  fnRef.current = fn;

  // Return a stable callback that delegates to the current function in the ref
  // The returned function's identity will not change between renders
  const memoizedFn = useCallback((...args: Parameters<T>): ReturnType<T> => {
    return fnRef.current(...args);
  }, []);

  return memoizedFn as T;
}
