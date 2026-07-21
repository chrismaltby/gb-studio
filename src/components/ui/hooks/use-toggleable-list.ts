import { useCallback, useEffect, useState } from "react";

const toggleableListCache: Record<string, unknown[]> = {};

const useToggleableList = <T>(initialState: T[], cacheKey?: string) => {
  const [values, setValues] = useState<T[]>(() =>
    cacheKey && toggleableListCache[cacheKey]
      ? (toggleableListCache[cacheKey] as T[])
      : initialState,
  );

  useEffect(() => {
    if (cacheKey) {
      toggleableListCache[cacheKey] = values;
    }
  }, [cacheKey, values]);

  const set = useCallback((id: T) => {
    setValues((value) => ([] as T[]).concat(value, id));
  }, []);

  const unset = useCallback((id: T) => {
    setValues((value) => value.filter((s) => s !== id));
  }, []);

  const isSet = useCallback(
    (id: T) => {
      return values.includes(id);
    },
    [values],
  );

  const toggle = useCallback(
    (id: T) => {
      if (isSet(id)) {
        unset(id);
      } else {
        set(id);
      }
    },
    [isSet, set, unset],
  );

  return { values, setValues, isSet, toggle, set, unset } as const;
};

export default useToggleableList;
