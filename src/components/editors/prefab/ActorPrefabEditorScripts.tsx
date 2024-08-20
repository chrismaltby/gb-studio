import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import {
  ActorNormalized,
  ActorPrefabNormalized,
  ScriptEventNormalized,
} from "shared/lib/entities/entitiesTypes";
import { LockIcon, LockOpenIcon } from "ui/icons/Icons";
import { CheckboxField } from "ui/form/CheckboxField";
import ScriptEditorDropdownButton from "components/script/ScriptEditorDropdownButton";
import ScriptEditor from "components/script/ScriptEditor";
import { StickyTabs, TabBar, TabSettings } from "ui/tabs/Tabs";
import { Button } from "ui/buttons/Button";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";
import l10n from "shared/lib/lang/l10n";
import { castEventToBool } from "renderer/lib/helpers/castEventValue";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { ScriptEditorCtx } from "shared/lib/scripts/context";

interface ActorPrefabEditorScriptsProps {
  prefab: ActorPrefabNormalized;
  actor?: ActorNormalized;
  sceneId?: string;
  isInstance?: boolean;
}

interface ScriptHandler {
  value: ScriptEventNormalized[];
  onChange: (newValue: ScriptEventNormalized[]) => void;
}

interface ScriptHandlers {
  start: ScriptHandler;
  interact: ScriptHandler;
  update: ScriptHandler;
  hit: {
    hitPlayer: ScriptHandler;
    hit1: ScriptHandler;
    hit2: ScriptHandler;
    hit3: ScriptHandler;
  };
}

type ActorScriptKey =
  | "script"
  | "startScript"
  | "updateScript"
  | "hit1Script"
  | "hit2Script"
  | "hit3Script";

type DefaultTab = "interact" | "start" | "update";
type CollisionTab = "hit" | "start" | "update";
type HitTab = "hitPlayer" | "hit1" | "hit2" | "hit3";

const getScriptKey = (
  primaryTab: DefaultTab | CollisionTab,
  secondaryTab: HitTab
): ActorScriptKey => {
  if (primaryTab === "interact") {
    return "script";
  }
  if (primaryTab === "start") {
    return "startScript";
  }
  if (primaryTab === "update") {
    return "updateScript";
  }
  if (primaryTab === "hit") {
    if (secondaryTab === "hitPlayer") {
      return "script";
    }
    if (secondaryTab === "hit1") {
      return "hit1Script";
    }
    if (secondaryTab === "hit2") {
      return "hit2Script";
    }
    if (secondaryTab === "hit3") {
      return "hit3Script";
    }
  }
  return "script";
};

export const ActorPrefabEditorScripts: FC<ActorPrefabEditorScriptsProps> = ({
  prefab,
  actor,
  sceneId,
  isInstance,
}) => {
  const lockScriptEditor = useAppSelector(
    (state) => state.editor.lockScriptEditor
  );

  const defaultTabs: Record<DefaultTab, string> = useMemo(
    () => ({
      interact: l10n("SIDEBAR_ON_INTERACT"),
      start: l10n("SIDEBAR_ON_INIT"),
      update: l10n("SIDEBAR_ON_UPDATE"),
    }),
    []
  );

  const collisionTabs: Record<CollisionTab, string> = useMemo(
    () => ({
      hit: l10n("SIDEBAR_ON_HIT"),
      start: l10n("SIDEBAR_ON_INIT"),
      update: l10n("SIDEBAR_ON_UPDATE"),
    }),
    []
  );

  const hitTabs: Record<HitTab, string> = useMemo(
    () => ({
      hitPlayer: l10n("FIELD_PLAYER"),
      hit1: l10n("FIELD_COLLISION_GROUP_N", { n: 1 }),
      hit2: l10n("FIELD_COLLISION_GROUP_N", { n: 2 }),
      hit3: l10n("FIELD_COLLISION_GROUP_N", { n: 3 }),
    }),
    []
  );

  const tabs = Object.keys(
    prefab?.collisionGroup ? collisionTabs : defaultTabs
  );
  const secondaryTabs = Object.keys(hitTabs);
  const lastScriptTab = useAppSelector((state) => state.editor.lastScriptTab);
  const lastScriptTabSecondary = useAppSelector(
    (state) => state.editor.lastScriptTabSecondary
  );
  const initialTab = tabs.includes(lastScriptTab) ? lastScriptTab : tabs[0];
  const initialSecondaryTab = secondaryTabs.includes(lastScriptTabSecondary)
    ? lastScriptTabSecondary
    : secondaryTabs[0];

  const [scriptMode, setScriptMode] = useState<keyof ScriptHandlers>(
    initialTab as keyof ScriptHandlers
  );
  const [scriptModeSecondary, setScriptModeSecondary] = useState<
    keyof ScriptHandlers["hit"]
  >(initialSecondaryTab as keyof ScriptHandlers["hit"]);

  // Make sure currently selected script tab is availble
  // when collision group is modified otherwise use first available tab
  useEffect(() => {
    const tabs = Object.keys(
      prefab?.collisionGroup ? collisionTabs : defaultTabs
    );
    if (!tabs.includes(scriptMode)) {
      setScriptMode(tabs[0] as keyof ScriptHandlers);
    }
  }, [scriptMode, prefab?.collisionGroup, collisionTabs, defaultTabs]);

  const dispatch = useAppDispatch();

  const onChangeScriptMode = (mode: keyof ScriptHandlers) => {
    setScriptMode(mode);
    dispatch(editorActions.setScriptTab(mode));
  };

  const onChangeScriptModeSecondary = (mode: keyof ScriptHandlers["hit"]) => {
    setScriptModeSecondary(mode);
    dispatch(editorActions.setScriptTabSecondary(mode));
  };

  const onChangeActorPrefabProp = useCallback(
    <K extends keyof ActorPrefabNormalized>(
      key: K,
      value: ActorPrefabNormalized[K]
    ) => {
      dispatch(
        entitiesActions.editActorPrefab({
          actorPrefabId: prefab.id,
          changes: {
            [key]: value,
          },
        })
      );
    },
    [dispatch, prefab.id]
  );

  const onChangePersistent = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeActorPrefabProp("persistent", castEventToBool(e)),
    [onChangeActorPrefabProp]
  );

  const onToggleLockScriptEditor = () => {
    dispatch(editorActions.setLockScriptEditor(!lockScriptEditor));
  };

  const scriptKey = getScriptKey(scriptMode, scriptModeSecondary);

  const scriptCtx: ScriptEditorCtx = useMemo(
    () => ({
      type: "prefab",
      entityType: "actorPrefab",
      entityId: prefab.id,
      sceneId: sceneId ?? "",
      scriptKey,
      instanceId: actor?.id,
    }),
    [actor?.id, prefab.id, sceneId, scriptKey]
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
      type="actorPrefab"
      entityId={prefab.id}
      scriptKey={scriptKey}
    />
  );

  return (
    <>
      <StickyTabs style={isInstance ? { top: 38 } : undefined}>
        {prefab.collisionGroup ? (
          <TabBar
            value={scriptMode as CollisionTab}
            values={collisionTabs}
            onChange={onChangeScriptMode}
            overflowActiveTab={scriptMode === "hit" || scriptMode === "update"}
            buttons={
              <>
                {lockButton}
                {scriptButton}
              </>
            }
          />
        ) : (
          <TabBar
            value={scriptMode as DefaultTab}
            values={defaultTabs}
            onChange={onChangeScriptMode}
            overflowActiveTab={scriptMode === "update"}
            buttons={
              <>
                {lockButton}
                {scriptButton}
              </>
            }
          />
        )}
        {scriptMode === "hit" && (
          <TabBar
            variant="secondary"
            value={scriptModeSecondary}
            values={hitTabs}
            onChange={onChangeScriptModeSecondary}
          />
        )}
        {scriptMode === "update" && (
          <TabSettings>
            <CheckboxField
              name="persistent"
              label={l10n("FIELD_KEEP_RUNNING_WHILE_OFFSCREEN")}
              checked={prefab.persistent}
              onChange={onChangePersistent}
            />
          </TabSettings>
        )}
      </StickyTabs>
      <ScriptEditorContext.Provider value={scriptCtx}>
        <ScriptEditor value={prefab[scriptKey]} />
      </ScriptEditorContext.Provider>
    </>
  );
};
