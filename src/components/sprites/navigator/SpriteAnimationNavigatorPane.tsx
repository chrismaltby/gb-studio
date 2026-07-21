import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  spriteSheetSelectors,
  spriteStateSelectors,
} from "store/features/entities/entitiesSelectors";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { SpriteStateNormalized } from "shared/lib/entities/entitiesTypes";
import { EntityListItem } from "ui/lists/EntityListItem";
import l10n from "shared/lib/lang/l10n";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { Button } from "ui/buttons/Button";
import {
  ArrowIdleIcon,
  ArrowJumpIcon,
  ArrowMoveIcon,
  PlusIcon,
} from "ui/icons/Icons";
import styled from "styled-components";
import useToggleableList from "ui/hooks/use-toggleable-list";
import {
  AnimationType,
  filterAnimationsBySpriteType,
  getAnimationTypeByIndex,
} from "shared/lib/sprites/helpers";
import { getAnimationNameForType } from "renderer/lib/sprites/spriteL10NHelpers";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import { SplitPaneChildProps } from "ui/splitpane/SplitPaneVerticalContainer";

interface SpriteNavigatorItem {
  id: string;
  name: string;
}

interface AnimationNavigatorItem {
  id: string;
  type: "state" | "animation";
  animationId: string;
  stateId: string;
  name: string;
  isOpen?: boolean;
  nestLevel?: number;
  animationType?: AnimationType;
  warning?: string;
}

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (a: { name: string }, b: { name: string }) => {
  return collator.compare(a.name, b.name);
};

const Pane = styled.div`
  overflow: hidden;
`;

const animationTypeIcons: Record<AnimationType, ReactNode> = {
  idle: <ArrowIdleIcon style={{ transform: "rotate(90deg)" }} />,
  moving: <ArrowMoveIcon style={{ transform: "rotate(90deg)" }} />,
  idleLeft: <ArrowIdleIcon style={{ transform: "rotate(180deg)" }} />,
  idleRight: <ArrowIdleIcon />,
  idleUp: <ArrowIdleIcon style={{ transform: "rotate(270deg)" }} />,
  idleDown: <ArrowIdleIcon style={{ transform: "rotate(90deg)" }} />,
  movingLeft: <ArrowMoveIcon style={{ transform: "rotate(180deg)" }} />,
  movingRight: <ArrowMoveIcon />,
  movingUp: <ArrowMoveIcon style={{ transform: "rotate(270deg)" }} />,
  movingDown: <ArrowMoveIcon style={{ transform: "rotate(90deg)" }} />,
  jumpingLeft: <ArrowJumpIcon style={{ transform: "scale(-1,1)" }} />,
  jumpingRight: <ArrowJumpIcon />,
  climbing: <ArrowIdleIcon style={{ transform: "rotate(270deg)" }} />,
  hover: <ArrowJumpIcon />,
};

const EMPTY_STATE_IDS: string[] = [];

interface SpriteAnimationNavigatorPaneProps extends SplitPaneChildProps {
  viewSpriteId: string;
}

export const SpriteAnimationNavigatorPane = ({
  viewSpriteId,
  height,
  onToggle,
}: SpriteAnimationNavigatorPaneProps) => {
  const navigationStateId = useAppSelector(
    (state) => state.editor.selectedSpriteStateId,
  );
  const selectedSpriteStateIds = useAppSelector(
    (state) =>
      spriteSheetSelectors.selectById(state, viewSpriteId)?.states ??
      EMPTY_STATE_IDS,
  );
  const spriteStatesLookup = useAppSelector((state) =>
    spriteStateSelectors.selectEntities(state),
  );
  const selectedAnimationId =
    useAppSelector((state) => state.editor.selectedAnimationId) || "group";

  const selectedState = spriteStatesLookup[navigationStateId];
  const hasMultipleSelectedSpriteStates = selectedSpriteStateIds.length > 1;

  const {
    values: closedStates,
    toggle: toggleStateOpen,
    unset: openState,
    set: closeState,
  } = useToggleableList<string>([], "spriteAnimationNavigator");

  const dispatch = useAppDispatch();

  const spriteAnimations = useMemo(() => {
    if (selectedSpriteStateIds.length === 0) {
      return [];
    }

    const list: AnimationNavigatorItem[] = [];
    const seenStateNames = new Set<string>();

    const states = selectedSpriteStateIds
      .map((stateId) => spriteStatesLookup[stateId])
      .filter((state): state is SpriteStateNormalized => Boolean(state))
      .sort(sortByName);

    const hasMultipleStates = states.length > 1;

    for (const state of states) {
      const stateOpen = !closedStates.includes(state.id);
      const name = state.name || l10n("FIELD_DEFAULT");

      if (hasMultipleStates) {
        list.push({
          id: state.id,
          animationId: "group",
          stateId: state.id,
          name,
          type: "state",
          isOpen: stateOpen,
          warning: seenStateNames.has(state.name)
            ? l10n("FIELD_DUPLICATE")
            : undefined,
        });

        seenStateNames.add(state.name);
      }

      if (!hasMultipleStates || stateOpen) {
        filterAnimationsBySpriteType(
          state.animations,
          state.animationType,
          state.flipLeft,
        ).forEach((animationId, index) => {
          const animationType = getAnimationTypeByIndex(
            state.animationType,
            state.flipLeft,
            index,
          );

          list.push({
            id: `${state.id}_${animationId}`,
            animationId,
            stateId: state.id,
            name: getAnimationNameForType(animationType),
            type: "animation",
            animationType,
            nestLevel: hasMultipleStates ? 1 : 0,
          });
        });
      }
    }

    return list;
  }, [selectedSpriteStateIds, spriteStatesLookup, closedStates]);

  const fallbackNavigationId = spriteAnimations.find(
    (item) => item.type === "animation",
  )?.id;

  const setSelectAnimationId = useCallback(
    (id: string, item: AnimationNavigatorItem) => {
      dispatch(
        editorActions.setSelectedAnimationId({
          animationId: item.animationId,
          stateId: item.stateId,
        }),
      );
    },
    [dispatch],
  );

  const highlightAnimationId =
    selectedAnimationId === "group"
      ? hasMultipleSelectedSpriteStates
        ? "group"
        : selectedState?.animations?.[0] || selectedAnimationId
      : selectedAnimationId;

  const selectedNavigationId =
    hasMultipleSelectedSpriteStates &&
    (selectedAnimationId === "group" ||
      closedStates.includes(navigationStateId))
      ? navigationStateId
      : `${navigationStateId}_${highlightAnimationId}`;

  const highlightedNavigationId = spriteAnimations.some(
    (item) => item.id === selectedNavigationId,
  )
    ? selectedNavigationId
    : fallbackNavigationId;

  useEffect(() => {
    if (spriteAnimations.length === 0) {
      return;
    }

    const selectedExists = spriteAnimations.some(
      (item) => item.id === selectedNavigationId,
    );

    if (selectedExists || selectedNavigationId === navigationStateId) {
      return;
    }

    dispatch(
      editorActions.setSelectedAnimationId({
        animationId: "",
        stateId: navigationStateId,
      }),
    );
  }, [dispatch, selectedNavigationId, navigationStateId, spriteAnimations]);

  const addState = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      dispatch(
        entitiesActions.addSpriteState({
          spriteSheetId: viewSpriteId,
        }),
      );
    },
    [dispatch, viewSpriteId],
  );

  const [renameId, setRenameId] = useState("");

  const onRenameStateComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editSpriteState({
            spriteStateId: renameId,
            changes: {
              name,
            },
          }),
        );
      }
      setRenameId("");
    },
    [dispatch, renameId],
  );

  const onRenameCancel = useCallback(() => {
    setRenameId("");
  }, []);

  const renderStateContextMenu = useCallback(
    (item: SpriteNavigatorItem) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        <MenuDivider key="div-delete" />,
        <MenuItem
          key="delete"
          onClick={() =>
            dispatch(
              entitiesActions.removeSpriteState({
                spriteSheetId: viewSpriteId,
                spriteStateId: item.id,
              }),
            )
          }
        >
          {l10n("MENU_SPRITE_STATE_DELETE")}
        </MenuItem>,
      ];
    },
    [dispatch, viewSpriteId],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        setRenameId(navigationStateId);
      } else if (e.key === "ArrowRight") {
        openState(navigationStateId);
      } else if (e.key === "ArrowLeft") {
        closeState(navigationStateId);
      }
    },
    [closeState, navigationStateId, openState],
  );

  return (
    <Pane style={{ height }}>
      <SplitPaneHeader
        onToggle={onToggle}
        collapsed={false}
        buttons={
          <Button
            variant="transparent"
            size="small"
            title={l10n("FIELD_ADD_ANIMATION_STATE")}
            onClick={addState}
          >
            <PlusIcon />
          </Button>
        }
      >
        {l10n("FIELD_ANIMATIONS")}
      </SplitPaneHeader>
      <FlatList
        selectedId={highlightedNavigationId}
        items={spriteAnimations}
        setSelectedId={setSelectAnimationId}
        cacheKey="spriteAnimationNavigator"
        height={(height ?? 0) - 30}
        onKeyDown={onKeyDown}
      >
        {({ item, index }) => {
          if (item.type === "state") {
            const isUserDefinedState = index > 0;
            return (
              <EntityListItem
                item={item}
                type={item.type}
                collapsable={true}
                collapsed={!item.isOpen}
                onToggleCollapse={() => toggleStateOpen(item.stateId)}
                rename={isUserDefinedState && renameId === item.id}
                onRename={onRenameStateComplete}
                onRenameCancel={onRenameCancel}
                renderContextMenu={
                  isUserDefinedState ? renderStateContextMenu : undefined
                }
              />
            );
          }
          return (
            <EntityListItem
              item={item}
              type={"custom"}
              icon={
                item.animationType && animationTypeIcons[item.animationType]
              }
              nestLevel={item.nestLevel}
            />
          );
        }}
      </FlatList>
    </Pane>
  );
};
