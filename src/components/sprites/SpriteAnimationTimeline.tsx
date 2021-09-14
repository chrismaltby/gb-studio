import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import throttle from "lodash/throttle";
import { RootState } from "store/configureStore";
import { spriteAnimationSelectors } from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import { CloneIcon, PlusIcon } from "ui/icons/Icons";
import SpriteAnimationTimelineFrame from "./SpriteAnimationTimelineFrame";
import { FixedSpacer } from "ui/spacing/Spacing";
import l10n from "lib/helpers/l10n";

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

  const [hasFocus, setHasFocus] = useState(false);
  const [cloneFrame, setCloneFrame] = useState(false);

  const animation = useSelector((state: RootState) =>
    spriteAnimationSelectors.selectById(state, animationId)
  );

  const frames = useMemo(() => animation?.frames || [], [animation?.frames]);

  const onMoveFrames = useCallback(
    (fromIndex: number, toIndex: number) => {
      dispatch(
        entitiesActions.swapSpriteAnimationFrames({
          spriteSheetId,
          spriteAnimationId: animationId,
          fromIndex,
          toIndex,
        })
      );
    },
    [animationId, dispatch, spriteSheetId]
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
        spriteSheetId,
        spriteAnimationId: animationId,
      })
    );
  }, [animationId, dispatch, spriteSheetId]);

  const onCloneFrame = useCallback(() => {
    dispatch(
      entitiesActions.cloneMetasprite({
        spriteSheetId,
        spriteAnimationId: animationId,
        metaspriteId,
      })
    );
  }, [dispatch, spriteSheetId, animationId, metaspriteId]);

  const onDeleteFrame = useCallback(() => {
    dispatch(
      entitiesActions.removeMetasprite({
        spriteSheetId,
        spriteAnimationId: animationId,
        metaspriteId,
      })
    );
  }, [dispatch, spriteSheetId, animationId, metaspriteId]);

  const handleKeys = useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey) {
        setCloneFrame(true);
      }

      if (!hasFocus) {
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        throttledNext.current(frames, metaspriteId || "");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        throttledPrev.current(frames, metaspriteId || "");
      } else if (e.key === "Home") {
        onSetFrame(frames[0]);
      } else if (e.key === "End") {
        onSetFrame(frames[frames.length - 1]);
      } else if (e.key === "Backspace") {
        onDeleteFrame();
      }
    },
    [hasFocus, frames, metaspriteId, onSetFrame, onDeleteFrame]
  );

  const handleKeysUp = useCallback((e: KeyboardEvent) => {
    if (!e.altKey) {
      setCloneFrame(false);
    }
  }, []);

  const throttledNext = useRef(
    throttle((frames: string[], selectedId: string) => {
      const currentIndex = frames.indexOf(selectedId);
      const nextIndex = (currentIndex + 1) % frames.length;
      const nextItem = frames[nextIndex];
      onSetFrame(nextItem);
    }, 150)
  );

  const throttledPrev = useRef(
    throttle((frames: string[], selectedId: string) => {
      const currentIndex = frames.indexOf(selectedId);
      const prevIndex = (frames.length + currentIndex - 1) % frames.length;
      const prevItem = frames[prevIndex];
      onSetFrame(prevItem);
    }, 150)
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeys);
    window.addEventListener("keyup", handleKeysUp);

    return () => {
      window.removeEventListener("keydown", handleKeys);
      window.removeEventListener("keyup", handleKeysUp);
    };
  });

  return (
    <Wrapper
      tabIndex={0}
      onFocus={() => setHasFocus(true)}
      onBlur={() => setHasFocus(false)}
    >
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
        <AddFrameButton
          onClick={cloneFrame ? onCloneFrame : onAddFrame}
          title={
            cloneFrame ? l10n("FIELD_CLONE_FRAME") : l10n("FIELD_ADD_FRAME")
          }
        >
          {cloneFrame ? <CloneIcon /> : <PlusIcon />}
        </AddFrameButton>
        <FixedSpacer width={10} />
      </ScrollWrapper>
    </Wrapper>
  );
};

export default SpriteAnimationTimeline;
