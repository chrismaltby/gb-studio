import React, { useCallback, useEffect, useMemo, useState } from "react";
import { musicSelectors } from "store/features/entities/entitiesSelectors";
import { FlatList } from "ui/lists/FlatList";
import { EntityListItem, EntityListSearch } from "ui/lists/EntityListItem";
import l10n from "shared/lib/lang/l10n";
import { Button } from "ui/buttons/Button";
import { PlusIcon, SearchIcon } from "ui/icons/Icons";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { requestAddNewSongFile } from "store/features/trackerDocument/trackerDocumentState";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { assetPath } from "shared/lib/helpers/assets";
import { stripInvalidPathCharacters } from "shared/lib/helpers/stripInvalidFilenameCharacters";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import projectActions from "store/features/project/projectActions";
import { ListItem } from "ui/lists/ListItem";
import useToggleableList from "ui/hooks/use-toggleable-list";
import {
  FileSystemNavigatorItem,
  buildAssetNavigatorItems,
} from "shared/lib/assets/buildAssetNavigatorItems";
import { FixedSpacer } from "ui/spacing/Spacing";
import { MusicAsset } from "shared/lib/resources/types";
import { SplitPaneChildProps } from "ui/splitpane/SplitPaneVerticalContainer";
import { SplitPane } from "ui/splitpane/SplitPane";
import { useNavigatorSearch } from "store/features/editor/hooks/useNavigatorSearch";
import { DropdownButton } from "ui/buttons/DropdownButton";
import trackerActions from "store/features/tracker/trackerActions";

const COLLAPSED_SIZE = 30;

interface SongNavigatorPaneProps extends SplitPaneChildProps {
  modified: boolean;
  selectedSongId: string;
  onCreateSong?: () => void;
  onImportSong?: () => void;
  onSelectSong?: (id: string) => void;
}

interface NavigatorItem {
  id: string;
  name: string;
}

export const SongNavigatorPane = ({
  height,
  onToggle,
  ensureMinHeight,
  modified,
  selectedSongId,
  onSelectSong,
  onCreateSong,
  onImportSong,
}: SongNavigatorPaneProps) => {
  const dispatch = useAppDispatch();

  const [addSongMode, setAddSongMode] = useState(false);
  const allSongs = useAppSelector((state) => musicSelectors.selectAll(state));

  const {
    values: openFolders,
    isSet: isFolderOpen,
    toggle: toggleFolderOpen,
    set: openFolder,
    unset: closeFolder,
  } = useToggleableList<string>([], "songNavigator");

  const {
    searchEnabled: songsSearchEnabled,
    searchTerm: songsSearchTerm,
    setSearchTerm: setSongsSearchTerm,
    toggleSearchEnabled: toggleSongsSearch,
  } = useNavigatorSearch("songs");
  const [renameId, setRenameId] = useState("");
  const [selectedNavigatorId, setSelectedNavigatorId] =
    useState(selectedSongId);

  const nestedSongItems = useMemo(
    () => buildAssetNavigatorItems(allSongs, openFolders, songsSearchTerm),
    [allSongs, openFolders, songsSearchTerm],
  );

  const setSelectedSongId = useCallback(
    (id: string) => {
      if (onSelectSong) {
        onSelectSong(id);
        return;
      }
      dispatch(trackerActions.setSelectedSongId(id));
    },
    [dispatch, onSelectSong],
  );

  useEffect(() => {
    setSelectedNavigatorId(selectedSongId);
  }, [selectedSongId]);

  const setSelectedId = useCallback(
    (id: string, item: FileSystemNavigatorItem<MusicAsset>) => {
      if (item.type === "file") {
        if (id === selectedSongId) {
          setSelectedNavigatorId(id);
          return;
        }
        setSelectedSongId(id);
        return;
      }

      setSelectedNavigatorId(id);
    },
    [selectedSongId, setSelectedSongId],
  );

  const addSong = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();
      ensureMinHeight?.(200);
      setAddSongMode(true);
    },
    [ensureMinHeight],
  );

  const onRenameSongComplete = useCallback(
    (name: string) => {
      if (renameId) {
        const song = allSongs.find((item) => item.id === renameId);
        const sanitizedFilename = stripInvalidPathCharacters(name).trim();
        const currentFilename = song?.filename.replace(/\.[^.]+$/i, "") ?? "";

        if (!sanitizedFilename || sanitizedFilename === currentFilename) {
          setRenameId("");
          return;
        }

        dispatch(
          projectActions.renameMusicAsset({
            musicId: renameId,
            newFilename: sanitizedFilename,
          }),
        );
      }
      setRenameId("");
    },
    [allSongs, dispatch, renameId],
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
    [dispatch],
  );

  const renderLabel = useCallback(
    (item: FileSystemNavigatorItem<MusicAsset>) => {
      if (item.type === "folder") {
        return (
          <div onClick={() => toggleFolderOpen(item.id)}>{item.filename}</div>
        );
      }

      return `${item.filename}${
        modified && item.id === selectedSongId ? "*" : ""
      }`;
    },
    [modified, selectedSongId, toggleFolderOpen],
  );

  const showSongsSearch = songsSearchEnabled && (height ?? 0) > 60;

  const toggleSongsSearchEnabled = useCallback(() => {
    if (!songsSearchEnabled) {
      ensureMinHeight?.(200);
    }
    toggleSongsSearch();
  }, [ensureMinHeight, songsSearchEnabled, toggleSongsSearch]);

  return (
    <SplitPane style={{ height }}>
      <SplitPaneHeader
        onToggle={onToggle}
        collapsed={Math.floor(height ?? 0) <= COLLAPSED_SIZE}
        buttons={
          <>
            {onCreateSong || onImportSong ? (
              <DropdownButton
                label={<PlusIcon />}
                showArrow={false}
                variant="transparent"
                size="small"
                menuDirection="left"
                title={l10n("TOOL_ADD_SONG_LABEL")}
              >
                {onCreateSong && (
                  <MenuItem onClick={onCreateSong}>
                    {l10n("TOOL_ADD_SONG_LABEL")}
                  </MenuItem>
                )}
                {onImportSong && (
                  <MenuItem onClick={onImportSong}>
                    {l10n("FIELD_OPEN_FILE")}
                  </MenuItem>
                )}
              </DropdownButton>
            ) : (
              <Button
                variant="transparent"
                size="small"
                title={l10n("TOOL_ADD_SONG_LABEL")}
                onMouseDown={addSong}
              >
                <PlusIcon />
              </Button>
            )}
            <FixedSpacer width={5} />
            <Button
              variant={songsSearchEnabled ? "primary" : "transparent"}
              size="small"
              title={l10n("TOOLBAR_SEARCH")}
              onClick={toggleSongsSearchEnabled}
            >
              <SearchIcon />
            </Button>
          </>
        }
      >
        {l10n("FIELD_SONGS")}
      </SplitPaneHeader>

      {showSongsSearch && (
        <EntityListSearch
          type="search"
          value={songsSearchTerm}
          onChange={(e) => setSongsSearchTerm(e.currentTarget.value)}
          placeholder={l10n("TOOLBAR_SEARCH")}
          autoFocus
        />
      )}

      {addSongMode && (
        <ListItem>
          <EntityListItem
            type="song"
            item={{ id: "", name: "song_template" }}
            rename
            onRename={(filename) => {
              if (filename) {
                const path = assetPath("music", {
                  filename: `${stripInvalidPathCharacters(filename)}.uge`,
                });
                dispatch(requestAddNewSongFile(path));
              }
              setAddSongMode(false);
            }}
            onRenameCancel={() => {
              setAddSongMode(false);
            }}
          />
        </ListItem>
      )}

      <FlatList
        selectedId={selectedNavigatorId}
        items={nestedSongItems}
        setSelectedId={setSelectedId}
        cacheKey="songNavigator"
        height={(height ?? 0) - (showSongsSearch ? 60 : 30)}
        onKeyDown={(e: KeyboardEvent, item) => {
          if (e.key === "Enter" && item?.type === "file") {
            setRenameId(item.id);
            return;
          }

          if (item?.type === "folder") {
            if (e.key === "ArrowRight") {
              openFolder(item.id);
            } else if (e.key === "ArrowLeft") {
              closeFolder(item.id);
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
              item.type === "file" && !item.asset?.plugin
                ? renderContextMenu
                : undefined
            }
            collapsable={item.type === "folder"}
            collapsed={!isFolderOpen(item.id)}
            onToggleCollapse={() => toggleFolderOpen(item.id)}
            nestLevel={item.nestLevel}
            renderLabel={renderLabel}
          />
        )}
      </FlatList>
    </SplitPane>
  );
};
