import React, { useState, useEffect, FC, useContext, useMemo } from "react";
import { useAppSelector } from "store/hooks";
import { MathTextarea, NamedConstant } from "ui/form/MathTextarea";
import {
  constantSelectors,
  customEventSelectors,
  variableSelectors,
} from "store/features/entities/entitiesSelectors";
import { NamedVariable, namedVariablesByContext } from "renderer/lib/variables";
import { ScriptEditorContext } from "components/script/context/ScriptEditorContext";
import { Constant } from "shared/lib/resources/types";
import { constantName } from "shared/lib/entities/entitiesHelpers";

interface ScriptEventFormMathAreaProps {
  id?: string;
  value?: string;
  placeholder?: string;
  entityId: string;
  onChange: (newValue: string) => void;
}

const namedConstants = (constants: Constant[]): NamedConstant[] => {
  return constants.map((constant, constantIndex) => ({
    id: constant.id,
    name: constantName(constant, constantIndex),
  }));
};

const ScriptEventFormMathArea: FC<ScriptEventFormMathAreaProps> = ({
  id,
  value,
  placeholder,
  onChange,
  entityId,
}: ScriptEventFormMathAreaProps) => {
  const context = useContext(ScriptEditorContext);
  const [variables, setVariables] = useState<NamedVariable[]>([]);
  const variablesLookup = useAppSelector((state) =>
    variableSelectors.selectEntities(state),
  );
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, entityId),
  );
  const allConstants = useAppSelector(constantSelectors.selectAll);
  const engineConstants = useAppSelector((state) => state.engine.consts);

  const constants = useMemo(() => namedConstants(allConstants), [allConstants]);

  useEffect(() => {
    setVariables(
      namedVariablesByContext(context, variablesLookup, customEvent),
    );
  }, [entityId, variablesLookup, context, customEvent]);

  return (
    <MathTextarea
      id={id}
      entityId={entityId}
      value={value || ""}
      onChange={onChange}
      variables={variables}
      constants={constants}
      engineConstants={engineConstants}
      placeholder={placeholder}
    />
  );
};

export default ScriptEventFormMathArea;
