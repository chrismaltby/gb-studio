import React from "react";
import { customEventSelectors } from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import { addBankRef, AssetReference } from "components/forms/ReferencesSelect";
import { useAppDispatch } from "store/hooks";

interface CustomEventSymbolsEditorProps {
  id: string;
}

export const CustomEventSymbolsEditor = ({
  id,
}: CustomEventSymbolsEditorProps) => {
  const dispatch = useAppDispatch();
  return (
    <AssetReference
      id={id}
      selector={(state) => customEventSelectors.selectById(state, id)}
      onRename={(symbol) => {
        dispatch(
          entitiesActions.setCustomEventSymbol({
            customEventId: id,
            symbol,
          })
        );
      }}
      copyTransform={addBankRef}
    />
  );
};
