import React from "react";
import { triggerSelectors } from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import { interactScriptSymbol } from "shared/lib/helpers/symbols";
import { addBankRef, AssetReference } from "components/forms/ReferencesSelect";
import { useAppDispatch } from "store/hooks";

interface TriggerSymbolsEditorProps {
  id: string;
}

export const TriggerSymbolsEditor = ({ id }: TriggerSymbolsEditorProps) => {
  const dispatch = useAppDispatch();
  return (
    <AssetReference
      id={id}
      selector={(state) => triggerSelectors.selectById(state, id)}
      onRename={(symbol) => {
        dispatch(
          entitiesActions.setTriggerSymbol({
            triggerId: id,
            symbol,
          }),
        );
      }}
      copyTransform={addBankRef}
      extraSymbols={(symbol) => [interactScriptSymbol(symbol)]}
    />
  );
};
