import React, { ReactNode, useCallback, useEffect, useState } from "react";
import {
  spriteAnimationSelectors,
  spriteSheetSelectors,
  spriteStateSelectors,
} from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { SpriteSheet, SpriteState } from "shared/lib/entities/entitiesTypes";
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
import { SplitPaneVerticalDivider } from "ui/splitpane/SplitPaneDivider";
import useSplitPane from "ui/hooks/use-split-pane";
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
import { stripInvalidPathCharacters } from "shared/lib/helpers/stripInvalidFilenameCharacters";
import projectActions from "store/features/project/projectActions";

interface NavigatorSpritesProps {
  height: number;
  selectedId: string;
  selectedAnimationId: string;
  selectedStateId: string;
  defaultFirst?: boolean;
}

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

const COLLAPSED_SIZE = 30;
const REOPEN_SIZE = 300;

const spriteToNavigatorItem = (
  sprite: SpriteSheet,
  spriteIndex: number
): SpriteNavigatorItem => ({
  id: sprite.id,
  name: sprite.name ? sprite.name : `Sprite ${spriteIndex + 1}`,
});

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

export const NavigatorSprites = ({
  height,
  selectedId,
  selectedStateId,
}: NavigatorSpritesProps) => {
  const [splitSizes, setSplitSizes] = useState([300, 200]);
  const [onDragStart, togglePane] = useSplitPane({
    sizes: splitSizes,
    setSizes: setSplitSizes,
    minSizes: [COLLAPSED_SIZE, COLLAPSED_SIZE],
    collapsedSize: COLLAPSED_SIZE,
    reopenSize: REOPEN_SIZE,
    maxTotal: height,
    direction: "vertical",
  });
  const [spriteAnimations, setSpriteAnimations] = useState<
    AnimationNavigatorItem[]
  >([]);
  const [items, setItems] = useState<SpriteNavigatorItem[]>([]);
  const allSprites = useAppSelector((state) =>
    spriteSheetSelectors.selectAll(state)
  );
  const spritesLookup = useAppSelector((state) =>
    spriteSheetSelectors.selectEntities(state)
  );
  const spriteStatesLookup = useAppSelector((state) =>
    spriteStateSelectors.selectEntities(state)
  );
  const spriteAnimationsLookup = useAppSelector((state) =>
    spriteAnimationSelectors.selectEntities(state)
  );
  const selectedAnimationId =
    useAppSelector((state) => state.editor.selectedAnimationId) || "group";

  const selectedSprite = spritesLookup[selectedId];
  const selectedState = spriteStatesLookup[selectedStateId];

  const {
    values: closedStates,
    toggle: toggleStateOpen,
    unset: openState,
    set: closeState,
  } = useToggleableList<string>([]);

  const dispatch = useAppDispatch();

  useEffect(() => {
    setItems(
      allSprites
        .map((sprite, spriteIndex) =>
          spriteToNavigatorItem(sprite, spriteIndex)
        )
        .sort(sortByName)
    );
  }, [allSprites]);

  useEffect(() => {
    if (selectedSprite?.states) {
      const list: AnimationNavigatorItem[] = [];
      const seenStates: string[] = [];

      const tree = selectedSprite.states.map((stateId) => {
        const state = spriteStatesLookup[stateId] as SpriteState;
        return {
          ...state,
        };
      });

      tree.sort(sortByName).forEach((state) => {
        const stateOpen = !closedStates.includes(state.id);
        if (tree.length > 1) {
          list.push({
            id: state.id,
            animationId: "group",
            stateId: state.id,
            name: state.name || l10n("FIELD_DEFAULT"),
            type: "state",
            isOpen: stateOpen,
            warning: seenStates.includes(state.name)
              ? l10n("FIELD_DUPLICATE")
              : undefined,
          });
          seenStates.push(state.name);
        }
        if (tree.length === 1 || stateOpen) {
          filterAnimationsBySpriteType(
            state.animations,
            state.animationType,
            state.flipLeft
          ).forEach((id, index) => {
            const animType = getAnimationTypeByIndex(
              state.animationType,
              state.flipLeft,
              index
            );
            list.push({
              id: `${state.id}_${id}`,
              animationId: id,
              stateId: state.id,
              name: getAnimationNameForType(animType),
              type: "animation",
              animationType: animType,
              nestLevel: tree.length === 1 ? 0 : 1,
            });
          });
        }
      });

      setSpriteAnimations(list);
    }
  }, [
    selectedSprite?.states,
    spriteStatesLookup,
    spriteAnimationsLookup,
    closedStates,
    selectedStateId,
  ]);

  const setSelectedId = useCallback(
    (id: string) => {
      dispatch(editorActions.setSelectedSpriteSheetId(id));
    },
    [dispatch]
  );

  const setSelectAnimationId = useCallback(
    (id: string, item: AnimationNavigatorItem) => {
      dispatch(
        editorActions.setSelectedAnimationId({
          animationId: item.animationId,
          stateId: item.stateId,
        })
      );
    },
    [dispatch]
  );

  const highlightAnimationId =
    selectedAnimationId === "group"
      ? (selectedSprite?.states.length || 0) > 1
        ? "group"
        : selectedState?.animations?.[0] || selectedAnimationId
      : selectedAnimationId;

  const selectedNavigationId =
    (selectedSprite?.states.length || 0) > 1 &&
    (selectedAnimationId === "group" || closedStates.includes(selectedStateId))
      ? `${selectedStateId}_group`
      : `${selectedStateId}_${highlightAnimationId}`;

  useEffect(() => {
    if (spriteAnimations.length > 0) {
      const selected = spriteAnimations.find(
        (a) => a.id === selectedNavigationId
      );
      // If selected sprite animation is hidden
      // reset sub navigation to select root of state
      if (!selected) {
        const newId = `${selectedStateId}_group`;
        if (selectedNavigationId !== newId) {
          dispatch(
            editorActions.setSelectedAnimationId({
              animationId: "",
              stateId: selectedStateId,
            })
          );
        }
      }
    }
  }, [dispatch, selectedNavigationId, selectedStateId, spriteAnimations]);

  const addState = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      dispatch(
        entitiesActions.addSpriteState({
          spriteSheetId: selectedId,
        })
      );
    },
    [dispatch, selectedId]
  );

  const [renameId, setRenameId] = useState("");

  const listenForRenameStart = useCallback(
    (e) => {
      if (e.key === "Enter") {
        setRenameId(selectedId);
      }
    },
    [selectedId]
  );

  const onRenameSpriteComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          projectActions.renameSpriteAsset({
            spriteSheetId: renameId,
            newFilename: stripInvalidPathCharacters(name),
          })
        );
      }
      setRenameId("");
    },
    [dispatch, renameId]
  );

  const onRenameStateComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editSpriteState({
            spriteStateId: renameId,
            changes: {
              name,
            },
          })
        );
      }
      setRenameId("");
    },
    [dispatch, renameId]
  );

  const renderContextMenu = useCallback(
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
              projectActions.removeSpriteAsset({
                spriteSheetId: item.id,
              })
            )
          }
        >
          {l10n("MENU_DELETE_SPRITE")}
        </MenuItem>,
      ];
    },
    [dispatch]
  );

  return (
    <>
      <Pane style={{ height: splitSizes[0] }}>
        <SplitPaneHeader
          onToggle={() => togglePane(0)}
          collapsed={Math.floor(splitSizes[0]) <= COLLAPSED_SIZE}
        >
          {l10n("FIELD_SPRITES")}
        </SplitPaneHeader>

        <FlatList
          selectedId={selectedId}
          items={items}
          setSelectedId={setSelectedId}
          height={splitSizes[0] - 30}
          onKeyDown={listenForRenameStart}
        >
          {({ item }) => (
            <EntityListItem
              type="sprite"
              item={item}
              rename={renameId === item.id}
              onRename={onRenameSpriteComplete}
              renderContextMenu={renderContextMenu}
            />
          )}
        </FlatList>
      </Pane>
      <SplitPaneVerticalDivider onMouseDown={onDragStart(0)} />
      <Pane style={{ height: splitSizes[1] }}>
        <SplitPaneHeader
          onToggle={() => togglePane(1)}
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
          selectedId={selectedNavigationId}
          items={spriteAnimations}
          setSelectedId={setSelectAnimationId}
          height={splitSizes[1] - 30}
          onKeyDown={(e: KeyboardEvent) => {
            if (e.key === "Enter") {
              setRenameId(selectedStateId);
            } else if (e.key === "ArrowRight") {
              openState(selectedStateId);
            } else if (e.key === "ArrowLeft") {
              closeState(selectedStateId);
            }
          }}
        >
          {({ item, index }) =>
            item.type === "state" ? (
              <EntityListItem
                item={item}
                type={item.type}
                collapsable={true}
                collapsed={!item.isOpen}
                onToggleCollapse={toggleStateOpen(item.stateId)}
                rename={index > 0 && renameId === item.id}
                onRename={index > 0 ? onRenameStateComplete : undefined}
                renderContextMenu={index > 0 ? renderContextMenu : undefined}
              />
            ) : (
              <EntityListItem
                item={item}
                type={"custom"}
                icon={
                  item.animationType && animationTypeIcons[item.animationType]
                }
                nestLevel={item.nestLevel}
              />
            )
          }
        </FlatList>
      </Pane>
    </>
  );
};
