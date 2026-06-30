import React, { useMemo } from "react";
import styled from "styled-components";
import { SceneMetadata } from "components/world/entities/scenes/SceneMetadata";
import { useAppSelectorPick } from "store/hooks";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import { TILE_SIZE } from "consts";
import { LabelSpan } from "ui/buttons/LabelButton";
import { sceneName } from "shared/lib/entities/entitiesHelpers";

interface SceneTitleProps {
  sceneId: string;
  sceneIndex: number;
}

const SceneName = styled.div`
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SceneTitle = ({ sceneId, sceneIndex }: SceneTitleProps) => {
  const scene = useAppSelectorPick(
    (state) => sceneSelectors.selectById(state, sceneId),
    ["notes", "width", "labelColor", "name"],
  );

  const name = useMemo(
    () => (scene ? sceneName(scene, sceneIndex) : ""),
    [sceneIndex, scene],
  );

  const lastNamePart = useMemo(() => name.replace(/.*[/\\]/, ""), [name]);

  if (!scene) {
    return null;
  }

  return (
    <SceneMetadata sceneId={sceneId}>
      <SceneName
        title={scene.notes}
        style={{
          maxWidth: scene.width * TILE_SIZE,
        }}
      >
        <LabelSpan color={scene.labelColor}>{lastNamePart}</LabelSpan>
      </SceneName>
    </SceneMetadata>
  );
};
