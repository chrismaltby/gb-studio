import React, { useState, useEffect, FC, useContext } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { MathTextarea } from "ui/form/MathTextarea";
import {
  customEventSelectors,
  variableSelectors,
} from "store/features/entities/entitiesState";
import { RootState } from "store/configureStore";
import { NamedVariable, namedVariablesByContext } from "lib/helpers/variables";
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
  const variablesLookup = useSelector((state: RootState) =>
    variableSelectors.selectEntities(state)
  );
  const customEvent = useSelector((state: RootState) =>
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
      context={context}
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
