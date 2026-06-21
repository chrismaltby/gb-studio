import React, { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import l10n from "shared/lib/lang/l10n";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import { sceneName } from "shared/lib/entities/entitiesHelpers";
import settingsActions from "store/features/settings/settingsActions";
import styled, { css } from "styled-components";
import { PillButton } from "ui/buttons/PillButton";

const Wrapper = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  bottom: 25px;
  left: 10px;
  z-index: 11;
  padding-left: 5px;
`;

interface ContainerProps {
  $hide?: boolean;
}

const Container = styled.div<ContainerProps>`
  color: ${(props) => props.theme.colors.text};
  font-size: ${(props) => props.theme.typography.fontSize};
  background: ${(props) => props.theme.colors.background};
  box-shadow: 0 0 0 4px ${(props) => props.theme.colors.background};
  border-radius: 16px;
  margin-right: 15px;
  height: 19px;
  line-height: 19px;

  transition: opacity 0.3s ease-in-out;
  opacity: 1;

  ${(props) =>
    props.$hide
      ? css`
          opacity: 0;
        `
      : ""}
`;

const Text = styled.div`
  color: ${(props) => props.theme.colors.text};
  padding: 0 5px;
`;

const Monospace = styled.span`
  font-family: monospace;
`;

const WorldStatusBar = () => {
  const dispatch = useAppDispatch();
  const x = useAppSelector((state) => state.editor.hover.x);
  const y = useAppSelector((state) => state.editor.hover.y);

  const hoverSceneName = useAppSelector((state) => {
    const sceneId = state.editor.hover.sceneId;
    const scene = sceneSelectors.selectById(state, sceneId);
    const sceneIndex = sceneSelectors.selectIds(state).indexOf(sceneId);
    return scene && sceneName(scene, sceneIndex);
  });

  const canPreviewAsMono = useAppSelector(
    (state) => state.project.present.settings.colorMode === "mixed",
  );
  const previewAsMono = useAppSelector(
    (state) => canPreviewAsMono && state.project.present.settings.previewAsMono,
  );

  const onTogglePreviewAsMono = useCallback(() => {
    dispatch(
      settingsActions.editSettings({
        previewAsMono: !previewAsMono,
      }),
    );
  }, [dispatch, previewAsMono]);

  const hoverX = String(x ?? 0).padStart(2, "0");
  const hoverY = String(y ?? 0).padStart(2, "0");
  const hoverSceneLabel = hoverSceneName ?? "";

  return (
    <Wrapper>
      {canPreviewAsMono && (
        <Container>
          <PillButton
            variant={previewAsMono ? "primary" : "normal"}
            onClick={onTogglePreviewAsMono}
          >
            {l10n("FIELD_PREVIEW_AS_MONO")}
          </PillButton>
        </Container>
      )}
      <Container $hide={!hoverSceneName}>
        <Text>
          {hoverSceneLabel}
          {" : "}
          {l10n("FIELD_X")}=<Monospace>{hoverX}</Monospace> {l10n("FIELD_Y")}=
          <Monospace>{hoverY}</Monospace>
        </Text>
      </Container>
    </Wrapper>
  );
};

export default WorldStatusBar;
