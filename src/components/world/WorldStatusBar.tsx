import React, { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import l10n from "shared/lib/lang/l10n";
import { sceneSelectors } from "store/features/entities/entitiesState";
import { sceneName } from "shared/lib/entities/entitiesHelpers";
import settingsActions from "store/features/settings/settingsActions";
import styled, { keyframes } from "styled-components";
import { PillButton } from "ui/buttons/PillButton";

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
  display: flex;
  align-items: center;
  bottom: 25px;
  left: 10px;
  z-index: 11;
  border-radius: 16px;
  background: ${(props) => props.theme.colors.document.background};
  box-shadow: 0 0 0 4px ${(props) => props.theme.colors.document.background};
  font-size: ${(props) => props.theme.typography.fontSize};
`;

const Text = styled.div`
  color: ${(props) => props.theme.colors.text};
  opacity: 0.5;
  animation: ${fadeIn} 0.2s;
  margin-left: 5px;
  margin-right: 5px;
`;

const Monospace = styled.span`
  font-family: monospace;
`;

const WorldStatusBar = () => {
  const dispatch = useAppDispatch();
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
  const canPreviewAsMono = useAppSelector(
    (state) => state.project.present.settings.colorMode === "mixed"
  );
  const previewAsMono = useAppSelector(
    (state) => canPreviewAsMono && state.project.present.settings.previewAsMono
  );

  const onTogglePreviewAsMono = useCallback(() => {
    dispatch(
      settingsActions.editSettings({
        previewAsMono: !previewAsMono,
      })
    );
  }, [dispatch, previewAsMono]);

  return (
    <Wrapper>
      {canPreviewAsMono && (
        <PillButton
          variant={previewAsMono ? "primary" : "normal"}
          onClick={onTogglePreviewAsMono}
        >
          {l10n("FIELD_PREVIEW_AS_MONO")}
        </PillButton>
      )}
      {hoverSceneName && (
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
      )}
    </Wrapper>
  );
};

export default WorldStatusBar;
