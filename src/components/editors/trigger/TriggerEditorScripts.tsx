import React, { useCallback, useMemo, useState } from "react";
import ScriptEditor from "components/script/ScriptEditor";
import ScriptEditorDropdownButton from "components/script/ScriptEditorDropdownButton";
import { sceneSelectors } from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import {
  ScriptEventNormalized,
  TriggerNormalized,
} from "shared/lib/entities/entitiesTypes";
import { StickyTabs, TabBar } from "ui/tabs/Tabs";
import { Button } from "ui/buttons/Button";
import { LockIcon, LockOpenIcon } from "ui/icons/Icons";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { ScriptEditorCtx } from "shared/lib/scripts/context";

interface TriggerEditorScriptsProps {
  trigger: TriggerNormalized;
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

export const TriggerEditorScripts = ({
  trigger,
  sceneId,
}: TriggerEditorScriptsProps) => {
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId)
  );

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

  const lockScriptEditor = useAppSelector(
    (state) => state.editor.lockScriptEditor
  );

  const dispatch = useAppDispatch();

  const onToggleLockScriptEditor = useCallback(() => {
    dispatch(editorActions.setLockScriptEditor(!lockScriptEditor));
  }, [dispatch, lockScriptEditor]);

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
      entityId: trigger.id,
      sceneId,
      scriptKey,
    }),
    [trigger.id, sceneId, scriptKey]
  );

  if (!scene || !trigger) {
    return <div />;
  }

  return (
    <>
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
    </>
  );
};
