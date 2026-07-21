import PaletteBlock from "components/forms/PaletteBlock";
import { Button } from "ui/buttons/Button";
import React, { Dispatch } from "react";
import { UnknownAction } from "redux";
import l10n from "shared/lib/lang/l10n";
import entitiesActions from "store/features/entities/entitiesActions";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import type { Palette } from "shared/lib/resources/types";
import styled from "styled-components";
import { StyledButton } from "ui/buttons/style";

interface MetaspriteTileContextMenuProps {
  dispatch: Dispatch<UnknownAction>;
  spriteSheetId: string;
  metaspriteId: string;
  selectedTileIds: string[];
  selectionPaletteIndex: number | undefined;
  palettes: Palette[] | undefined;
  onRename?: () => void;
  onClose: () => void;
}

const MenuSectionPalettes = styled.div`
  display: flex;
  align-items: center;
  padding: 5px;
  margin-top: -5px;
  gap: 1px;

  ${StyledButton} {
    width: 28px;
    height: 28px;
  }
`;

const renderMetaspriteTileContextMenu = ({
  dispatch,
  spriteSheetId,
  metaspriteId,
  selectedTileIds,
  selectionPaletteIndex,
  palettes,
  onClose,
}: MetaspriteTileContextMenuProps) => {
  return [
    ...(palettes
      ? [
          <MenuSectionPalettes key="palette">
            {palettes.map((palette, i) => (
              <Button
                title={palette.name}
                variant={
                  i === selectionPaletteIndex ? "primary" : "transparent"
                }
                size="small"
                onClick={() => {
                  dispatch(
                    entitiesActions.editMetaspriteTiles({
                      spriteSheetId,
                      metaspriteTileIds: selectedTileIds,
                      changes: {
                        paletteIndex: i,
                      },
                    }),
                  );
                  onClose();
                }}
              >
                <PaletteBlock type="sprite" colors={palette.colors} size={22} />
              </Button>
            ))}
          </MenuSectionPalettes>,
          <MenuDivider key="div-palette" />,
        ]
      : []),
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
