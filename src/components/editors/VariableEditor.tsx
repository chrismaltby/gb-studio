import React, { FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  globalVariableCode,
  globalVariableDefaultName,
} from "../../lib/helpers/variables";
import { RootState } from "../../store/configureStore";
import { variableSelectors } from "../../store/features/entities/entitiesState";
import { DropdownButton } from "../ui/buttons/DropdownButton";
import { EditableText } from "../ui/form/EditableText";
import { FormContainer, FormHeader } from "../ui/form/FormLayout";
import { MenuItem } from "../ui/menu/Menu";
import entitiesActions from "../../store/features/entities/entitiesActions";
import clipboardActions from "../../store/features/clipboard/clipboardActions";

interface VariableEditorProps {
  id: string;
}

export const VariableEditor: FC<VariableEditorProps> = ({ id }) => {
  const variable = useSelector((state: RootState) =>
    variableSelectors.selectById(state, id)
  );
  const dispatch = useDispatch();

  const onRename = (e: React.ChangeEvent<HTMLInputElement>) => {
    const editValue = e.currentTarget.value;
    dispatch(
      entitiesActions.renameVariable({
        variableId: id,
        name: editValue,
      })
    );
  };

  const onCopyVar = () => {
    dispatch(clipboardActions.copyText(`$${globalVariableCode(id)}$`));
  };

  const onCopyChar = () => {
    dispatch(clipboardActions.copyText(`#${globalVariableCode(id)}#`));
  };

  return (
    <FormContainer>
      <FormHeader>
        <EditableText
          name="name"
          placeholder={globalVariableDefaultName(id)}
          value={variable?.name || ""}
          onChange={onRename}
        />
        <DropdownButton
          size="small"
          variant="transparent"
          menuDirection="right"
        >
          <MenuItem onClick={onCopyVar}>Copy Embed Code</MenuItem>
          <MenuItem onClick={onCopyChar}>Copy Embed Character Code</MenuItem>
        </DropdownButton>
      </FormHeader>
    </FormContainer>
  );
};
