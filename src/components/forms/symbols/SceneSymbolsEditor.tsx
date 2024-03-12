import React from "react";
import { sceneSelectors } from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import { initScriptSymbol } from "shared/lib/helpers/symbols";
import { addBankRef, AssetReference } from "components/forms/ReferencesSelect";
import { useAppDispatch } from "store/hooks";

interface SceneSymbolsEditorProps {
  id: string;
}

export const SceneSymbolsEditor = ({ id }: SceneSymbolsEditorProps) => {
  const dispatch = useAppDispatch();
  return (
    <AssetReference
      id={id}
      selector={(state) => sceneSelectors.selectById(state, id)}
      onRename={(symbol) => {
        dispatch(
          entitiesActions.setSceneSymbol({
            sceneId: id,
            symbol,
          })
        );
      }}
      copyTransform={addBankRef}
      extraSymbols={(symbol) => [initScriptSymbol(symbol)]}
    />
  );
};
