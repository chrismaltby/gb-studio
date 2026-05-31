import React, { Dispatch } from "react";
import { UnknownAction } from "redux";
import l10n from "shared/lib/lang/l10n";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { MenuDivider, MenuItem } from "ui/menu/Menu";

interface SceneFolderContextMenuProps {
  dispatch: Dispatch<UnknownAction>;
  sceneIds: string[];
  noteIds: string[];
}

const renderSceneFolderContextMenu = ({
  sceneIds,
  noteIds,
  dispatch,
}: SceneFolderContextMenuProps) => {
  return [
    <MenuItem
      key="select"
      onClick={() =>
        dispatch(editorActions.setSceneSelectionIds([...sceneIds, ...noteIds]))
      }
    >
      {l10n("MENU_SELECT_SCENES")}
    </MenuItem>,
    <MenuDivider key="div-delete" />,
    <MenuItem
      key="delete"
      onClick={() => {
        dispatch(entitiesActions.removeScenes({ sceneIds }));
        dispatch(entitiesActions.removeNotes({ noteIds }));
      }}
    >
      {l10n("MENU_DELETE_FOLDER")}
    </MenuItem>,
  ];
};

export default renderSceneFolderContextMenu;
