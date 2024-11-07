import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import { spriteAnimationSelectors } from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import { CloneIcon, PlusIcon } from "ui/icons/Icons";
import { SpriteAnimationTimelineFrame } from "./SpriteAnimationTimelineFrame";
import { FixedSpacer, FlexGrow } from "ui/spacing/Spacing";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SortableList } from "ui/lists/SortableList";

interface SpriteAnimationTimelineProps {
  spriteSheetId: string;
  animationId: string;
  metaspriteId: string;
  additionalMetaspriteIds: string[];
}

const AddFrameButton = styled.button`
  background: ${(props) => props.theme.colors.button.nestedBackground};
  width: 50px;
  height: 50px;
  border: 0;
  border-radius: 4px;
  svg {
    fill: ${(props) => props.theme.colors.button.text};
  }
  &:hover {
    background: ${(props) => props.theme.colors.button.nestedActiveBackground};
  }
`;

const SpriteAnimationTimeline = ({
  spriteSheetId,
  animationId,
  metaspriteId,
  additionalMetaspriteIds,
}: SpriteAnimationTimelineProps) => {
  const lastIndex = useRef(-1);
  const dispatch = useAppDispatch();

  const animation = useAppSelector((state) =>
    spriteAnimationSelectors.selectById(state, animationId)
  );

  const frames = useMemo(() => animation?.frames || [], [animation?.frames]);
  const [cloneFrame, setCloneFrame] = useState(false);

  const onSetFrame = useCallback(
    (frameId: string, multiSelection?: boolean) => {
      lastIndex.current = frames.indexOf(frameId);
      if (multiSelection) {
        dispatch(editorActions.toggleMultiSelectedMetaspriteId(frameId));
      } else {
        dispatch(editorActions.setSelectedMetaspriteId(frameId));
      }
    },
    [dispatch, frames]
  );

  const onSetFrameRange = useCallback(
    (frameId: string) => {
      const thisFrame = frames.indexOf(frameId);
      const fromFrame = lastIndex.current;
      const from = Math.min(fromFrame, thisFrame);
      const to = Math.max(fromFrame, thisFrame);
      const addFrames: string[] = [];
      for (let i = from; i <= to; i++) {
        if (frames[i]) {
          addFrames.push(frames[i]);
        }
      }
      dispatch(editorActions.addMetaspriteIdsToMultiSelection(addFrames));
    },
    [dispatch, frames]
  );

  const onClearMultiSelect = useCallback(() => {
    dispatch(editorActions.clearMultiSelectedMetaspriteId());
  }, [dispatch]);

  const onAddFrame = useCallback(() => {
    dispatch(
      entitiesActions.addMetasprite({
        spriteSheetId,
        spriteAnimationId: animationId,
        afterMetaspriteId: metaspriteId,
      })
    );
  }, [animationId, dispatch, metaspriteId, spriteSheetId]);

  const onCloneFrame = useCallback(() => {
    dispatch(
      entitiesActions.cloneMetasprites({
        spriteSheetId,
        spriteAnimationId: animationId,
        metaspriteIds:
          additionalMetaspriteIds.length === 0
            ? [metaspriteId]
            : additionalMetaspriteIds,
      })
    );
  }, [
    dispatch,
    spriteSheetId,
    animationId,
    additionalMetaspriteIds,
    metaspriteId,
  ]);

  const onDeleteFrames = useCallback(() => {
    dispatch(
      entitiesActions.removeMetasprites({
        spriteSheetId,
        spriteAnimationId: animationId,
        metaspriteIds: additionalMetaspriteIds,
      })
    );
  }, [dispatch, spriteSheetId, animationId, additionalMetaspriteIds]);

  const onMoveFrames = useCallback(
    (fromIndex: number, toIndex: number) => {
      const multiSelectionIndexes = additionalMetaspriteIds.map((id) =>
        frames.findIndex((i) => i === id)
      );
      if (multiSelectionIndexes.includes(toIndex)) {
        return;
      }

      dispatch(
        entitiesActions.moveSpriteAnimationFrames({
          spriteSheetId,
          spriteAnimationId: animationId,
          fromIndexes:
            multiSelectionIndexes.length > 0
              ? multiSelectionIndexes
              : [fromIndex],
          toIndex,
        })
      );
    },
    [additionalMetaspriteIds, animationId, dispatch, frames, spriteSheetId]
  );

  const handleKeys = useCallback((e: KeyboardEvent) => {
    if (e.altKey) {
      setCloneFrame(true);
    }
  }, []);

  const handleKeysUp = useCallback((e: KeyboardEvent) => {
    if (!e.altKey) {
      setCloneFrame(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeys);
    window.addEventListener("keyup", handleKeysUp);

    return () => {
      window.removeEventListener("keydown", handleKeys);
      window.removeEventListener("keyup", handleKeysUp);
    };
  });

  return (
    <SortableList
      itemType={"frame"}
      items={frames}
      extractKey={(frameId) => frameId}
      selectedIndex={frames.indexOf(metaspriteId)}
      renderItem={(frameId, { isDragging, isDraggingAny }) => (
        <SpriteAnimationTimelineFrame
          selected={frameId === metaspriteId}
          multiSelected={additionalMetaspriteIds.includes(frameId)}
          isDragging={
            isDragging ||
            (isDraggingAny &&
              frameId !== metaspriteId &&
              additionalMetaspriteIds.includes(frameId))
          }
          id={frameId}
          spriteSheetId={spriteSheetId}
          animationId={animationId}
          index={frames.indexOf(frameId)}
        />
      )}
      onSelect={(frameId, e) => {
        if (e?.shiftKey) {
          onSetFrameRange(frameId);
        } else {
          onSetFrame(frameId, e?.ctrlKey || e?.metaKey);
        }
      }}
      moveItems={onMoveFrames}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClearMultiSelect();
          return true;
        } else if (e.key === "Backspace" || e.key === "Delete") {
          onDeleteFrames();
        }
      }}
      appendComponent={
        <>
          <AddFrameButton
            onClick={cloneFrame ? onCloneFrame : onAddFrame}
            title={
              cloneFrame ? l10n("FIELD_CLONE_FRAME") : l10n("FIELD_ADD_FRAME")
            }
          >
            {cloneFrame ? <CloneIcon /> : <PlusIcon />}
          </AddFrameButton>
          <FixedSpacer width={10} />
          <FlexGrow onClick={onClearMultiSelect} />
        </>
      }
    />
  );
};

export default SpriteAnimationTimeline;
