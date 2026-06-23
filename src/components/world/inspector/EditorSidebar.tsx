import React from "react";
import { useAppSelector } from "store/hooks";
import { TriggerEditor } from "./triggers/TriggerEditor";
import { ActorEditor } from "./actors/ActorEditor";
import { SceneEditor } from "components/world/inspector/scenes/SceneEditor";
import { WorldEditor } from "./WorldEditor";
import CustomEventEditor from "components/world/inspector/scripts/CustomEventEditor";
import { VariableEditor } from "./variables/VariableEditor";
import { ActorPrefabEditor } from "./prefabs/ActorPrefabEditor";
import { TriggerPrefabEditor } from "./prefabs/TriggerPrefabEditor";
import { ConstantEditor } from "./constants/ConstantEditor";
import { NoteEditor } from "components/world/inspector/notes/NoteEditor";

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
  if (type === "constant") {
    return <ConstantEditor id={entityId} />;
  }
  if (type === "note") {
    return <NoteEditor id={entityId} />;
  }
  return <div />;
};

export default EditorSidebar;
