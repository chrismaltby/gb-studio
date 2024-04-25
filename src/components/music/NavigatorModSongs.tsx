import React, { useCallback, useEffect, useState } from "react";
import { musicSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import { Music } from "shared/lib/entities/entitiesTypes";
import { EntityListItem } from "ui/lists/EntityListItem";
import l10n from "shared/lib/lang/l10n";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import styled from "styled-components";
import { NoSongsMessage } from "./NoSongsMessage";
import navigationActions from "store/features/navigation/navigationActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { stripInvalidPathCharacters } from "shared/lib/helpers/stripInvalidFilenameCharacters";
import entitiesActions from "store/features/entities/entitiesActions";
import { MenuItem } from "ui/menu/Menu";

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
    name: song.name ? song.name : `Song ${songIndex + 1}`,
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
  const dispatch = useAppDispatch();

  const [items, setItems] = useState<NavigatorItem[]>([]);
  const allSongs = useAppSelector((state) => musicSelectors.selectAll(state));

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

  const [renameId, setRenameId] = useState("");

  const listenForRenameStart = useCallback(
    (e) => {
      if (e.key === "Enter") {
        setRenameId(selectedId);
      }
    },
    [selectedId]
  );

  const onRenameSongComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.renameMusic({
            musicId: renameId,
            name: stripInvalidPathCharacters(name),
          })
        );
      }
      setRenameId("");
    },
    [dispatch, renameId]
  );

  const renderContextMenu = useCallback((item: NavigatorItem) => {
    return [
      <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
        {l10n("FIELD_RENAME")}
      </MenuItem>,
    ];
  }, []);

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
            onKeyDown={listenForRenameStart}
          >
            {({ item }) => (
              <EntityListItem
                type="song"
                item={item}
                rename={renameId === item.id}
                onRename={onRenameSongComplete}
                renderContextMenu={renderContextMenu}
              />
            )}
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
