import React, { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/configureStore";
import { spriteSheetSelectors } from "../../store/features/entities/entitiesState";
import { FlatList } from "../ui/lists/FlatList";
import navigationActions from "../../store/features/navigation/navigationActions";
import { SpriteSheet } from "../../store/features/entities/entitiesTypes";
import { EntityListItem } from "../ui/lists/EntityListItem";

interface NavigatorSpritesProps {
  height: number;
  defaultFirst?: boolean;
}

interface NavigatorItem {
  id: string;
  name: string;
}

const spriteToNavigatorItem = (
  sprite: SpriteSheet,
  spriteIndex: number
): NavigatorItem => ({
  id: sprite.id,
  name: sprite.name ? sprite.name : `Sprite ${spriteIndex + 1}`,
});

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (a: NavigatorItem, b: NavigatorItem) => {
  return collator.compare(a.name, b.name);
};

export const NavigatorSprites: FC<NavigatorSpritesProps> = ({
  height,
  defaultFirst,
}) => {
  const [items, setItems] = useState<NavigatorItem[]>([]);
  const allSprites = useSelector((state: RootState) =>
    spriteSheetSelectors.selectAll(state)
  );
  const spritesLookup = useSelector((state: RootState) =>
    spriteSheetSelectors.selectEntities(state)
  );
  const navigationId = useSelector((state: RootState) => state.navigation.id);
  const selectedId = defaultFirst
    ? spritesLookup[navigationId]?.id || allSprites[0]?.id
    : navigationId;

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

  const setSelectedId = (id: string) => {
    dispatch(navigationActions.setNavigationId(id));
  };

  return (
    <FlatList
      selectedId={selectedId}
      items={items}
      setSelectedId={setSelectedId}
      height={height}
    >
      {({ item }) => <EntityListItem type="sprite" item={item} />}
    </FlatList>
  );
};
