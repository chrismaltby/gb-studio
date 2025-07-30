import React, { useState, useEffect, FC, useContext } from "react";
import PropTypes from "prop-types";
import { useAppSelector } from "store/hooks";
import { DialogueTextarea } from "ui/form/DialogueTextarea";
import {
  customEventSelectors,
  fontSelectors,
  variableSelectors,
} from "store/features/entities/entitiesState";
import { NamedVariable, namedVariablesByContext } from "renderer/lib/variables";
import { ScriptEditorContext } from "./ScriptEditorContext";

interface ScriptEventFormTextAreaProps {
  id?: string;
  value?: string;
  placeholder?: string;
  entityId: string;
  maxlength?: number;
  singleLine?: boolean;
  onChange: (newValue: string) => void;
}

const ScriptEventFormTextArea: FC<ScriptEventFormTextAreaProps> = ({
  id,
  value = "",
  placeholder,
  maxlength = 52,
  singleLine = false,
  onChange,
  entityId,
}) => {
  const context = useContext(ScriptEditorContext);
  const [variables, setVariables] = useState<NamedVariable[]>([]);
  const fonts = useAppSelector((state) => fontSelectors.selectAll(state));
  const variablesLookup = useAppSelector((state) =>
    variableSelectors.selectEntities(state),
  );
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, entityId),
  );

  useEffect(() => {
    setVariables(
      namedVariablesByContext(context, variablesLookup, customEvent),
    );
  }, [entityId, variablesLookup, context, customEvent]);

  return (
    <DialogueTextarea
      id={id}
      value={value || ""}
      onChange={onChange}
      variables={variables}
      entityId={entityId}
      fonts={fonts}
      placeholder={placeholder}
      maxlength={maxlength}
      singleLine={singleLine}
    />
  );
};

ScriptEventFormTextArea.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  maxlength: PropTypes.number,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  entityId: PropTypes.string.isRequired,
};

export default ScriptEventFormTextArea;
