import React from "react";
import { useDispatch } from "react-redux";
import { scriptEventSelectors } from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import { addBankRef, AssetReference } from "../ReferencesSelect";

interface ScriptEventSymbolsEditorProps {
  id: string;
}

export const ScriptEventSymbolsEditor = ({
  id,
}: ScriptEventSymbolsEditorProps) => {
  const dispatch = useDispatch();
  return (
    <AssetReference
      id={id}
      selector={(state) => scriptEventSelectors.selectById(state, id)}
      onRename={(symbol) => {
        dispatch(
          entitiesActions.setScriptEventSymbol({
            scriptEventId: id,
            symbol,
          })
        );
      }}
      copyTransform={addBankRef}
    />
  );
};
