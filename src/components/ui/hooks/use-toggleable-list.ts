import { useCallback, useState } from "react";

const useToggleableList = <T>(initialState: T[]) => {
  const [values, setValues] = useState<T[]>(initialState);

  const toggle = (id: T) => () => {
    if (isSet(id)) {
      unset(id);
    } else {
      set(id);
    }
  };

  const set = (id: T) => {
    setValues((value) => ([] as T[]).concat(value, id));
  };

  const unset = (id: T) => {
    setValues((value) => value.filter((s) => s !== id));
  };

  const isSet = useCallback(
    (id: T) => {
      return values.includes(id);
    },
    [values]
  );

  return { values, setValues, isSet, toggle, set, unset } as const;
};

export default useToggleableList;
