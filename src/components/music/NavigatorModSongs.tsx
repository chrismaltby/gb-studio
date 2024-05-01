import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import projectActions from "store/features/project/projectActions";
import {
  FileSystemNavigatorItem,
  buildAssetNavigatorItems,
} from "shared/lib/assets/buildAssetNavigatorItems";
import useToggleableList from "ui/hooks/use-toggleable-list";

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

  const {
    values: openFolders,
    isSet: isFolderOpen,
    toggle: toggleFolderOpen,
    set: openFolder,
    unset: closeFolder,
  } = useToggleableList<string>([]);

  const nestedSongItems = useMemo(
    () => buildAssetNavigatorItems(allSongs.filter(modFilter), openFolders),
    [allSongs, openFolders]
  );

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
          projectActions.renameMusicAsset({
            musicId: renameId,
            newFilename: stripInvalidPathCharacters(name),
          })
        );
      }
      setRenameId("");
    },
    [dispatch, renameId]
  );

  const onRenameCancel = useCallback(() => {
    setRenameId("");
  }, []);

  const renderContextMenu = useCallback(
    (item: NavigatorItem) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        <MenuDivider key="div-delete" />,
        <MenuItem
          key="delete"
          onClick={() =>
            dispatch(projectActions.removeMusicAsset({ musicId: item.id }))
          }
        >
          {l10n("MENU_DELETE_SONG")}
        </MenuItem>,
      ];
    },
    [dispatch]
  );

  const renderLabel = useCallback((item: FileSystemNavigatorItem<Music>) => {
    return item.filename;
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
            items={nestedSongItems}
            setSelectedId={setSelectedId}
            height={height - 30}
            onKeyDown={(e: KeyboardEvent, item) => {
              listenForRenameStart(e);
              if (item?.type === "folder") {
                if (e.key === "ArrowRight") {
                  openFolder(selectedId);
                } else if (e.key === "ArrowLeft") {
                  closeFolder(selectedId);
                }
              }
            }}
          >
            {({ item }) => (
              <EntityListItem
                type={item.type === "folder" ? "folder" : "song"}
                item={item}
                rename={item.type === "file" && renameId === item.id}
                onRename={onRenameSongComplete}
                onRenameCancel={onRenameCancel}
                renderContextMenu={
                  item.type === "file" ? renderContextMenu : undefined
                }
                collapsable={item.type === "folder"}
                collapsed={!isFolderOpen(item.name)}
                onToggleCollapse={() => toggleFolderOpen(item.name)}
                nestLevel={item.nestLevel}
                renderLabel={renderLabel}
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
