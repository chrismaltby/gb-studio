import React, { memo, useMemo } from "react";
import styled from "styled-components";
import { useEnabledSceneTypeIds } from "store/features/engine/hooks/useEnabledSceneTypeIds";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import { useAppSelector } from "store/hooks";
import { WarningIcon } from "ui/icons/Icons";

interface SceneTypeDisabledOverlayProps {
  sceneId: string;
}

const SceneErrorOverlay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.8);
  pointer-events: none;

  svg {
    background: ${(props) => props.theme.colors.highlight};
    fill: ${(props) => props.theme.colors.highlightText};
    padding: 10px;
    border-radius: 4px;
  }
`;

export const SceneTypeDisabledOverlay = memo(
  ({ sceneId }: SceneTypeDisabledOverlayProps) => {
    const sceneType = useAppSelector(
      (state) => sceneSelectors.selectById(state, sceneId)?.type,
    );
    const enabledSceneTypeIds = useEnabledSceneTypeIds();

    const sceneTypeEnabled = useMemo(() => {
      return !!sceneType && enabledSceneTypeIds.includes(sceneType);
    }, [enabledSceneTypeIds, sceneType]);

    if (sceneTypeEnabled) {
      return null;
    }

    return (
      <SceneErrorOverlay>
        <WarningIcon />
      </SceneErrorOverlay>
    );
  },
);
