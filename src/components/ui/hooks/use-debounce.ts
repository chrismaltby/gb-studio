/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useCallback } from "react";
import { useIsMounted } from "./use-is-mounted";
import debounce from "lodash/debounce";

export const useDebounce = <T extends (...args: Array<any>) => any>(
  cb: T,
  delay: number
) => {
  const inputsRef = useRef({ cb, delay });
  const isMounted = useIsMounted();
  useEffect(() => {
    inputsRef.current = { cb, delay };
  });
  return useCallback(
    debounce((...args: Parameters<T>) => {
      // Debounce is an async callback. Cancel it, if in the meanwhile
      // (1) component has been unmounted (see isMounted in snippet)
      // (2) delay has changed
      if (inputsRef.current.delay === delay && isMounted()) {
        inputsRef.current.cb(...args);
      }
    }, delay),
    [delay, debounce]
  );
};
