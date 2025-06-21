import { useCallback, useState } from "react";

const useToggleableList = <T>(initialState: T[]) => {
  const [values, setValues] = useState<T[]>(initialState);

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
