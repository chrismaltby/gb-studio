import React, { memo, useMemo } from "react";
import { sceneName } from "shared/lib/entities/entitiesHelpers";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import { useAppSelector, useAppSelectorPick } from "store/hooks";
import styled from "styled-components";

interface SceneFilteredOverlayProps {
  sceneId: string;
  index: number;
}

const Wrapper = styled.div`
  background-color: ${(props) => props.theme.colors.background};
  border-radius: 4px;
  opacity: 0.8;
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  pointer-events: none;
`;

export const SceneFilteredOverlay = memo(
  ({ sceneId, index }: SceneFilteredOverlayProps) => {
    const scene = useAppSelectorPick(
      (state) => sceneSelectors.selectById(state, sceneId),
      ["name"],
    );

    const multiSelected = useAppSelector((state) =>
      state.editor.sceneSelectionIds.includes(sceneId),
    );

    const hasMultipleSceneSelection = useAppSelector(
      (state) => state.editor.sceneSelectionIds.length > 1,
    );

    const searchTerm = useAppSelector((state) => state.editor.searchTerm);

    const name = useMemo(
      () => (scene ? sceneName(scene, index) : ""),
      [index, scene],
    );

    const sceneFiltered =
      (searchTerm &&
        name.toUpperCase().indexOf(searchTerm.toUpperCase()) === -1 &&
        sceneId !== searchTerm) ||
      (hasMultipleSceneSelection && !multiSelected) ||
      false;

    if (!sceneFiltered) {
      return null;
    }

    return <Wrapper />;
  },
);
