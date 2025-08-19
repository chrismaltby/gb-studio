import React, { Dispatch } from "react";
import { UnknownAction } from "redux";
import l10n from "shared/lib/lang/l10n";
import entitiesActions from "store/features/entities/entitiesActions";
import { MenuDivider, MenuItem } from "ui/menu/Menu";

interface ActorContextMenuProps {
  dispatch: Dispatch<UnknownAction>;
  actorId: string;
  sceneId: string;
  onRename?: () => void;
}

const renderActorContextMenu = ({
  actorId,
  sceneId,
  onRename,
  dispatch,
}: ActorContextMenuProps) => {
  return [
    ...(onRename
      ? [
          <MenuItem key="rename" onClick={onRename}>
            {l10n("FIELD_RENAME")}
          </MenuItem>,
          <MenuDivider key="div-rename" />,
        ]
      : []),
    <MenuItem
      key="move-top"
      onClick={() =>
        dispatch(entitiesActions.moveActorIndexTop({ sceneId, actorId }))
      }
    >
      {l10n("FIELD_MOVE_TOP")}
    </MenuItem>,
    <MenuItem
      key="move-up"
      onClick={() =>
        dispatch(entitiesActions.moveActorIndexUp({ sceneId, actorId }))
      }
    >
      {l10n("FIELD_MOVE_UP")}
    </MenuItem>,
    <MenuItem
      key="move-down"
      onClick={() =>
        dispatch(entitiesActions.moveActorIndexDown({ sceneId, actorId }))
      }
    >
      {l10n("FIELD_MOVE_DOWN")}
    </MenuItem>,
    <MenuItem
      key="move-bottom"
      onClick={() =>
        dispatch(entitiesActions.moveActorIndexBottom({ sceneId, actorId }))
      }
    >
      {l10n("FIELD_MOVE_BOTTOM")}
    </MenuItem>,
    <MenuDivider key="div-move" />,
    <MenuItem
      key="delete"
      onClick={() =>
        dispatch(entitiesActions.removeActor({ sceneId, actorId }))
      }
    >
      {l10n("MENU_DELETE_ACTOR")}
    </MenuItem>,
  ];
};

export default renderActorContextMenu;
