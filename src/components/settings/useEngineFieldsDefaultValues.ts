import { useMemo } from "react";
import { useAppSelector } from "store/hooks";

export const useEngineFieldsDefaultValues = () => {
  const fields = useAppSelector((state) => state.engine.fields);

  return useMemo(
    () =>
      fields.reduce(
        (memo, field) => {
          memo[field.key] = field.defaultValue;
          return memo;
        },
        {} as Record<string, number | string | boolean | undefined>,
      ),
    [fields],
  );
};
