import ScriptEditor from "components/script/ScriptEditor";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  customEventSelectors,
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
import API from "renderer/lib/api";
import DebuggerScriptCtxBreadcrumb from "components/debugger/DebuggerScriptCtxBreadcrumb";
import { StackIcon } from "ui/icons/Icons";

interface DebuggerScriptPaneProps {
  collapsible?: boolean;
}

interface TabWrapperProps {
  collapsible?: boolean;
}

const TabWrapper = styled.div<TabWrapperProps>`
  height: 32px;
  border-left: 1px solid ${(props) => props.theme.colors.input.border};
  overflow: hidden;
  button {
    height: 31px;
    border-bottom: 0;
    outline: 0;
  }
`;

const PlayPauseMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 100px;
  button {
    margin-top: 10px;
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  max-height: calc(100% - 31px);
`;

const ScriptWrapper = styled.div`
  position: relative;
`;

const StackWrapper = styled.div`
  position: sticky;
  max-height: 150px;
  bottom: 0;
  overflow: auto;
  font-family: "Courier New", monospace;
  white-space: pre;
  background: #fff;
  padding: 10px;
  border-top: 1px solid ${(props) => props.theme.colors.input.border};
  background: ${(props) => props.theme.colors.input.background};
`;

const ScriptPath = styled.div`
  padding: 5px 10px;
  color: ${(props) => props.theme.colors.input.text};
  background: ${(props) => props.theme.colors.input.background};
  border-bottom: 1px solid ${(props) => props.theme.colors.input.border};
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
  const [showStack, setShowStack] = useState(false);

  const isPaused = useAppSelector((state) => state.debug.isPaused);
  const scriptContexts = useAppSelector((state) => state.debug.scriptContexts);
  const gbvmScripts = useAppSelector((state) => state.debug.gbvmScripts);
  const viewScriptType = useAppSelector(
    (state) => getSettings(state).debuggerScriptType
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

  const onToggleViewStack = useCallback(() => {
    setShowStack(!showStack);
  }, [showStack]);

  const onToggleCollapsed = useCallback(() => {
    dispatch(settingsActions.toggleDebuggerPaneCollapsed("script"));
  }, [dispatch]);

  const tabs = useMemo(() => {
    return scriptContexts.reduce((memo, ctx, i) => {
      memo[i] = `Thread ${i}`;
      return memo;
    }, {} as Record<number, string>);
  }, [scriptContexts]);

  const runningThreadIndex = useMemo(() => {
    return scriptContexts.findIndex((thread) => thread.current);
  }, [scriptContexts]);

  useEffect(() => {
    setThread(runningThreadIndex);
  }, [runningThreadIndex]);

  const currentThread = useMemo(() => {
    return scriptContexts[thread] ?? scriptContexts[0];
  }, [scriptContexts, thread]);

  const currentScriptSymbol =
    currentThread?.closestGBVMSymbol?.scriptSymbol ?? "";

  const currentGBVMScript = gbvmScripts[`${currentScriptSymbol}.s`] ?? "";

  const scriptCtx: ScriptEditorCtx | undefined = useMemo(
    () =>
      currentThread?.closestGBVMSymbol
        ? {
            type:
              currentThread.closestGBVMSymbol.entityType === "customEvent"
                ? "script"
                : "entity",
            entityType: currentThread.closestGBVMSymbol.entityType,
            entityId: currentThread.closestGBVMSymbol.entityId,
            sceneId: currentThread.closestGBVMSymbol.sceneId,
            scriptKey: currentThread.closestGBVMSymbol.scriptKey,
            executingId: currentThread.closestGBVMSymbol?.scriptEventId ?? "",
          }
        : undefined,
    [currentThread?.closestGBVMSymbol]
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
    actorSelectors.selectById(state, scriptCtx?.entityId ?? "")
  );
  const trigger = useAppSelector((state) =>
    triggerSelectors.selectById(state, scriptCtx?.entityId ?? "")
  );
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, scriptCtx?.entityId ?? "")
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, scriptCtx?.sceneId ?? "")
  );

  const currentScript = useMemo(() => {
    if (!scriptCtx) {
      return [];
    }
    if (scriptCtx.entityType === "actor" && actor) {
      return actor[scriptCtx.scriptKey as ActorScriptKey];
    } else if (scriptCtx.entityType === "trigger" && trigger) {
      return trigger[scriptCtx.scriptKey as TriggerScriptKey];
    } else if (scriptCtx.entityType === "scene" && scene) {
      return scene[scriptCtx.scriptKey as SceneScriptKey];
    } else if (scriptCtx.entityType === "customEvent" && customEvent) {
      return customEvent.script;
    }
    return [];
  }, [actor, scriptCtx, scene, trigger, customEvent]);

  const onPlayPause = useCallback(() => {
    if (isPaused) {
      API.debugger.resume();
    } else {
      API.debugger.pause();
    }
  }, [isPaused]);

  const stopPropagagtion = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
    },
    []
  );

  return (
    <>
      <SplitPaneHeader
        sticky
        onToggle={collapsible ? onToggleCollapsed : undefined}
        collapsed={isCollapsed}
        variant="secondary"
        buttons={
          !isCollapsed && (
            <>
              <Button
                size="small"
                variant={showStack ? "primary" : "transparent"}
                title={l10n("FIELD_STACK")}
                onClick={onToggleViewStack}
              >
                <StackIcon />
              </Button>
              <Button
                size="small"
                variant={
                  viewScriptType === "editor" ? "underlined" : "transparent"
                }
                onClick={onSetScriptTypeEditor}
              >
                {l10n("FIELD_EDITOR")}
              </Button>
              /
              <Button
                size="small"
                variant={
                  viewScriptType === "gbvm" ? "underlined" : "transparent"
                }
                onClick={onSetScriptTypeGBVM}
              >
                {l10n("FIELD_GBVM")}
              </Button>
            </>
          )
        }
      >
        {isCollapsed || !isPaused || scriptContexts.length === 0 ? (
          l10n("FIELD_THREADS")
        ) : (
          <TabWrapper onClick={stopPropagagtion}>
            <TabBar
              value={String(thread)}
              values={tabs}
              onChange={(value) => {
                setThread(parseInt(value, 10));
              }}
            />
          </TabWrapper>
        )}
      </SplitPaneHeader>
      {!isCollapsed && !isPaused && (
        <PlayPauseMessage>
          {l10n("FIELD_PAUSE_TO_VIEW_SCRIPTS")}
          <Button onClick={onPlayPause}>{l10n("FIELD_PAUSE")}</Button>
        </PlayPauseMessage>
      )}
      {!isCollapsed && isPaused && !currentGBVMScript && (
        <PlayPauseMessage>
          {l10n("FIELD_NO_SCRIPT_RUNNING")}
          <Button onClick={onPlayPause}>{l10n("FIELD_RESUME")}</Button>
        </PlayPauseMessage>
      )}
      {!isCollapsed && isPaused && currentGBVMScript && (
        <Content>
          {currentGBVMScript && scriptCtx && (
            <ScriptPath>
              <DebuggerScriptCtxBreadcrumb context={scriptCtx} />
            </ScriptPath>
          )}
          <ScriptWrapper>
            <ScrollWrapper scrollable={!collapsible}>
              {viewScriptType === "editor" && scriptCtx ? (
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
            {showStack && (
              <StackWrapper>{currentThread.stackString}</StackWrapper>
            )}
          </ScriptWrapper>
        </Content>
      )}
    </>
  );
};

export default DebuggerScriptPane;
