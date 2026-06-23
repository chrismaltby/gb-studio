import React, { Dispatch } from "react";
import { UnknownAction } from "redux";
import l10n from "shared/lib/lang/l10n";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { MenuDivider, MenuItem } from "ui/menu/Menu";

interface WorldContextMenuProps {
  dispatch: Dispatch<UnknownAction>;
  selectedIds: string[];
}

const renderWorldContextMenu = ({
  dispatch,
  selectedIds,
}: WorldContextMenuProps) => {
  return [
    <MenuItem
      key="scene"
      onClick={() => dispatch(editorActions.setTool({ tool: "scene" }))}
    >
      {l10n("TOOL_ADD_SCENE_LABEL")}
    </MenuItem>,
    <MenuDivider key="div-note" />,
    <MenuItem
      key="note"
      onClick={() => dispatch(editorActions.setTool({ tool: "note" }))}
    >
      {l10n("TOOL_ADD_NOTE_LABEL")}
    </MenuItem>,
    ...(selectedIds.length > 0
      ? [
          <MenuDivider key="div-delete" />,
          <MenuItem
            key="delete"
            onClick={() => {
              dispatch(entitiesActions.removeScenes({ sceneIds: selectedIds }));
              dispatch(entitiesActions.removeNotes({ noteIds: selectedIds }));
              dispatch(editorActions.selectWorld());
            }}
          >
            {l10n("MENU_DELETE_SELECTION")}
          </MenuItem>,
        ]
      : []),
  ];
};

export default renderWorldContextMenu;
