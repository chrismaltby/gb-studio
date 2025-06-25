import type { EngineFieldSchema } from "store/features/engine/engineState";
import type { EngineFieldValue } from "shared/lib/entities/entitiesTypes";
import { evaluateConditions } from "shared/lib/conditionsFilter";

export const isEngineFieldVisible = (
  field: EngineFieldSchema,
  args: Record<string, EngineFieldValue>,
  defaultValues: Record<string, number | string | boolean | undefined>,
  ignoreConditions?: string[],
) => {
  if (!field.conditions) {
    return true;
  }
  return evaluateConditions(
    field.conditions,
    (key) => args[key]?.value ?? defaultValues[key],
    ignoreConditions,
  );
};
