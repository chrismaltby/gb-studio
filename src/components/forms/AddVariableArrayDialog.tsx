import React, { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { variableSelectors } from "store/features/entities/entitiesSelectors";
import entitiesActions from "store/features/entities/entitiesActions";
import l10n from "shared/lib/lang/l10n";
import {
  isGlobalVariableId,
  nextAvailableVariableIds,
  MAX_GLOBAL_VARIABLES,
} from "shared/lib/variables/variableNames";
import { castEventToInt } from "renderer/lib/helpers/castEventValue";
import { Button } from "ui/buttons/Button";
import { Input } from "ui/form/Input";
import { NumberInput } from "ui/form/NumberInput";
import { FormField, FormRow } from "ui/form/layout/FormLayout";

interface AddVariableArrayDialogProps {
  folderPath?: string;
  onClose: () => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DialogCard = styled.div`
  background: ${(props) => props.theme.colors.sidebar.background};
  border: 1px solid ${(props) => props.theme.colors.button.border};
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  width: 280px;
  padding: 10px;
`;

const DialogTitle = styled.div`
  color: ${(props) => props.theme.colors.text};
  font-size: 13px;
  font-weight: bold;
  padding: 5px 5px 10px;
`;

const DialogButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 5px;
  padding: 10px 5px 5px;
`;

// Small popup allowing the name and size of a new variable array to be
// specified before creating it, optionally within an existing folder
export const AddVariableArrayDialog = ({
  folderPath = "",
  onClose,
}: AddVariableArrayDialogProps) => {
  const dispatch = useAppDispatch();
  const variables = useAppSelector(variableSelectors.selectAll);

  const availableCount = useMemo(
    () =>
      nextAvailableVariableIds(
        variables.map((variable) => variable.id),
        MAX_GLOBAL_VARIABLES,
      ).length,
    [variables],
  );

  const defaultName = useMemo(() => {
    const baseName = l10n("FIELD_VARIABLE_ARRAY_DEFAULT_NAME");
    const prefix = folderPath ? `${folderPath}/` : "";
    const usedNames = new Set(
      variables
        .filter((variable) => isGlobalVariableId(variable.id))
        .map((variable) => variable.name.replace(/\\/g, "/"))
        .filter((variableName) =>
          prefix ? variableName.startsWith(prefix) : true,
        )
        .map((variableName) => variableName.slice(prefix.length).split("/")[0]),
    );
    let name = baseName;
    let counter = 2;
    while (usedNames.has(name)) {
      name = `${baseName} ${counter}`;
      counter++;
    }
    return name;
  }, [variables, folderPath]);

  const [name, setName] = useState(defaultName);
  const [count, setCount] = useState(8);

  const onSubmit = useCallback(() => {
    const trimmedName = name.trim().replace(/^[/\\]+|[/\\]+$/g, "");
    const numVariables = Math.max(1, Math.min(count || 1, availableCount));
    if (!trimmedName || availableCount < 1) {
      return;
    }
    const variableIds = nextAvailableVariableIds(
      variables.map((variable) => variable.id),
      numVariables,
    );
    if (variableIds.length < numVariables) {
      return;
    }
    dispatch(
      entitiesActions.addVariableArray({
        variableIds,
        name: folderPath ? `${folderPath}/${trimmedName}` : trimmedName,
      }),
    );
    onClose();
  }, [availableCount, count, dispatch, folderPath, name, onClose, variables]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSubmit();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <Overlay onMouseDown={onClose}>
      <DialogCard
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <DialogTitle>{l10n("SIDEBAR_ADD_VARIABLE_ARRAY")}</DialogTitle>
        <FormRow>
          <FormField name="addArrayName" label={l10n("FIELD_NAME")}>
            <Input
              id="addArrayName"
              value={name}
              autoFocus
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => setName(e.currentTarget.value)}
            />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField
            name="addArrayCount"
            label={l10n("FIELD_ARRAY_VARIABLE_COUNT")}
          >
            <NumberInput
              id="addArrayCount"
              type="number"
              value={String(count)}
              min={1}
              max={availableCount}
              onChange={(e) => setCount(castEventToInt(e, 1))}
            />
          </FormField>
        </FormRow>
        <DialogButtons>
          <Button onClick={onClose}>{l10n("DIALOG_CANCEL")}</Button>
          <Button variant="primary" onClick={onSubmit}>
            {l10n("DIALOG_OK")}
          </Button>
        </DialogButtons>
      </DialogCard>
    </Overlay>
  );
};
