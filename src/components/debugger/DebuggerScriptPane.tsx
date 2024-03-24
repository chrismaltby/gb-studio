import ScriptEditor from "components/script/ScriptEditor";
import React, { useCallback, useMemo, useState } from "react";
import l10n from "shared/lib/lang/l10n";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled, { css } from "styled-components";
import { Button } from "ui/buttons/Button";
import { CodeEditor } from "ui/form/CodeEditor";
import { ScriptEditorCtx } from "shared/lib/scripts/context";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";
import {
  actorSelectors,
  sceneSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import {
  ActorScriptKey,
  SceneScriptKey,
  TriggerScriptKey,
} from "shared/lib/entities/entitiesTypes";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { TabBar } from "ui/tabs/Tabs";

interface DebuggerScriptPaneProps {
  collapsible?: boolean;
}

const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  max-height: calc(100% - 31px);
`;

interface ScrollWrapperProps {
  scrollable?: boolean;
}

const ScrollWrapper = styled.div<ScrollWrapperProps>`
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  ${(props) =>
    props.scrollable
      ? css`
          overflow: auto;
          max-height: 100%;
        `
      : ""}
`;

const CodeEditorWrapper = styled.div`
  flex-grow: 1;

  & > div {
    min-height: 100%;
    border-radius: 0;
    border: 0;
  }
`;

const DebuggerScriptPane = ({ collapsible }: DebuggerScriptPaneProps) => {
  const dispatch = useAppDispatch();
  const [thread, setThread] = useState(0);
  const scriptContexts = useAppSelector((state) => state.debug.scriptContexts);
  const scriptMap = useAppSelector((state) => state.debug.scriptMap);
  const sceneMap = useAppSelector((state) => state.debug.sceneMap);
  const gbvmScripts = useAppSelector((state) => state.debug.gbvmScripts);
  const viewScriptType = useAppSelector(
    (state) => getSettings(state).debuggerScriptType
  );
  const currentSceneSymbol = useAppSelector(
    (state) => state.debug.currentSceneSymbol
  );
  const isCollapsed = useAppSelector(
    (state) =>
      !!collapsible &&
      getSettings(state).debuggerCollapsedPanes.includes("script")
  );

  const onSetScriptTypeEditor = useCallback(() => {
    dispatch(
      settingsActions.editSettings({
        debuggerScriptType: "editor",
      })
    );
  }, [dispatch]);

  const onSetScriptTypeGBVM = useCallback(() => {
    dispatch(
      settingsActions.editSettings({
        debuggerScriptType: "gbvm",
      })
    );
  }, [dispatch]);

  const onToggleCollapsed = useCallback(() => {
    dispatch(settingsActions.toggleDebuggerPaneCollapsed("script"));
  }, [dispatch]);

  const tabs = useMemo(() => {
    return scriptContexts.reduce((memo, ctx, i) => {
      memo[i] = `Thread ${i}`;
      return memo;
    }, {} as Record<number, string>);
  }, [scriptContexts]);

  const currentThread = useMemo(() => {
    return scriptContexts[thread] ?? scriptContexts[0];
  }, [scriptContexts, thread]);

  const currentScriptSymbol =
    currentThread?.closestGBVMSymbol?.scriptSymbol ?? "";

  const currentScriptEvents = scriptMap[currentScriptSymbol] ?? undefined;
  const currentGBVMScript = gbvmScripts[`${currentScriptSymbol}.s`] ?? "";
  const currentSceneData = sceneMap[currentSceneSymbol] ?? undefined;

  const scriptCtx: ScriptEditorCtx | undefined = useMemo(
    () =>
      currentScriptEvents
        ? {
            type: "entity",
            entityType: currentScriptEvents.entityType,
            entityId: currentScriptEvents.entityId,
            sceneId: currentScriptEvents.sceneId,
            scriptKey: currentScriptEvents.scriptType,
            executingId: currentThread?.closestGBVMSymbol?.scriptEventId ?? "",
          }
        : undefined,
    [currentScriptEvents, currentThread?.closestGBVMSymbol?.scriptEventId]
  );

  const currentScriptLineNum = useMemo(() => {
    if (
      currentGBVMScript &&
      currentThread?.closestSymbol &&
      currentThread?.closestSymbol.startsWith("GBVM$")
    ) {
      const lines = currentGBVMScript.split("\n");
      for (let l = 0; l < lines.length; l++) {
        if (lines[l].includes(currentThread.closestSymbol)) {
          return l + 1;
        }
      }
    }
    return -1;
  }, [currentGBVMScript, currentThread?.closestSymbol]);

  const actor = useAppSelector((state) =>
    actorSelectors.selectById(state, currentScriptEvents?.entityId)
  );
  const trigger = useAppSelector((state) =>
    triggerSelectors.selectById(state, currentScriptEvents?.entityId)
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(
      state,
      currentSceneData?.id || currentScriptEvents?.entityId
    )
  );

  const currentScript = useMemo(() => {
    if (!currentScriptEvents) {
      return [];
    }
    if (currentScriptEvents.entityType === "actor" && actor) {
      return actor[currentScriptEvents.scriptType as ActorScriptKey];
    } else if (currentScriptEvents.entityType === "trigger" && trigger) {
      return trigger[currentScriptEvents.scriptType as TriggerScriptKey];
    } else if (currentScriptEvents.entityType === "scene" && scene) {
      return scene[currentScriptEvents.scriptType as SceneScriptKey];
    }
    return [];
  }, [actor, currentScriptEvents, scene, trigger]);

  return (
    <>
      <SplitPaneHeader
        onToggle={collapsible ? onToggleCollapsed : undefined}
        collapsed={isCollapsed}
        variant="secondary"
        buttons={
          !isCollapsed && (
            <>
              <Button
                size="small"
                variant={
                  viewScriptType === "editor" ? "underlined" : "transparent"
                }
                onClick={onSetScriptTypeEditor}
              >
                Editor
              </Button>
              /
              <Button
                size="small"
                variant={
                  viewScriptType === "gbvm" ? "underlined" : "transparent"
                }
                onClick={onSetScriptTypeGBVM}
              >
                GBVM
              </Button>
            </>
          )
        }
      >
        {l10n("FIELD_CURRENT_SCRIPT")}
      </SplitPaneHeader>
      {!isCollapsed && (
        <Content>
          {/* <pre>{JSON.stringify(scriptContexts, null, 2)}</pre> */}
          <TabBar
            value={String(thread)}
            values={tabs}
            onChange={(value) => {
              setThread(parseInt(value, 10));
            }}
          />
          <ScrollWrapper scrollable={!collapsible}>
            {viewScriptType === "editor" && currentScriptEvents && scriptCtx ? (
              <ScriptEditorContext.Provider value={scriptCtx}>
                <ScriptEditor
                  value={currentScript}
                  showAutoFadeIndicator={
                    scriptCtx.type === "entity" &&
                    scriptCtx.entityType === "scene" &&
                    scriptCtx.scriptKey === "script"
                  }
                />
              </ScriptEditorContext.Provider>
            ) : undefined}
            {viewScriptType === "gbvm" && currentGBVMScript ? (
              <CodeEditorWrapper>
                <CodeEditor
                  value={currentGBVMScript}
                  onChange={() => {}}
                  currentLineNum={currentScriptLineNum}
                />
              </CodeEditorWrapper>
            ) : undefined}
          </ScrollWrapper>
        </Content>
      )}
    </>
  );
};

export default DebuggerScriptPane;
