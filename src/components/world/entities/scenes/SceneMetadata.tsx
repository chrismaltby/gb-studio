import React, { ReactNode } from "react";
import styled from "styled-components";
import { useSceneLabelOffsets } from "components/world/entities/scenes/hooks/useSceneLabelOffsets";

interface SceneMetadataProps {
  sceneId: string;
  children: ReactNode;
}

const Wrapper = styled.div`
  white-space: nowrap;
  overflow: hidden;
  line-height: 20px;
  font-size: 11px;
  transition:
    padding-left 0.1s ease-in-out,
    padding-right 0.1s ease-in-out;
  transition-delay: 0.3s;

  &:hover {
    cursor: move;
  }
`;

export const SceneMetadata = ({ sceneId, children }: SceneMetadataProps) => {
  const { left, right } = useSceneLabelOffsets(sceneId);
  return (
    <Wrapper
      style={{
        paddingLeft: left,
        paddingRight: right,
      }}
    >
      {children}
    </Wrapper>
  );
};
