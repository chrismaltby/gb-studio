import React, { Dispatch } from "react";
import { UnknownAction } from "redux";
import l10n from "shared/lib/lang/l10n";
import { labelColorValues, Note } from "shared/lib/resources/types";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { LabelButton } from "ui/buttons/LabelButton";
import { MenuDivider, MenuItem, MenuSection } from "ui/menu/Menu";

interface NoteContextMenuProps {
  dispatch: Dispatch<UnknownAction>;
  noteId: string;
  additionalSceneIds: string[];
  onRename?: () => void;
  onClose?: () => void;
}

const renderNoteContextMenu = ({
  noteId,
  additionalSceneIds,
  onRename,
  dispatch,
  onClose,
}: NoteContextMenuProps) => {
  const editNote = (changes: Partial<Note>) => {
    dispatch(
      entitiesActions.editNote({
        noteId,
        changes,
      }),
    );
  };

  return [
    <MenuSection key="label" style={{ paddingRight: 10, marginBottom: 5 }}>
      <div style={{ display: "flex" }}>
        <div style={{ marginRight: 5 }}>
          <LabelButton
            onClick={() => {
              editNote({
                labelColor: undefined,
              });
              onClose?.();
            }}
          />
        </div>
        {labelColorValues.map((color) => (
          <div key={color} style={{ marginRight: color === "gray" ? 0 : 5 }}>
            <LabelButton
              color={color}
              onClick={() => {
                editNote({ labelColor: color });
                onClose?.();
              }}
            />
          </div>
        ))}
      </div>
    </MenuSection>,
    ...(onRename ? [<MenuDivider key="div-rename" />] : []),
    ...(onRename
      ? [
          <MenuItem key="rename" onClick={onRename}>
            {l10n("FIELD_RENAME")}
          </MenuItem>,
        ]
      : []),
    <MenuDivider key="div-delete" />,
    <MenuItem
      key="delete"
      onClick={() => {
        if (additionalSceneIds.length > 1) {
          dispatch(
            entitiesActions.removeScenes({ sceneIds: additionalSceneIds }),
          );
          dispatch(
            entitiesActions.removeNotes({ noteIds: additionalSceneIds }),
          );
          dispatch(editorActions.selectWorld());
        } else {
          dispatch(entitiesActions.removeNote({ noteId }));
        }
      }}
    >
      {l10n(
        additionalSceneIds.length > 1
          ? "MENU_DELETE_SELECTION"
          : "MENU_DELETE_NOTE",
      )}
    </MenuItem>,
  ];
};

export default renderNoteContextMenu;
