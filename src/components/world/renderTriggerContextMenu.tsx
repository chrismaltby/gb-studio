import React, { Dispatch } from "react";
import { UnknownAction } from "redux";
import l10n from "shared/lib/lang/l10n";
import entitiesActions from "store/features/entities/entitiesActions";
import { MenuDivider, MenuItem } from "ui/menu/Menu";

interface TriggerContextMenuProps {
  dispatch: Dispatch<UnknownAction>;
  triggerId: string;
  sceneId: string;
  onRename?: () => void;
}

const renderTriggerContextMenu = ({
  triggerId,
  sceneId,
  onRename,
  dispatch,
}: TriggerContextMenuProps) => {
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
      key="delete"
      onClick={() =>
        dispatch(entitiesActions.removeTrigger({ sceneId, triggerId }))
      }
    >
      {l10n("MENU_DELETE_TRIGGER")}
    </MenuItem>,
  ];
};

export default renderTriggerContextMenu;
