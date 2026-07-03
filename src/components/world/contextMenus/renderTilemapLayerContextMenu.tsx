import React, { Dispatch } from "react";
import { UnknownAction } from "redux";
import l10n from "shared/lib/lang/l10n";
import entitiesActions from "store/features/entities/entitiesActions";
import { MenuDivider, MenuItem, MenuItemDisabled } from "ui/menu/Menu";

interface TilemapLayerContextMenuProps {
  dispatch: Dispatch<UnknownAction>;
  sceneId: string;
  layerId: string;
  layerIndex: number;
  layerCount: number;
  visible: boolean;
  onRename: () => void;
}

const renderTilemapLayerContextMenu = ({
  dispatch,
  sceneId,
  layerId,
  layerIndex,
  layerCount,
  visible,
  onRename,
}: TilemapLayerContextMenuProps) => {
  const canMoveUp = layerIndex < layerCount - 1;
  const canMoveDown = layerIndex > 0;
  const canDelete = layerCount > 1;

  const moveLayer = (direction: -1 | 1 | "top" | "bottom") =>
    dispatch(entitiesActions.moveTilemapLayer({ sceneId, layerId, direction }));

  return [
    <MenuItem key="rename" onClick={onRename}>
      {l10n("FIELD_RENAME")}
    </MenuItem>,
    <MenuDivider key="div-rename" />,
    canMoveUp ? (
      <MenuItem key="move-top" onClick={() => moveLayer("top")}>
        {l10n("FIELD_MOVE_TOP")}
      </MenuItem>
    ) : (
      <MenuItemDisabled key="move-top">
        {l10n("FIELD_MOVE_TOP")}
      </MenuItemDisabled>
    ),
    canMoveUp ? (
      <MenuItem key="move-up" onClick={() => moveLayer(1)}>
        {l10n("FIELD_MOVE_UP")}
      </MenuItem>
    ) : (
      <MenuItemDisabled key="move-up">{l10n("FIELD_MOVE_UP")}</MenuItemDisabled>
    ),
    canMoveDown ? (
      <MenuItem key="move-down" onClick={() => moveLayer(-1)}>
        {l10n("FIELD_MOVE_DOWN")}
      </MenuItem>
    ) : (
      <MenuItemDisabled key="move-down">
        {l10n("FIELD_MOVE_DOWN")}
      </MenuItemDisabled>
    ),
    canMoveDown ? (
      <MenuItem key="move-bottom" onClick={() => moveLayer("bottom")}>
        {l10n("FIELD_MOVE_BOTTOM")}
      </MenuItem>
    ) : (
      <MenuItemDisabled key="move-bottom">
        {l10n("FIELD_MOVE_BOTTOM")}
      </MenuItemDisabled>
    ),
    <MenuDivider key="div-move" />,
    <MenuItem
      key="visibility"
      onClick={() =>
        dispatch(
          entitiesActions.editTilemapLayer({
            sceneId,
            layerId,
            changes: { visible: !visible },
          }),
        )
      }
    >
      {visible ? l10n("FIELD_HIDE_LAYER") : l10n("FIELD_SHOW_LAYER")}
    </MenuItem>,
    canMoveDown ? (
      <MenuItem
        key="merge-down"
        onClick={() =>
          dispatch(entitiesActions.mergeTilemapLayerDown({ sceneId, layerId }))
        }
      >
        {l10n("FIELD_MERGE_DOWN")}
      </MenuItem>
    ) : (
      <MenuItemDisabled key="merge-down">
        {l10n("FIELD_MERGE_DOWN")}
      </MenuItemDisabled>
    ),
    <MenuDivider key="div-delete" />,
    canDelete ? (
      <MenuItem
        key="delete"
        onClick={() =>
          dispatch(entitiesActions.removeTilemapLayer({ sceneId, layerId }))
        }
      >
        {l10n("FIELD_DELETE_LAYER")}
      </MenuItem>
    ) : (
      <MenuItemDisabled key="delete">
        {l10n("FIELD_DELETE_LAYER")}
      </MenuItemDisabled>
    ),
  ];
};

export default renderTilemapLayerContextMenu;
