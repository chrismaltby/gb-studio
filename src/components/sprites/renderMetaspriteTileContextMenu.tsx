import React, { Dispatch } from "react";
import { UnknownAction } from "redux";
import l10n from "shared/lib/lang/l10n";
import entitiesActions from "store/features/entities/entitiesActions";
import { MenuDivider, MenuItem } from "ui/menu/Menu";

interface MetaspriteTileContextMenuProps {
  dispatch: Dispatch<UnknownAction>;
  spriteSheetId: string;
  metaspriteId: string;
  selectedTileIds: string[];
  onRename?: () => void;
}

const renderMetaspriteTileContextMenu = ({
  dispatch,
  spriteSheetId,
  metaspriteId,
  selectedTileIds,
}: MetaspriteTileContextMenuProps) => {
  return [
    <MenuItem
      key="send-front"
      onClick={() =>
        dispatch(
          entitiesActions.sendMetaspriteTilesToFront({
            spriteSheetId,
            metaspriteTileIds: selectedTileIds,
            metaspriteId: metaspriteId,
          }),
        )
      }
    >
      {l10n("FIELD_BRING_TO_FRONT")}
    </MenuItem>,
    <MenuItem
      key="send=-back"
      onClick={() =>
        dispatch(
          entitiesActions.sendMetaspriteTilesToBack({
            spriteSheetId,
            metaspriteTileIds: selectedTileIds,
            metaspriteId: metaspriteId,
          }),
        )
      }
    >
      {l10n("FIELD_SEND_TO_BACK")}
    </MenuItem>,

    <MenuDivider key="div-flip" />,

    <MenuItem
      key="flip-h"
      onClick={() =>
        dispatch(
          entitiesActions.flipXMetaspriteTiles({
            spriteSheetId,
            metaspriteTileIds: selectedTileIds,
          }),
        )
      }
    >
      {l10n("FIELD_FLIP_HORIZONTAL")}
    </MenuItem>,
    <MenuItem
      key="flip-v"
      onClick={() =>
        dispatch(
          entitiesActions.flipYMetaspriteTiles({
            spriteSheetId,
            metaspriteTileIds: selectedTileIds,
          }),
        )
      }
    >
      {l10n("FIELD_FLIP_VERTICAL")}
    </MenuItem>,
    <MenuDivider key="div-delete" />,
    <MenuItem
      key="delete"
      onClick={() =>
        dispatch(
          entitiesActions.removeMetaspriteTiles({
            spriteSheetId,
            metaspriteTileIds: selectedTileIds,
            metaspriteId,
          }),
        )
      }
    >
      {selectedTileIds.length > 1
        ? l10n("MENU_SPRITE_TILES_DELETE")
        : l10n("MENU_SPRITE_TILE_DELETE")}
    </MenuItem>,
  ];
};

export default renderMetaspriteTileContextMenu;
