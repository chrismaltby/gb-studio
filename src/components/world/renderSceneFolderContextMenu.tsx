import React, { Dispatch } from "react";
import { UnknownAction } from "redux";
import { SceneNormalized } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { Note } from "shared/lib/resources/types";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { MenuDivider, MenuItem } from "ui/menu/Menu";

interface SceneFolderContextMenuProps {
  dispatch: Dispatch<UnknownAction>;
  scenes: SceneNormalized[];
  notes: Note[];
}

const renderSceneFolderContextMenu = ({
  scenes,
  notes,
  dispatch,
}: SceneFolderContextMenuProps) => {
  const sceneIds = scenes.map((s) => s.id);
  const noteIds = notes.map((n) => n.id);
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
