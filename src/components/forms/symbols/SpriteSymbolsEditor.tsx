import React from "react";
import { spriteSheetSelectors } from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import { tilesetSymbol } from "shared/lib/helpers/symbols";
import { addBankRef, AssetReference } from "components/forms/ReferencesSelect";
import { useAppDispatch } from "store/hooks";

interface SpriteSymbolsEditorProps {
  id: string;
}

export const SpriteSymbolsEditor = ({ id }: SpriteSymbolsEditorProps) => {
  const dispatch = useAppDispatch();
  return (
    <AssetReference
      id={id}
      selector={(state) => spriteSheetSelectors.selectById(state, id)}
      onRename={(symbol) => {
        dispatch(
          entitiesActions.setSpriteSheetSymbol({
            spriteSheetId: id,
            symbol,
          })
        );
      }}
      copyTransform={addBankRef}
      extraSymbols={(symbol) => [tilesetSymbol(symbol)]}
    />
  );
};
