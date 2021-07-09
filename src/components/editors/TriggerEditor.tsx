import React, { useState } from "react";
import { clipboard } from "electron";
import { useDispatch, useSelector } from "react-redux";
import ScriptEditor from "../script/ScriptEditor";
import castEventValue from "lib/helpers/castEventValue";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import l10n from "lib/helpers/l10n";
import { WorldEditor } from "./WorldEditor";
import ScriptEditorDropdownButton from "../script/ScriptEditorDropdownButton";
import {
  triggerSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { SidebarColumn, Sidebar } from "ui/sidebars/Sidebar";
import { FormContainer, FormHeader, FormRow } from "ui/form/FormLayout";
import { EditableText } from "ui/form/EditableText";
import { RootState } from "store/configureStore";
import { Trigger, ScriptEvent } from "store/features/entities/entitiesTypes";
import { CoordinateInput } from "ui/form/CoordinateInput";
import { NoteField } from "ui/form/NoteField";
import { StickyTabs, TabBar } from "ui/tabs/Tabs";
import { Button } from "ui/buttons/Button";
import { LockIcon, LockOpenIcon } from "ui/icons/Icons";

interface TriggerEditorProps {
  id: string;
  sceneId: string;
  multiColumn: boolean;
}

interface ScriptHandler {
  value: ScriptEvent[];
  onChange: (newValue: ScriptEvent[]) => void;
}

interface ScriptHandlers {
  trigger: ScriptHandler;
  leave: ScriptHandler;
}

type TriggerScriptKey = "script" | "leaveScript";

const scriptTabs = {
  trigger: l10n("SIDEBAR_ON_TRIGGER_ENTER"),
  leave: l10n("SIDEBAR_ON_TRIGGER_LEAVE"),
} as const;

const getScriptKey = (tab: keyof typeof scriptTabs): TriggerScriptKey => {
  if (tab === "trigger") {
    return "script";
  }
  if (tab === "leave") {
    return "leaveScript";
  }
  return "script";
};

const triggerName = (trigger: Trigger, triggerIndex: number) =>
  trigger.name ? trigger.name : `Trigger ${triggerIndex + 1}`;

export const TriggerEditor = ({
  id,
  sceneId,
  multiColumn,
}: TriggerEditorProps) => {
  const trigger = useSelector((state: RootState) =>
    triggerSelectors.selectById(state, id)
  );
  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, sceneId)
  );
  const [clipboardData, setClipboardData] = useState<unknown>(null);
  const [notesOpen, setNotesOpen] = useState<boolean>(!!trigger?.notes);
  const triggerIndex = scene?.triggers.indexOf(id) || 0;
  const lockScriptEditor = useSelector(
    (state: RootState) => state.editor.lockScriptEditor
  );

  const dispatch = useDispatch();

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
      dispatch(
        clipboardActions.copyTriggers({
          triggerIds: [id],
        })
      );
    }
  };

  const onPaste = () => {
    dispatch(clipboardActions.pasteClipboardEntity());
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

  const scriptButton = (
    <ScriptEditorDropdownButton
      value={trigger.script}
      type="trigger"
      entityId={trigger.id}
      scriptKey={"script"}
    />
  );

  const tabs = Object.keys(scriptTabs);
  const lastScriptTab = useSelector(
    (state: RootState) => state.editor.lastScriptTabTrigger
  );
  const initialTab = tabs.includes(lastScriptTab) ? lastScriptTab : tabs[0];

  const [scriptMode, setScriptMode] = useState<keyof ScriptHandlers>(
    initialTab as keyof ScriptHandlers
  );

  const onChangeScriptMode = (mode: keyof ScriptHandlers) => {
    setScriptMode(mode);
    dispatch(editorActions.setScriptTabTrigger(mode));
  };

  const scriptKey = getScriptKey(scriptMode);

  return (
    <Sidebar onClick={selectSidebar} multiColumn={multiColumn}>
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
                {clipboardData &&
                  (clipboardData as { __type?: unknown }).__type ===
                    "trigger" && (
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
        <StickyTabs>
          <TabBar
            value={scriptMode}
            values={scriptTabs}
            onChange={onChangeScriptMode}
            buttons={
              <>
                {lockButton}
                {scriptButton}
              </>
            }
          />
        </StickyTabs>
        <ScriptEditor
          value={trigger[scriptKey]}
          type="trigger"
          entityId={trigger.id}
          scriptKey={scriptKey}
        />
      </SidebarColumn>
    </Sidebar>
  );
};
