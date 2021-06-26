/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import debounce from "lodash/debounce";
import { useMemo, DependencyList } from "react";

const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList,
  wait: number
): T => {
  return useMemo(() => debounce(callback, wait), deps);
};

export default useDebouncedCallback;
