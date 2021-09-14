import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "store/configureStore";
import { spriteAnimationSelectors } from "store/features/entities/entitiesState";
import {
  PlayIcon,
  OnionSkinIcon,
  PrevIcon,
  NextIcon,
  GridIcon,
  PauseIcon,
} from "ui/icons/Icons";
import FloatingPanel, { FloatingPanelDivider } from "ui/panels/FloatingPanel";
import editorActions from "store/features/editor/editorActions";
import { Button } from "ui/buttons/Button";
import l10n from "lib/helpers/l10n";

interface MetaspriteEditorToolsPanelProps {
  selectedAnimationId: string;
  metaspriteId: string;
}

const Wrapper = styled(FloatingPanel)`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
`;

const MetaspriteEditorToolsPanel = ({
  selectedAnimationId,
  metaspriteId,
}: MetaspriteEditorToolsPanelProps) => {
  const dispatch = useDispatch();
  const intervalRef = useRef<number>();

  const play = useSelector(
    (state: RootState) => state.editor.playSpriteAnimation
  );
  const showOnionSkin = useSelector(
    (state: RootState) => state.editor.showOnionSkin
  );
  const showSpriteGrid = useSelector(
    (state: RootState) => state.editor.showSpriteGrid
  );

  const spriteAnimation = useSelector((state: RootState) =>
    spriteAnimationSelectors.selectById(state, selectedAnimationId)
  );

  const frames = useMemo(
    () => spriteAnimation?.frames || [],
    [spriteAnimation?.frames]
  );

  const nextFrame = useCallback(() => {
    const currentIndex = frames.indexOf(metaspriteId);
    const nextMetaspriteId = frames[(currentIndex + 1) % frames.length] || "";
    dispatch(editorActions.setSelectedMetaspriteId(nextMetaspriteId));
    dispatch(editorActions.setPlaySpriteAnimation(false));
  }, [dispatch, frames, metaspriteId]);

  const prevFrame = useCallback(() => {
    const currentIndex = frames.indexOf(metaspriteId);
    const prevMetaspriteId =
      frames[(frames.length + (currentIndex - 1)) % frames.length] || "";
    dispatch(editorActions.setSelectedMetaspriteId(prevMetaspriteId));
    dispatch(editorActions.setPlaySpriteAnimation(false));
  }, [dispatch, frames, metaspriteId]);

  const togglePlay = useCallback(() => {
    dispatch(editorActions.setPlaySpriteAnimation(!play));
  }, [dispatch, play]);

  const toggleOnionSkin = useCallback(() => {
    dispatch(editorActions.setShowOnionSkin(!showOnionSkin));
  }, [dispatch, showOnionSkin]);

  const toggleSpriteGrid = useCallback(() => {
    dispatch(editorActions.setShowSpriteGrid(!showSpriteGrid));
  }, [dispatch, showSpriteGrid]);

  useEffect(() => {
    if (play) {
      const id = setInterval(() => {
        const currentIndex = frames.indexOf(metaspriteId);
        const nextMetaspriteId =
          frames[(currentIndex + 1) % frames.length] || "";
        dispatch(editorActions.setSelectedMetaspriteId(nextMetaspriteId));
      }, 1000 / (60 / 8));
      intervalRef.current = id;
    }
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [play, dispatch, frames, metaspriteId]);

  return (
    <Wrapper>
      <Button
        variant="transparent"
        onClick={prevFrame}
        title={l10n("FIELD_PREVIOUS_FRAME")}
      >
        <PrevIcon />
      </Button>
      <Button
        variant="transparent"
        onClick={togglePlay}
        title={play ? l10n("FIELD_PAUSE") : l10n("FIELD_PLAY")}
      >
        {play ? <PauseIcon /> : <PlayIcon />}
      </Button>
      <Button
        variant="transparent"
        onClick={nextFrame}
        title={l10n("FIELD_NEXT_FRAME")}
      >
        <NextIcon />
      </Button>
      <FloatingPanelDivider />
      <Button
        variant="transparent"
        active={showOnionSkin}
        onClick={toggleOnionSkin}
        title={`${l10n("FIELD_ONION_SKIN")}${
          showOnionSkin ? ` (${l10n("FIELD_ENABLED")})` : ""
        }`}
      >
        <OnionSkinIcon />
      </Button>
      <Button
        variant="transparent"
        active={showSpriteGrid}
        onClick={toggleSpriteGrid}
        title={`${l10n("FIELD_SHOW_GRID")}${
          showSpriteGrid ? ` (${l10n("FIELD_ENABLED")})` : ""
        }`}
      >
        <GridIcon />
      </Button>
      {/* <FloatingPanelDivider /> */}
      {/* <Button variant="transparent">
        <EyeOpenIcon />
      </Button> */}
    </Wrapper>
  );
};

export default MetaspriteEditorToolsPanel;
