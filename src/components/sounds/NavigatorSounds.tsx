import React, { useCallback, useEffect, useState } from "react";
import { soundSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import { Sound } from "shared/lib/entities/entitiesTypes";
import { EntityListItem } from "ui/lists/EntityListItem";
import l10n from "shared/lib/lang/l10n";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import styled from "styled-components";
import navigationActions from "store/features/navigation/navigationActions";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface NavigatorSoundsProps {
  height: number;
  selectedId: string;
}

interface SoundNavigatorItem {
  id: string;
  name: string;
}

const soundToNavigatorItem = (sound: Sound): SoundNavigatorItem => ({
  id: sound.id,
  name: sound.name || sound.filename,
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

export const NavigatorSounds = ({
  height,
  selectedId,
}: NavigatorSoundsProps) => {
  const [items, setItems] = useState<SoundNavigatorItem[]>([]);
  const allSounds = useAppSelector((state) => soundSelectors.selectAll(state));
  const dispatch = useAppDispatch();

  useEffect(() => {
    setItems(
      allSounds.map((sound) => soundToNavigatorItem(sound)).sort(sortByName)
    );
  }, [allSounds]);

  const setSelectedId = useCallback(
    (id: string) => {
      dispatch(navigationActions.setNavigationId(id));
    },
    [dispatch]
  );

  return (
    <Pane style={{ height }}>
      <SplitPaneHeader collapsed={false}>{l10n("MENU_SFX")}</SplitPaneHeader>

      <FlatList
        selectedId={selectedId}
        items={items}
        setSelectedId={setSelectedId}
        height={height - 30}
      >
        {({ item }) => <EntityListItem type="sound" item={item} />}
      </FlatList>
    </Pane>
  );
};
