import React from "react";
import { useDispatch } from "react-redux";
import { triggerSelectors } from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import { interactScriptSymbol } from "lib/helpers/symbols";
import { addBankRef, AssetReference } from "../ReferencesSelect";

interface TriggerSymbolsEditorProps {
  id: string;
}

export const TriggerSymbolsEditor = ({ id }: TriggerSymbolsEditorProps) => {
  const dispatch = useDispatch();
  return (
    <AssetReference
      id={id}
      selector={(state) => triggerSelectors.selectById(state, id)}
      onRename={(symbol) => {
        dispatch(
          entitiesActions.setTriggerSymbol({
            triggerId: id,
            symbol,
          })
        );
      }}
      copyTransform={addBankRef}
      extraSymbols={(symbol) => [interactScriptSymbol(symbol)]}
    />
  );
};
