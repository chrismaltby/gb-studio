import React from "react";
import { useAppSelector } from "store/hooks";
import { TriggerEditor } from "./TriggerEditor";
import { ActorEditor } from "./ActorEditor";
import { SceneEditor } from "./SceneEditor";
import { WorldEditor } from "./WorldEditor";
import CustomEventEditor from "./CustomEventEditor";
import { VariableEditor } from "./VariableEditor";
import { ActorPrefabEditor } from "./ActorPrefabEditor";
import { TriggerPrefabEditor } from "./TriggerPrefabEditor";

const EditorSidebar = () => {
  const type = useAppSelector((state) => state.editor.type);
  const entityId = useAppSelector((state) => state.editor.entityId);
  const sceneId = useAppSelector((state) => state.editor.scene);

  if (type === "trigger") {
    return <TriggerEditor key={entityId} id={entityId} sceneId={sceneId} />;
  }
  if (type === "actor") {
    return <ActorEditor key={entityId} id={entityId} sceneId={sceneId} />;
  }
  if (type === "scene") {
    return <SceneEditor key={sceneId} id={sceneId} />;
  }
  if (type === "world") {
    return <WorldEditor />;
  }
  if (type === "actorPrefab") {
    return <ActorPrefabEditor key="entityId" id={entityId} />;
  }
  if (type === "triggerPrefab") {
    return <TriggerPrefabEditor key="entityId" id={entityId} />;
  }
  if (type === "customEvent") {
    return <CustomEventEditor key="entityId" id={entityId} />;
  }
  if (type === "variable") {
    return <VariableEditor id={entityId} />;
  }
  return <div />;
};

export default EditorSidebar;
