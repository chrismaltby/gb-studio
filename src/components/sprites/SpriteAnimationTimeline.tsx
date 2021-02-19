import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "../../store/configureStore";
import { spriteAnimationSelectors } from "../../store/features/entities/entitiesState";
import entitiesActions from "../../store/features/entities/entitiesActions";
import editorActions from "../../store/features/editor/editorActions";
import { PlusIcon } from "../ui/icons/Icons";
import SpriteAnimationTimelineFrame from "./SpriteAnimationTimelineFrame";
import { FixedSpacer } from "../ui/spacing/Spacing";

interface SpriteAnimationTimelineProps {
  spriteSheetId: string;
  animationId: string;
  metaspriteId: string;
}

const Wrapper = styled.div`
  min-width: 0;
`;

const ScrollWrapper = styled.div`
  overflow: auto;
  max-width: 100%;
  max-height: 100%;
  overflow-x: scroll;
  display: flex;
  background: ${(props) => props.theme.colors.sidebar.background};
  overflow-x: auto;
  padding: 10px;
  padding-right: 50px;

  & > * {
    margin-right: 10px;
    flex-shrink: 0;
  }
`;

const AddFrameButton = styled.button`
  background: ${(props) => props.theme.colors.button.nestedBackground};
  width: 50px;
  height: 50px;
  border: 0;
  border-radius: 4px;
  svg {
    fill: ${(props) => props.theme.colors.button.text};
  }
  :hover {
    background: ${(props) => props.theme.colors.button.nestedActiveBackground};
  }
`;

const SpriteAnimationTimeline = ({
  spriteSheetId,
  animationId,
  metaspriteId,
}: SpriteAnimationTimelineProps) => {
  const dispatch = useDispatch();

  const animation = useSelector((state: RootState) =>
    spriteAnimationSelectors.selectById(state, animationId)
  );

  const onMoveFrames = useCallback(
    (fromIndex: number, toIndex: number) => {
      dispatch(
        entitiesActions.swapSpriteAnimationFrames({
          spriteAnimationId: animationId,
          fromIndex,
          toIndex,
        })
      );
    },
    [animationId, dispatch]
  );

  const onSetFrame = useCallback(
    (frameId: string) => {
      dispatch(editorActions.setSelectedMetaspriteId(frameId));
    },
    [dispatch]
  );

  const onAddFrame = useCallback(() => {
    dispatch(
      entitiesActions.addMetasprite({
        spriteAnimationId: animationId,
      })
    );
  }, [animationId, dispatch]);

  const frames = animation?.frames || [];

  return (
    <Wrapper>
      <ScrollWrapper>
        {frames.map((frameMetaspriteId, i) => {
          return (
            <SpriteAnimationTimelineFrame
              key={frameMetaspriteId}
              index={i}
              id={frameMetaspriteId}
              spriteSheetId={spriteSheetId}
              text={frameMetaspriteId}
              selected={frameMetaspriteId === metaspriteId}
              moveCard={onMoveFrames}
              onSelect={onSetFrame}
            />
          );
        })}
        <AddFrameButton onClick={onAddFrame}>
          <PlusIcon />
        </AddFrameButton>
        <FixedSpacer width={10} />
      </ScrollWrapper>
    </Wrapper>
  );
};

export default SpriteAnimationTimeline;
