import React, { useState, useEffect, FC, useContext } from "react";
import PropTypes from "prop-types";
import { useAppSelector } from "store/hooks";
import { MathTextarea } from "ui/form/MathTextarea";
import {
  customEventSelectors,
  variableSelectors,
} from "store/features/entities/entitiesState";
import { NamedVariable, namedVariablesByContext } from "renderer/lib/variables";
import { ScriptEditorContext } from "./ScriptEditorContext";

interface ScriptEventFormMathAreaProps {
  id?: string;
  value?: string;
  placeholder?: string;
  entityId: string;
  onChange: (newValue: string) => void;
}

const ScriptEventFormMathArea: FC<ScriptEventFormMathAreaProps> = ({
  id,
  value,
  placeholder,
  onChange,
  entityId,
}) => {
  const context = useContext(ScriptEditorContext);
  const [variables, setVariables] = useState<NamedVariable[]>([]);
  const variablesLookup = useAppSelector((state) =>
    variableSelectors.selectEntities(state)
  );
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, entityId)
  );

  useEffect(() => {
    setVariables(
      namedVariablesByContext(context, entityId, variablesLookup, customEvent)
    );
  }, [entityId, variablesLookup, context, customEvent]);

  return (
    <MathTextarea
      id={id}
      entityId={entityId}
      value={value || ""}
      onChange={onChange}
      variables={variables}
      placeholder={placeholder}
    />
  );
};

ScriptEventFormMathArea.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  entityId: PropTypes.string.isRequired,
};

ScriptEventFormMathArea.defaultProps = {
  id: undefined,
  value: "",
  placeholder: undefined,
};

export default ScriptEventFormMathArea;
