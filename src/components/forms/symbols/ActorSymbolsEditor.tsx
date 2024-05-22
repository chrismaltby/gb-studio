import React from "react";
import { actorSelectors } from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import {
  interactScriptSymbol,
  updateScriptSymbol,
} from "shared/lib/helpers/symbols";
import { addBankRef, AssetReference } from "components/forms/ReferencesSelect";
import { useAppDispatch } from "store/hooks";

interface ActorSymbolsEditorProps {
  id: string;
}

export const ActorSymbolsEditor = ({ id }: ActorSymbolsEditorProps) => {
  const dispatch = useAppDispatch();
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
