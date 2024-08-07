import React, { useCallback, useMemo, useState } from "react";
import ScriptEditor from "components/script/ScriptEditor";
import { castEventToInt } from "renderer/lib/helpers/castEventValue";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import { WorldEditor } from "./WorldEditor";
import ScriptEditorDropdownButton from "components/script/ScriptEditorDropdownButton";
import {
  triggerSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { SidebarColumn, Sidebar, SidebarColumns } from "ui/sidebars/Sidebar";
import {
  FormContainer,
  FormDivider,
  FormHeader,
  FormRow,
} from "ui/form/FormLayout";
import { EditableText } from "ui/form/EditableText";
import {
  TriggerNormalized,
  ScriptEventNormalized,
} from "shared/lib/entities/entitiesTypes";
import { CoordinateInput } from "ui/form/CoordinateInput";
import { NoteField } from "ui/form/NoteField";
import { StickyTabs, TabBar } from "ui/tabs/Tabs";
import { Button } from "ui/buttons/Button";
import { LockIcon, LockOpenIcon } from "ui/icons/Icons";
import { ClipboardTypeTriggers } from "store/features/clipboard/clipboardTypes";
import { TriggerSymbolsEditor } from "components/forms/symbols/TriggerSymbolsEditor";
import { SymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";
import { triggerName } from "shared/lib/entities/entitiesHelpers";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { ScriptEditorCtx } from "shared/lib/scripts/context";
import CachedScroll from "ui/util/CachedScroll";

interface TriggerEditorProps {
  id: string;
  sceneId: string;
}

interface ScriptHandler {
  value: ScriptEventNormalized[];
  onChange: (newValue: ScriptEventNormalized[]) => void;
}

interface ScriptHandlers {
  trigger: ScriptHandler;
  leave: ScriptHandler;
}

type TriggerScriptKey = "script" | "leaveScript";

type DefaultTab = "trigger" | "leave";
type PointNClickTab = "trigger";

const getScriptKey = (tab: DefaultTab): TriggerScriptKey => {
  if (tab === "trigger") {
    return "script";
  }
  if (tab === "leave") {
    return "leaveScript";
  }
  return "script";
};

export const TriggerEditor = ({ id, sceneId }: TriggerEditorProps) => {
  const trigger = useAppSelector((state) =>
    triggerSelectors.selectById(state, id)
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId)
  );
  const clipboardFormat = useAppSelector(
    (state) => state.clipboard.data?.format
  );
  const [notesOpen, setNotesOpen] = useState<boolean>(!!trigger?.notes);

  const lastScriptTab = useAppSelector(
    (state) => state.editor.lastScriptTabTrigger
  );

  const scriptTabs: Record<DefaultTab, string> = useMemo(
    () => ({
      trigger: l10n("SIDEBAR_ON_ENTER"),
      leave: l10n("SIDEBAR_ON_LEAVE"),
    }),
    []
  );

  const pointNClickScriptTabs: Record<PointNClickTab, string> = useMemo(
    () => ({
      trigger: l10n("SIDEBAR_ON_INTERACT"),
    }),
    []
  );

  const tabs = useMemo(() => Object.keys(scriptTabs), [scriptTabs]);

  const initialTab = tabs.includes(lastScriptTab) ? lastScriptTab : tabs[0];

  const [scriptMode, setScriptMode] = useState<keyof ScriptHandlers>(
    initialTab as keyof ScriptHandlers
  );

  const onChangeScriptMode = (mode: keyof ScriptHandlers) => {
    setScriptMode(mode);
    dispatch(editorActions.setScriptTabTrigger(mode));
  };

  const scriptKey = getScriptKey(scriptMode);

  const triggerIndex = scene?.triggers.indexOf(id) || 0;
  const lockScriptEditor = useAppSelector(
    (state) => state.editor.lockScriptEditor
  );

  const [showSymbols, setShowSymbols] = useState(false);

  const dispatch = useAppDispatch();

  const onChangeTriggerProp = useCallback(
    <K extends keyof TriggerNormalized>(
      key: K,
      value: TriggerNormalized[K]
    ) => {
      dispatch(
        entitiesActions.editTrigger({
          triggerId: id,
          changes: {
            [key]: value,
          },
        })
      );
    },
    [dispatch, id]
  );

  const onChangeName = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeTriggerProp("name", e.currentTarget.value),
    [onChangeTriggerProp]
  );

  const onChangeNotes = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeTriggerProp("notes", e.currentTarget.value),
    [onChangeTriggerProp]
  );

  const onChangeX = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeTriggerProp("x", castEventToInt(e, 0)),
    [onChangeTriggerProp]
  );

  const onChangeY = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeTriggerProp("y", castEventToInt(e, 0)),
    [onChangeTriggerProp]
  );

  const onChangeWidth = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeTriggerProp("width", castEventToInt(e, 1)),
    [onChangeTriggerProp]
  );

  const onChangeHeight = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeTriggerProp("height", castEventToInt(e, 1)),
    [onChangeTriggerProp]
  );

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

  const onFetchClipboard = useCallback(() => {
    dispatch(clipboardActions.fetchClipboard());
  }, [dispatch]);

  const onAddNotes = () => {
    setNotesOpen(true);
  };

  const onToggleLockScriptEditor = useCallback(() => {
    dispatch(editorActions.setLockScriptEditor(!lockScriptEditor));
  }, [dispatch, lockScriptEditor]);

  const showNotes = trigger?.notes || notesOpen;

  const lockButton = useMemo(
    () => (
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
    ),
    [lockScriptEditor, onToggleLockScriptEditor]
  );

  const scriptButton = useMemo(
    () =>
      trigger && (
        <ScriptEditorDropdownButton
          value={trigger[scriptKey]}
          type="trigger"
          entityId={trigger.id}
          scriptKey={scriptKey}
        />
      ),
    [scriptKey, trigger]
  );

  const scriptCtx: ScriptEditorCtx = useMemo(
    () => ({
      type: "entity",
      entityType: "trigger",
      entityId: id,
      sceneId,
      scriptKey,
    }),
    [id, sceneId, scriptKey]
  );

  if (!scene || !trigger) {
    return <WorldEditor />;
  }

  const scrollKey = `${trigger.id}_${scriptKey}`;

  return (
    <Sidebar onClick={selectSidebar}>
      <CachedScroll key={scrollKey} cacheKey={scrollKey}>
        {!lockScriptEditor && (
          <FormContainer>
            <FormHeader>
              <EditableText
                name="name"
                placeholder={triggerName(trigger, triggerIndex)}
                value={trigger.name || ""}
                onChange={onChangeName}
              />
              <DropdownButton
                size="small"
                variant="transparent"
                menuDirection="right"
                onMouseDown={onFetchClipboard}
              >
                {!showNotes && (
                  <MenuItem onClick={onAddNotes}>
                    {l10n("FIELD_ADD_NOTES")}
                  </MenuItem>
                )}
                {!showSymbols && (
                  <MenuItem onClick={() => setShowSymbols(true)}>
                    {l10n("FIELD_VIEW_GBVM_SYMBOLS")}
                  </MenuItem>
                )}
                <MenuItem onClick={onCopy}>
                  {l10n("MENU_COPY_TRIGGER")}
                </MenuItem>
                {clipboardFormat === ClipboardTypeTriggers && (
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
        )}

        {!lockScriptEditor && (
          <SidebarColumns>
            {(showSymbols || showNotes) && (
              <SidebarColumn>
                {showSymbols && (
                  <>
                    <SymbolEditorWrapper>
                      <TriggerSymbolsEditor id={trigger.id} />
                    </SymbolEditorWrapper>
                    <FormDivider />
                  </>
                )}
                {showNotes && (
                  <FormRow>
                    <NoteField
                      value={trigger.notes || ""}
                      onChange={onChangeNotes}
                    />
                  </FormRow>
                )}
              </SidebarColumn>
            )}

            <SidebarColumn>
              <FormRow>
                <CoordinateInput
                  name="x"
                  coordinate="x"
                  value={trigger.x}
                  placeholder="0"
                  min={0}
                  max={scene.width - trigger.width}
                  onChange={onChangeX}
                />
                <CoordinateInput
                  name="y"
                  coordinate="y"
                  value={trigger.y}
                  placeholder="0"
                  min={0}
                  max={scene.height - trigger.height}
                  onChange={onChangeY}
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
                  onChange={onChangeWidth}
                />
                <CoordinateInput
                  name="height"
                  coordinate="h"
                  value={trigger.height}
                  placeholder="1"
                  min={1}
                  max={scene.height - trigger.y}
                  onChange={onChangeHeight}
                />
              </FormRow>
            </SidebarColumn>
          </SidebarColumns>
        )}
        <StickyTabs>
          {scene.type === "POINTNCLICK" ? (
            <TabBar
              values={pointNClickScriptTabs}
              buttons={
                <>
                  {lockButton}
                  {scriptButton}
                </>
              }
            />
          ) : (
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
          )}
        </StickyTabs>
        <ScriptEditorContext.Provider value={scriptCtx}>
          <ScriptEditor value={trigger[scriptKey] || []} />
        </ScriptEditorContext.Provider>
      </CachedScroll>
    </Sidebar>
  );
};
