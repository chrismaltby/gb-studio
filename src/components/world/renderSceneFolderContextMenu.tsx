import React, { Dispatch } from "react";
import { UnknownAction } from "redux";
import { SceneNormalized } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { MenuDivider, MenuItem } from "ui/menu/Menu";

interface SceneFolderContextMenuProps {
  dispatch: Dispatch<UnknownAction>;
  scenes: SceneNormalized[];
}

const renderSceneFolderContextMenu = ({
  scenes,
  dispatch,
}: SceneFolderContextMenuProps) => {
  const sceneIds = scenes.map((s) => s.id);
  return [
    <MenuItem
      key="select"
      onClick={() => dispatch(editorActions.setSceneSelectionIds(sceneIds))}
    >
      {l10n("MENU_SELECT_SCENES")}
    </MenuItem>,
    <MenuDivider key="div-delete" />,
    <MenuItem
      key="delete"
      onClick={() => dispatch(entitiesActions.removeScenes({ sceneIds }))}
    >
      {l10n("MENU_DELETE_FOLDER")}
    </MenuItem>,
  ];
};

export default renderSceneFolderContextMenu;
