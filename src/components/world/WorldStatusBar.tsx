import React, { useMemo } from "react";
import { useAppSelector } from "store/hooks";
import l10n from "shared/lib/lang/l10n";
import { sceneSelectors } from "store/features/entities/entitiesState";
import { sceneName } from "shared/lib/entities/entitiesHelpers";
import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
from {
  opacity: 0;
}
to {
  opacity: 1;
}
`;

const Wrapper = styled.div`
  position: absolute;
  bottom: 16px;
  left: 0px;
  background-color: ${(props) => props.theme.colors.document.background};
  color: ${(props) => props.theme.colors.text};
  font-size: 11px;
  border-top-right-radius: 4px;
  padding: 4px 10px;
  animation: ${fadeIn} 0.2s;
`;

const Text = styled.div`
  color: ${(props) => props.theme.colors.text};
  opacity: 0.5;
`;

const Monospace = styled.span`
  font-family: monospace;
`;

const WorldStatusBar = () => {
  const sceneId = useAppSelector((state) => state.editor.hover.sceneId);
  const x = useAppSelector((state) => state.editor.hover.x);
  const y = useAppSelector((state) => state.editor.hover.y);

  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId)
  );
  const sceneIndex = useAppSelector((state) =>
    sceneSelectors.selectIds(state).indexOf(sceneId)
  );
  const hoverSceneName = useMemo(() => {
    return scene && sceneName(scene, sceneIndex);
  }, [scene, sceneIndex]);

  if (!hoverSceneName) {
    return <></>;
  }

  return (
    <Wrapper>
      <Text>
        {hoverSceneName !== undefined && (
          <>
            {hoverSceneName}
            {" : "}
          </>
        )}
        {x !== undefined && (
          <>
            {l10n("FIELD_X")}=<Monospace>{x}</Monospace>{" "}
          </>
        )}
        {y !== undefined && (
          <>
            {l10n("FIELD_Y")}=<Monospace>{y}</Monospace>{" "}
          </>
        )}
      </Text>
    </Wrapper>
  );
};

export default WorldStatusBar;
