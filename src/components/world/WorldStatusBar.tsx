import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import l10n from "shared/lib/lang/l10n";
import { sceneSelectors } from "store/features/entities/entitiesState";
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
  hide?: boolean;
}

const Container = styled.div<ContainerProps>`
  color: ${(props) => props.theme.colors.text};
  background: ${(props) => props.theme.colors.document.background};
  font-size: ${(props) => props.theme.typography.fontSize};
  box-shadow: 0 0 0 4px ${(props) => props.theme.colors.document.background};
  border-radius: 16px;
  margin-right: 15px;
  height: 19px;
  line-height: 19px;
  margin-right: 15px;

  transition: opacity 0.3s ease-in-out;
  opacity: 1;

  ${(props) =>
    props.hide
      ? css`
          opacity: 0;
        `
      : ""}
`;

const Text = styled.div`
  color: ${(props) => props.theme.colors.text};
  opacity: 0.5;
  padding: 0 5px;
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

  const [hoverLabel, setHoverLabel] = useState({
    sceneName: "",
    x: "00",
    y: "00",
  });

  useEffect(() => {
    if (hoverSceneName) {
      setHoverLabel({
        sceneName: hoverSceneName,
        x: String(x ?? 0).padStart(2, "0"),
        y: String(y ?? 0).padStart(2, "0"),
      });
    }
  }, [hoverSceneName, x, y]);

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
      <Container hide={!hoverSceneName}>
        <Text>
          {hoverLabel.sceneName}
          {" : "}
          {l10n("FIELD_X")}=<Monospace>{hoverLabel.x}</Monospace>{" "}
          {l10n("FIELD_Y")}=<Monospace>{hoverLabel.y}</Monospace>
        </Text>
      </Container>
    </Wrapper>
  );
};

export default WorldStatusBar;
