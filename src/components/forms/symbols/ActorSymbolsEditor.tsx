import React from "react";
import { useDispatch } from "react-redux";
import { actorSelectors } from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import { interactScriptSymbol, updateScriptSymbol } from "lib/helpers/symbols";
import { addBankRef, AssetReference } from "../ReferencesSelect";

interface ActorSymbolsEditorProps {
  id: string;
}

export const ActorSymbolsEditor = ({ id }: ActorSymbolsEditorProps) => {
  const dispatch = useDispatch();
  return (
    <AssetReference
      id={id}
      selector={(state) => actorSelectors.selectById(state, id)}
      onRename={(symbol) => {
        dispatch(
          entitiesActions.setActorSymbol({
            actorId: id,
            symbol,
          })
        );
      }}
      copyTransform={addBankRef}
      extraSymbols={(symbol) => [
        interactScriptSymbol(symbol),
        updateScriptSymbol(symbol),
      ]}
    />
  );
};
