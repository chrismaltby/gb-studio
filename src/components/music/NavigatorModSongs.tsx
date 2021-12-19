import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import { musicSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import { Music } from "store/features/entities/entitiesTypes";
import { EntityListItem } from "ui/lists/EntityListItem";
import l10n from "lib/helpers/l10n";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import styled from "styled-components";
import { NoSongsMessage } from "./NoSongsMessage";
import navigationActions from "store/features/navigation/navigationActions";

interface NavigatorSongsProps {
  height: number;
  selectedId: string;
}

interface NavigatorItem {
  id: string;
  name: string;
}

const Pane = styled.div`
  overflow: hidden;
`;

const EmptyState = styled.div`
  display: flex;
  text-align: center;
  flex-direction: column;
  height: 100%;
  padding: 36px 12px;
`;

const songToNavigatorItem = (song: Music, songIndex: number): NavigatorItem => {
  return {
    id: song.id,
    name: song.filename ? song.filename : `Song ${songIndex + 1}`,
  };
};

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (a: NavigatorItem, b: NavigatorItem) => {
  return collator.compare(a.name, b.name);
};

export const modFilter = (s: Music) => {
  return s.type && s.type === "mod";
};

export const NavigatorModSongs = ({
  height,
  selectedId,
}: NavigatorSongsProps) => {
  const dispatch = useDispatch();

  const [items, setItems] = useState<NavigatorItem[]>([]);
  const allSongs = useSelector((state: RootState) =>
    musicSelectors.selectAll(state)
  );

  useEffect(() => {
    setItems(
      allSongs
        .filter(modFilter)
        .map((song, songIndex) => songToNavigatorItem(song, songIndex))
        .sort(sortByName)
    );
  }, [allSongs]);

  const setSelectedId = useCallback(
    (id: string) => {
      dispatch(navigationActions.setNavigationId(id));
    },
    [dispatch]
  );

  return (
    <>
      <Pane style={{ height: height }}>
        <SplitPaneHeader collapsed={false}>
          {l10n("FIELD_SONGS")}
        </SplitPaneHeader>
        {items.length > 0 ? (
          <FlatList
            selectedId={selectedId}
            items={items}
            setSelectedId={setSelectedId}
            height={height - 30}
          >
            {({ item }) => <EntityListItem type="song" item={item} />}
          </FlatList>
        ) : (
          <EmptyState>
            <NoSongsMessage type="mod" />
          </EmptyState>
        )}
      </Pane>
    </>
  );
};
