import React from "react";
import { scriptEventSelectors } from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import { addBankRef, AssetReference } from "components/forms/ReferencesSelect";
import { useAppDispatch } from "store/hooks";

interface ScriptEventSymbolsEditorProps {
  id: string;
}

export const ScriptEventSymbolsEditor = ({
  id,
}: ScriptEventSymbolsEditorProps) => {
  const dispatch = useAppDispatch();
  return (
    <AssetReference
      id={id}
      selector={(state) => scriptEventSelectors.selectById(state, id)}
      onRename={(symbol) => {
        dispatch(
          entitiesActions.setScriptEventSymbol({
            scriptEventId: id,
            symbol,
          }),
        );
      }}
      copyTransform={addBankRef}
    />
  );
};
