import { useContext, useMemo } from "react";
import { ScriptEditorContext } from "components/script/context/ScriptEditorContext";
import { namedVariablesByContext } from "renderer/lib/variables";
import {
  customEventSelectors,
  variableSelectors,
} from "store/features/entities/entitiesSelectors";
import { useAppSelector } from "store/hooks";
import type { VariableFieldCandidate } from "./variableFieldType";

export const useVariableFieldContext = (entityId: string) => {
  const context = useContext(ScriptEditorContext);
  const variablesLookup = useAppSelector((state) =>
    variableSelectors.selectEntities(state),
  );
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, entityId),
  );
  const candidates = useMemo<VariableFieldCandidate[]>(
    () =>
      namedVariablesByContext(context, variablesLookup, customEvent).map(
        ({ id }) => ({
          id,
          type:
            variablesLookup[id]?.type ??
            (customEvent?.variables[id]?.passByReference === "array"
              ? "array"
              : "number"),
        }),
      ),
    [context, customEvent, variablesLookup],
  );

  return { candidates, customEvent, variablesLookup };
};
