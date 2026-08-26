import React from "react";
import DebuggerActorLink from "components/debugger/DebuggerActorLink";
import DebuggerCustomEventLink from "components/debugger/DebuggerCustomEventLink";
import DebuggerSceneLink from "components/debugger/DebuggerSceneLink";
import DebuggerTriggerLink from "components/debugger/DebuggerTriggerLink";
import type { ScriptEditorCtx } from "shared/lib/scripts/context";
import styled from "styled-components";

interface DebuggerScriptCtxBreadcrumbProps {
  context: ScriptEditorCtx;
}

const Separator = styled.span`
  margin: 0 5px;
  opacity: 0.5;
`;

const DebuggerScriptCtxBreadcrumb = ({
  context,
}: DebuggerScriptCtxBreadcrumbProps) => {
  const { sceneId, entityType, entityId, instanceId, scriptKey } = context;

  const actorId = entityType === "actorPrefab" ? instanceId : entityId;
  const triggerId = entityType === "triggerPrefab" ? instanceId : entityId;

  return (
    <>
      {sceneId && entityType !== "customEvent" && (
        <>
          <DebuggerSceneLink id={sceneId} />
          <Separator>/</Separator>
        </>
      )}
      {(entityType === "actor" || entityType === "actorPrefab") && actorId && (
        <>
          <DebuggerActorLink id={actorId} sceneId={sceneId} />
          <Separator>/</Separator>
        </>
      )}
      {(entityType === "trigger" || entityType === "triggerPrefab") &&
        triggerId && (
          <>
            <DebuggerTriggerLink id={triggerId} sceneId={sceneId} />
            <Separator>/</Separator>
          </>
        )}
      {entityType === "customEvent" && (
        <>
          <DebuggerCustomEventLink id={entityId} />
          <Separator>/</Separator>
        </>
      )}
      {scriptKey}
    </>
  );
};

export default DebuggerScriptCtxBreadcrumb;
