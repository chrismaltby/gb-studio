import React, { FC, useState } from "react";
import { clipboard } from "electron";
import { useDispatch, useSelector } from "react-redux";
import ScriptEditor from "../script/ScriptEditor";
import castEventValue from "lib/helpers/castEventValue";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import l10n from "lib/helpers/l10n";
import { SidebarTabs } from "./Sidebar";
import { WorldEditor } from "./WorldEditor";
import ScriptEditorDropdownButton from "../script/ScriptEditorDropdownButton";
import {
  triggerSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { SidebarMultiColumnAuto, SidebarColumn } from "ui/sidebars/Sidebar";
import { FormContainer, FormHeader, FormRow } from "ui/form/FormLayout";
import { EditableText } from "ui/form/EditableText";
import { RootState } from "store/configureStore";
import { Trigger } from "store/features/entities/entitiesTypes";
import { CoordinateInput } from "ui/form/CoordinateInput";
import { NoteField } from "ui/form/NoteField";
import { TabBar } from "ui/tabs/Tabs";
import { Button } from "ui/buttons/Button";
import { LockIcon, LockOpenIcon } from "ui/icons/Icons";

interface TriggerEditorProps {
  id: string;
  sceneId: string;
}

const triggerName = (trigger: Trigger, triggerIndex: number) =>
  trigger.name ? trigger.name : `Trigger ${triggerIndex + 1}`;

export const TriggerEditor: FC<TriggerEditorProps> = ({ id, sceneId }) => {
  const trigger = useSelector((state: RootState) =>
    triggerSelectors.selectById(state, id)
  );
  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, sceneId)
  );
  const [clipboardData, setClipboardData] = useState<any>(null);
  const [notesOpen, setNotesOpen] = useState<boolean>(!!trigger?.notes);
  const triggerIndex = scene?.triggers.indexOf(id) || 0;
  const lockScriptEditor = useSelector(
    (state: RootState) => state.editor.lockScriptEditor
  );

  const dispatch = useDispatch();

  const onChangeField =
    <T extends keyof Trigger>(key: T) =>
    (editValue: Trigger[T]) => {
      dispatch(
        entitiesActions.editTrigger({
          triggerId: id,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onChangeFieldInput =
    (key: keyof Trigger) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const editValue = castEventValue(e);
      dispatch(
        entitiesActions.editTrigger({
          triggerId: id,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const selectSidebar = () => {
    dispatch(editorActions.selectSidebar());
  };

  const onCopy = () => {
    if (trigger) {
      dispatch(clipboardActions.copyTrigger(trigger));
    }
  };

  const onPaste = () => {
    if (clipboardData) {
      dispatch(clipboardActions.pasteClipboardEntity(clipboardData));
    }
  };

  const onRemove = () => {
    if (trigger) {
      dispatch(
        entitiesActions.removeTrigger({ triggerId: trigger.id, sceneId })
      );
    }
  };

  const readClipboard = () => {
    try {
      setClipboardData(JSON.parse(clipboard.readText()));
    } catch (err) {
      setClipboardData(null);
    }
  };

  const onAddNotes = () => {
    setNotesOpen(true);
  };

  const onToggleLockScriptEditor = () => {
    dispatch(editorActions.setLockScriptEditor(!lockScriptEditor));
  };

  if (!scene || !trigger) {
    return <WorldEditor />;
  }

  const showNotes = trigger.notes || notesOpen;

  const lockButton = (
    <Button
      size="small"
      variant={lockScriptEditor ? "primary" : "transparent"}
      onClick={onToggleLockScriptEditor}
      title={
        lockScriptEditor
          ? l10n("FIELD_UNLOCK_SCRIPT_EDITOR")
          : l10n("FIELD_LOCK_SCRIPT_EDITOR")
      }
    >
      {lockScriptEditor ? <LockIcon /> : <LockOpenIcon />}
    </Button>
  );

  return (
    <SidebarMultiColumnAuto onClick={selectSidebar}>
      {!lockScriptEditor && (
        <SidebarColumn>
          <FormContainer>
            <FormHeader>
              <EditableText
                name="name"
                placeholder={triggerName(trigger, triggerIndex)}
                value={trigger.name || ""}
                onChange={onChangeFieldInput("name")}
              />
              <DropdownButton
                size="small"
                variant="transparent"
                menuDirection="right"
                onMouseDown={readClipboard}
              >
                {!showNotes && (
                  <MenuItem onClick={onAddNotes}>
                    {l10n("FIELD_ADD_NOTES")}
                  </MenuItem>
                )}
                <MenuItem onClick={onCopy}>
                  {l10n("MENU_COPY_TRIGGER")}
                </MenuItem>
                {clipboardData && clipboardData.__type === "trigger" && (
                  <MenuItem onClick={onPaste}>
                    {l10n("MENU_PASTE_TRIGGER")}
                  </MenuItem>
                )}
                <MenuDivider />
                <MenuItem onClick={onRemove}>
                  {l10n("MENU_DELETE_TRIGGER")}
                </MenuItem>
              </DropdownButton>
            </FormHeader>
          </FormContainer>

          {showNotes && (
            <FormRow>
              <NoteField
                autofocus
                value={trigger.notes || ""}
                onChange={onChangeFieldInput("notes")}
              />
            </FormRow>
          )}

          <FormRow>
            <CoordinateInput
              name="x"
              coordinate="x"
              value={trigger.x}
              placeholder="0"
              min={0}
              max={scene.width - trigger.width}
              onChange={onChangeFieldInput("x")}
            />
            <CoordinateInput
              name="y"
              coordinate="y"
              value={trigger.y}
              placeholder="0"
              min={0}
              max={scene.height - trigger.height}
              onChange={onChangeFieldInput("y")}
            />
          </FormRow>

          <FormRow>
            <CoordinateInput
              name="width"
              coordinate="w"
              value={trigger.width}
              placeholder="1"
              min={1}
              max={scene.width - trigger.x}
              onChange={onChangeFieldInput("width")}
            />
            <CoordinateInput
              name="height"
              coordinate="h"
              value={trigger.height}
              placeholder="1"
              min={1}
              max={scene.height - trigger.y}
              onChange={onChangeFieldInput("height")}
            />
          </FormRow>
        </SidebarColumn>
      )}
      <SidebarColumn>
        <div>
          <TabBar
            values={{
              trigger: l10n("SIDEBAR_ON_TRIGGER"),
            }}
            buttons={
              <>
                {lockButton}
                <ScriptEditorDropdownButton
                  value={trigger.script}
                  onChange={onChangeField("script")}
                />
              </>
            }
          />
          <ScriptEditor
            value={trigger.script}
            type="trigger"
            onChange={onChangeField("script")}
            entityId={trigger.id}
          />
        </div>
      </SidebarColumn>
    </SidebarMultiColumnAuto>
  );
};
