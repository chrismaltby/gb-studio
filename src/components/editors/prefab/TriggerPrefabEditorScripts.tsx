import React, { FC, useMemo, useState } from "react";
import editorActions from "store/features/editor/editorActions";
import {
  TriggerPrefabNormalized,
  ScriptEventNormalized,
  TriggerNormalized,
} from "shared/lib/entities/entitiesTypes";
import { LockIcon, LockOpenIcon } from "ui/icons/Icons";
import ScriptEditorDropdownButton from "components/script/ScriptEditorDropdownButton";
import ScriptEditor from "components/script/ScriptEditor";
import { StickyTabs, TabBar } from "ui/tabs/Tabs";
import { Button } from "ui/buttons/Button";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { ScriptEditorCtx } from "shared/lib/scripts/context";

interface TriggerPrefabEditorScriptsProps {
  prefab: TriggerPrefabNormalized;
  trigger?: TriggerNormalized;
  sceneId?: string;
  isInstance?: boolean;
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

const getScriptKey = (tab: DefaultTab): TriggerScriptKey => {
  if (tab === "trigger") {
    return "script";
  }
  if (tab === "leave") {
    return "leaveScript";
  }
  return "script";
};

export const TriggerPrefabEditorScripts: FC<TriggerPrefabEditorScriptsProps> =
  ({ prefab, trigger, sceneId, isInstance }) => {
    const lockScriptEditor = useAppSelector(
      (state) => state.editor.lockScriptEditor
    );

    const scriptTabs: Record<DefaultTab, string> = useMemo(
      () => ({
        trigger: l10n("SIDEBAR_ON_ENTER"),
        leave: l10n("SIDEBAR_ON_LEAVE"),
      }),
      []
    );

    const tabs = useMemo(() => Object.keys(scriptTabs), [scriptTabs]);

    const lastScriptTab = useAppSelector((state) => state.editor.lastScriptTab);

    const initialTab = tabs.includes(lastScriptTab) ? lastScriptTab : tabs[0];

    const [scriptMode, setScriptMode] = useState<keyof ScriptHandlers>(
      initialTab as keyof ScriptHandlers
    );

    const dispatch = useAppDispatch();

    const onChangeScriptMode = (mode: keyof ScriptHandlers) => {
      setScriptMode(mode);
      dispatch(editorActions.setScriptTab(mode));
    };

    const onToggleLockScriptEditor = () => {
      dispatch(editorActions.setLockScriptEditor(!lockScriptEditor));
    };

    const scriptKey = getScriptKey(scriptMode);

    const scriptCtx: ScriptEditorCtx = useMemo(
      () => ({
        type: "prefab",
        entityType: "triggerPrefab",
        entityId: prefab.id,
        sceneId: sceneId ?? "",
        scriptKey,
        instanceId: trigger?.id,
      }),
      [prefab.id, sceneId, scriptKey, trigger?.id]
    );

    if (!prefab) {
      return <div />;
    }

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
        value={prefab[scriptKey]}
        type="triggerPrefab"
        entityId={prefab.id}
        scriptKey={scriptKey}
      />
    );

    return (
      <>
        <StickyTabs style={isInstance ? { top: 38 } : undefined}>
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
        <ScriptEditorContext.Provider value={scriptCtx}>
          <ScriptEditor value={prefab[scriptKey]} />
        </ScriptEditorContext.Provider>
      </>
    );
  };
