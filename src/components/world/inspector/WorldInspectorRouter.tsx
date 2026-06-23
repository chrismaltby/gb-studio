import React from "react";
import { useAppSelector } from "store/hooks";
import { TriggerInspector } from "./triggers/TriggerInspector";
import { ActorInspector } from "./actors/ActorInspector";
import { SceneInspector } from "./scenes/SceneInspector";
import { WorldInspector } from "./WorldInspector";
import { CustomEventInspector } from "./scripts/CustomEventInspector";
import { VariableInspector } from "./variables/VariableInspector";
import { ActorPrefabInspector } from "./prefabs/ActorPrefabInspector";
import { TriggerPrefabInspector } from "./prefabs/TriggerPrefabInspector";
import { ConstantInspector } from "./constants/ConstantInspector";
import { NoteInspector } from "./notes/NoteInspector";

const WorldInspectorRouter = () => {
  const type = useAppSelector((state) => state.editor.type);
  const entityId = useAppSelector((state) => state.editor.entityId);
  const sceneId = useAppSelector((state) => state.editor.scene);

  if (type === "world") {
    return <WorldInspector />;
  }
  if (type === "scene") {
    return <SceneInspector key={sceneId} id={sceneId} />;
  }
  if (type === "note") {
    return <NoteInspector id={entityId} />;
  }
  if (type === "actor") {
    return <ActorInspector key={entityId} id={entityId} sceneId={sceneId} />;
  }
  if (type === "trigger") {
    return <TriggerInspector key={entityId} id={entityId} sceneId={sceneId} />;
  }
  if (type === "actorPrefab") {
    return <ActorPrefabInspector key={entityId} id={entityId} />;
  }
  if (type === "triggerPrefab") {
    return <TriggerPrefabInspector key={entityId} id={entityId} />;
  }
  if (type === "customEvent") {
    return <CustomEventInspector key={entityId} id={entityId} />;
  }
  if (type === "variable") {
    return <VariableInspector id={entityId} />;
  }
  if (type === "constant") {
    return <ConstantInspector id={entityId} />;
  }
  return <div />;
};

export default WorldInspectorRouter;
