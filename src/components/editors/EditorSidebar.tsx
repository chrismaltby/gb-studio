import React from "react";
import { useAppSelector } from "store/hooks";
import { TriggerEditor } from "./TriggerEditor";
import { ActorEditor } from "./ActorEditor";
import { SceneEditor } from "./SceneEditor";
import { WorldEditor } from "./WorldEditor";
import CustomEventEditor from "./CustomEventEditor";
import { VariableEditor } from "./VariableEditor";

interface EditorSidebarProps {
  multiColumn: boolean;
}

const EditorSidebar = ({ multiColumn }: EditorSidebarProps) => {
  const type = useAppSelector((state) => state.editor.type);
  const entityId = useAppSelector((state) => state.editor.entityId);
  const sceneId = useAppSelector((state) => state.editor.scene);

  if (type === "trigger") {
    return (
      <TriggerEditor
        key={entityId}
        id={entityId}
        sceneId={sceneId}
        multiColumn={multiColumn}
      />
    );
  }
  if (type === "actor") {
    return (
      <ActorEditor
        key={entityId}
        id={entityId}
        sceneId={sceneId}
        multiColumn={multiColumn}
      />
    );
  }
  if (type === "scene") {
    return <SceneEditor key={sceneId} id={sceneId} multiColumn={multiColumn} />;
  }
  if (type === "world") {
    return <WorldEditor />;
  }
  if (type === "customEvent") {
    return (
      <CustomEventEditor
        key="entityId"
        id={entityId}
        multiColumn={multiColumn}
      />
    );
  }
  if (type === "variable") {
    return <VariableEditor id={entityId} />;
  }
  return <div />;
};

export default EditorSidebar;
