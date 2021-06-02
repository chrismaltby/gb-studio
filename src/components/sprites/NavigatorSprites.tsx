import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import { spriteSheetSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import { SpriteSheet } from "store/features/entities/entitiesTypes";
import { EntityListItem } from "ui/lists/EntityListItem";
import { FormSectionTitle } from "ui/form/FormLayout";
import l10n from "lib/helpers/l10n";
import {
  filterAnimationsBySpriteType,
  getAnimationNameByIndex,
} from "./helpers";

interface NavigatorSpritesProps {
  height: number;
  selectedAnimationId: string;
  defaultFirst?: boolean;
}

interface NavigatorItem {
  id: string;
  name: string;
  isFolder: boolean;
}

const spriteToNavigatorItem = (
  sprite: SpriteSheet,
  spriteIndex: number
): NavigatorItem => ({
  id: sprite.id,
  name: sprite.name ? sprite.name : `Sprite ${spriteIndex + 1}`,
  isFolder: false,
});

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (a: NavigatorItem, b: NavigatorItem) => {
  return collator.compare(a.name, b.name);
};

export const NavigatorSprites = ({
  height,
  selectedAnimationId,
  defaultFirst,
}: NavigatorSpritesProps) => {
  const [spriteAnimations, setSpriteAnimations] = useState<NavigatorItem[]>([]);
  const [items, setItems] = useState<NavigatorItem[]>([]);
  const allSprites = useSelector((state: RootState) =>
    spriteSheetSelectors.selectAll(state)
  );
  const spritesLookup = useSelector((state: RootState) =>
    spriteSheetSelectors.selectEntities(state)
  );
  const navigationId = useSelector(
    (state: RootState) => state.editor.selectedSpriteSheetId
  );
  const selectedId = defaultFirst
    ? spritesLookup[navigationId]?.id || allSprites[0]?.id
    : navigationId;

  const selectedSprite = spritesLookup[selectedId];

  const dispatch = useDispatch();

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
    if (selectedSprite?.animations) {
      const filteredAnims = filterAnimationsBySpriteType(
        selectedSprite.animations,
        selectedSprite?.animationType,
        selectedSprite?.flipLeft
      ).map((id, index) => {
        return {
          id,
          name: getAnimationNameByIndex(
            selectedSprite?.animationType,
            selectedSprite?.flipLeft,
            index
          ),
          isFolder: false,
        };
      });

      const additionalStates = [
        {
          id: "default",
          name: "Default",
          isFolder: true,
          // animationType: SpriteAnimationType
        },
        ...filteredAnims,
        {
          id: "dead",
          name: "Dying",
          isFolder: true,
          // animationType: SpriteAnimationType
        },
        ...filteredAnims.map((i) => ({ ...i, id: "a" })),
        {
          id: "hurt",
          name: "Hurt",
          isFolder: true,

          // animationType: SpriteAnimationType
        },
        ...filteredAnims.map((i) => ({ ...i, id: "a" })),
      ];

      setSpriteAnimations(additionalStates);
    } else {
      setSpriteAnimations([]);
    }
  }, [
    selectedSprite?.animations,
    selectedSprite?.animationType,
    selectedSprite?.flipLeft,
  ]);

  const setSelectedId = useCallback(
    (id: string) => {
      dispatch(editorActions.setSelectedSpriteSheetId(id));
    },
    [dispatch]
  );

  const setSelectAnimationId = useCallback(
    (id: string) => {
      dispatch(editorActions.setSelectedAnimationId(id));
    },
    [dispatch]
  );

  // const animations = [...spriteAnimations];
  // for(let state of additionalStates) {

  // }

  // const numAnimations = spriteAnimations.length;
  const numAnimations = 10;

  return (
    <>
      <FlatList
        selectedId={selectedId}
        items={items}
        setSelectedId={setSelectedId}
        height={height - 25 * numAnimations - 32}
      >
        {({ item }) => <EntityListItem type="sprite" item={item} />}
      </FlatList>

      <FormSectionTitle style={{ marginBottom: 0 }}>
        {l10n("FIELD_ANIMATIONS")}
      </FormSectionTitle>

      <FlatList
        selectedId={selectedAnimationId}
        items={spriteAnimations}
        setSelectedId={setSelectAnimationId}
        height={25 * numAnimations}
      >
        {({ item }) => (
          <>
            <EntityListItem
              item={item}
              type={item.isFolder ? "state" : "animation"}
              collapsable={item.isFolder}
              collapsed={false}
              onToggleCollapse={() => {}}
              nestLevel={item.isFolder ? 0 : 1}
            />
          </>
        )}
      </FlatList>
    </>
  );
};
