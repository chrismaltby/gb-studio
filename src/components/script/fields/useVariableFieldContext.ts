import { useContext, useMemo } from "react";
import { ScriptEditorContext } from "components/script/context/ScriptEditorContext";
import { namedVariablesByContext } from "renderer/lib/variables";
import {
  customEventSelectors,
  variableSelectors,
} from "store/features/entities/entitiesSelectors";
import { useAppSelector } from "store/hooks";
import type { VariableFieldCandidate } from "./fieldHelpers";

export const useVariableFieldContext = (entityId: string) => {
  const context = useContext(ScriptEditorContext);
  const variablesLookup = useAppSelector((state) =>
    variableSelectors.selectEntities(state),
  );
  const allVariables = useAppSelector((state) =>
    variableSelectors.selectAll(state),
  );
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, entityId),
  );
  const variables = useMemo(
    () => namedVariablesByContext(context, allVariables, customEvent),
    [allVariables, context, customEvent],
  );
  const candidates = useMemo<VariableFieldCandidate[]>(
    () =>
      variables.map(({ id }) => ({
        id,
        type:
          variablesLookup[id]?.type ??
          (customEvent?.variables[id]?.passByReference === "array"
            ? "array"
            : "number"),
      })),
    [customEvent, variables, variablesLookup],
  );

  return { candidates, customEvent, variables, variablesLookup };
};
