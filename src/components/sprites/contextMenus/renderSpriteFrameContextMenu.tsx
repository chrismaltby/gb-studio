import React, { Dispatch } from "react";
import { UnknownAction } from "redux";
import l10n from "shared/lib/lang/l10n";
import clipboardActions from "store/features/clipboard/clipboardActions";
import {
  ClipboardType,
  ClipboardTypeMetasprites,
} from "store/features/clipboard/clipboardTypes";
import entitiesActions from "store/features/entities/entitiesActions";
import { MenuDivider, MenuItem } from "ui/menu/Menu";

interface SpriteFrameContextMenuProps {
  dispatch: Dispatch<UnknownAction>;
  clipboard?: ClipboardType;
  spriteSheetId: string;
  metaspriteId: string;
  selectedMetaspriteIds: string[];
  spriteAnimationId: string;
}

const renderSpriteFrameContextMenu = ({
  clipboard,
  spriteSheetId,
  metaspriteId,
  selectedMetaspriteIds,
  spriteAnimationId,
  dispatch,
}: SpriteFrameContextMenuProps) => {
  const selectionIds =
    selectedMetaspriteIds.length === 0 ? [metaspriteId] : selectedMetaspriteIds;
  return [
    <MenuItem
      key="clone"
      onClick={() =>
        dispatch(
          entitiesActions.cloneMetasprites({
            spriteSheetId,
            spriteAnimationId,
            metaspriteIds: selectionIds,
          }),
        )
      }
    >
      {l10n(
        selectionIds.length > 1 ? "FIELD_CLONE_FRAMES" : "FIELD_CLONE_FRAME",
      )}
    </MenuItem>,
    <MenuItem
      key="copy"
      onClick={() =>
        dispatch(
          clipboardActions.copyMetasprites({
            metaspriteIds: selectionIds,
            spriteAnimationId,
          }),
        )
      }
    >
      {l10n(
        selectionIds.length > 1
          ? "MENU_SPRITE_FRAMES_COPY"
          : "MENU_SPRITE_COPY",
      )}
    </MenuItem>,
    ...(clipboard?.format === ClipboardTypeMetasprites
      ? [
          <MenuItem
            key="paste"
            onClick={() =>
              dispatch(
                clipboardActions.pasteSprite({
                  spriteSheetId,
                  metaspriteId,
                  spriteAnimationId,
                  spriteStateId: "",
                }),
              )
            }
          >
            {l10n(
              clipboard.data.metasprites.length > 1
                ? "MENU_SPRITE_FRAMES_PASTE"
                : "MENU_SPRITE_PASTE",
            )}
          </MenuItem>,
        ]
      : []),
    <MenuDivider key="div-delete" />,
    <MenuItem
      key="delete"
      onClick={() =>
        dispatch(
          entitiesActions.removeMetasprites({
            spriteSheetId,
            spriteAnimationId,
            metaspriteIds: selectionIds,
          }),
        )
      }
    >
      {l10n(
        selectionIds.length > 1
          ? "MENU_SPRITE_FRAMES_DELETE"
          : "MENU_SPRITE_DELETE",
      )}
    </MenuItem>,
  ];
};

export default renderSpriteFrameContextMenu;
