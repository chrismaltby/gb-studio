import React, { useState, useEffect, FC } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { DialogueTextarea } from "ui/form/DialogueTextarea";
import {
  customEventSelectors,
  fontSelectors,
  variableSelectors,
} from "store/features/entities/entitiesState";
import { RootState } from "store/configureStore";
import { NamedVariable, namedVariablesByContext } from "lib/helpers/variables";

interface ScriptEventFormTextAreaProps {
  id?: string;
  value?: string;
  placeholder?: string;
  entityId: string;
  maxlength?: number;
  onChange: (newValue: string) => void;
}

const ScriptEventFormTextArea: FC<ScriptEventFormTextAreaProps> = ({
  id,
  value,
  placeholder,
  maxlength,
  onChange,
  entityId,
}) => {
  const [variables, setVariables] = useState<NamedVariable[]>([]);
  const fonts = useSelector((state: RootState) =>
    fontSelectors.selectAll(state)
  );

  const editorType = useSelector((state: RootState) => state.editor.type);
  const variablesLookup = useSelector((state: RootState) =>
    variableSelectors.selectEntities(state)
  );
  const customEvent = useSelector((state: RootState) =>
    customEventSelectors.selectById(state, entityId)
  );

  useEffect(() => {
    setVariables(
      namedVariablesByContext(
        editorType,
        entityId,
        variablesLookup,
        customEvent
      )
    );
  }, [entityId, variablesLookup, editorType, customEvent]);

  return (
    <DialogueTextarea
      id={id}
      value={value || ""}
      onChange={onChange}
      variables={variables}
      editorType={editorType}
      entityId={entityId}
      fonts={fonts}
      placeholder={placeholder}
      maxlength={maxlength}
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

ScriptEventFormTextArea.defaultProps = {
  id: undefined,
  value: "",
  maxlength: 52,
  placeholder: undefined,
};

export default ScriptEventFormTextArea;
