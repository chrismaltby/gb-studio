import React, { FC, useCallback } from "react";
import { noteSelectors } from "store/features/entities/entitiesState";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { EditableText, EditableTextOverlay } from "ui/form/EditableText";
import { FormContainer, FormHeader, FormRow } from "ui/form/layout/FormLayout";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import { Sidebar, SidebarColumn } from "ui/sidebars/Sidebar";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { defaultLocalisedNoteName } from "shared/lib/entities/entitiesHelpers";
import { WorldEditor } from "./WorldEditor";
import { FlexGrow } from "ui/spacing/Spacing";
import { labelColorValues, Note } from "shared/lib/resources/types";
import { NoteField } from "ui/form/NoteField";
import { LabelButton, LabelColor } from "ui/buttons/LabelButton";

interface NoteEditorProps {
  id: string;
}

export const NoteEditor: FC<NoteEditorProps> = ({ id }) => {
  const note = useAppSelector((state) => noteSelectors.selectById(state, id));
  const noteIndex = useAppSelector((state) =>
    noteSelectors.selectIds(state).indexOf(id),
  );
  const dispatch = useAppDispatch();

  const onChangeNoteProp = useCallback(
    <K extends keyof Note>(key: K, value: Note[K]) => {
      dispatch(
        entitiesActions.editNote({
          noteId: id,
          changes: {
            [key]: value,
          },
        }),
      );
    },
    [dispatch, id],
  );

  const onChangeName = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeNoteProp("name", e.currentTarget.value),
    [onChangeNoteProp],
  );

  const onChangeContent = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onChangeNoteProp("content", e.currentTarget.value),
    [onChangeNoteProp],
  );

  const selectSidebar = () => {
    dispatch(editorActions.selectSidebar());
  };

  const onRemove = useCallback(() => {
    if (!note) {
      return;
    }
    dispatch(entitiesActions.removeNote({ noteId: note.id }));
  }, [dispatch, note]);

  if (!note) {
    return <WorldEditor />;
  }

  return (
    <Sidebar onClick={selectSidebar}>
      <FormHeader>
        <FlexGrow style={{ minWidth: 0 }}>
          <EditableText
            name="name"
            placeholder={defaultLocalisedNoteName(noteIndex)}
            value={note.name || ""}
            onChange={onChangeName}
          />
          <EditableTextOverlay>
            {(note.name || defaultLocalisedNoteName(noteIndex)).replace(
              /.*[/\\]/,
              "",
            )}
          </EditableTextOverlay>
        </FlexGrow>
        {note.labelColor && <LabelColor color={note.labelColor} />}
        <DropdownButton
          size="small"
          variant="transparent"
          menuDirection="right"
        >
          <MenuItem style={{ paddingRight: 10, marginBottom: 5 }}>
            <div style={{ marginRight: 5 }}>
              <LabelButton
                onClick={() => onChangeNoteProp("labelColor", undefined)}
              />
            </div>
            {labelColorValues.map((color) => (
              <div
                key={color}
                style={{ marginRight: color === "gray" ? 0 : 5 }}
              >
                <LabelButton
                  color={color}
                  onClick={() => onChangeNoteProp("labelColor", color)}
                />
              </div>
            ))}
          </MenuItem>
          <MenuDivider />
          <MenuItem onClick={onRemove}>{l10n("MENU_DELETE_NOTE")}</MenuItem>
        </DropdownButton>
      </FormHeader>

      <SidebarColumn>
        <FormContainer>
          <FormRow>
            <NoteField
              name="noteValue"
              value={note.content}
              color={note.labelColor}
              onChange={onChangeContent}
            />
          </FormRow>
        </FormContainer>
      </SidebarColumn>
    </Sidebar>
  );
};
