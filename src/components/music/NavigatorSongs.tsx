import React, { useCallback, useEffect, useMemo, useState } from "react";
import { musicSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import { Music } from "shared/lib/entities/entitiesTypes";
import { EntityListItem, EntityListSearch } from "ui/lists/EntityListItem";
import l10n from "shared/lib/lang/l10n";
import { InstrumentType } from "store/features/editor/editorState";
import {
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
} from "store/features/trackerDocument/trackerDocumentTypes";
import { Button } from "ui/buttons/Button";
import { ArrowLeftRightIcon, PlusIcon, SearchIcon } from "ui/icons/Icons";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import useSplitPane from "ui/hooks/use-split-pane";
import styled from "styled-components";
import { SplitPaneVerticalDivider } from "ui/splitpane/SplitPaneDivider";
import { NoSongsMessage } from "./NoSongsMessage";
import { addNewSongFile } from "store/features/trackerDocument/trackerDocumentState";
import trackerActions from "store/features/tracker/trackerActions";
import API from "renderer/lib/api";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { assetPath } from "shared/lib/helpers/assets";
import { stripInvalidPathCharacters } from "shared/lib/helpers/stripInvalidFilenameCharacters";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import { assertUnreachable } from "shared/lib/helpers/assert";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import projectActions from "store/features/project/projectActions";
import { ListItem } from "ui/lists/ListItem";
import useToggleableList from "ui/hooks/use-toggleable-list";
import {
  FileSystemNavigatorItem,
  buildAssetNavigatorItems,
} from "shared/lib/assets/buildAssetNavigatorItems";
import { FixedSpacer } from "ui/spacing/Spacing";

const COLLAPSED_SIZE = 30;

interface NavigatorSongsProps {
  height: number;
  defaultFirst?: boolean;
  dutyInstruments?: DutyInstrument[];
  noiseInstruments?: NoiseInstrument[];
  waveInstruments?: WaveInstrument[];
  modified: boolean;
}

interface NavigatorItem {
  id: string;
  name: string;
}

interface InstrumentNavigatorItem {
  id: string;
  name: string;
  instrumentId: string;
  type: InstrumentType;
  isGroup: boolean;
  labelColor?: string;
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

const instrumentToNavigatorItem =
  (type: InstrumentType) =>
  (
    instrument: DutyInstrument | NoiseInstrument | WaveInstrument,
    instrumentIndex: number,
    defaultName: string
  ): InstrumentNavigatorItem => {
    const name = instrument.name
      ? instrument.name
      : `${defaultName} ${instrumentIndex + 1}`;

    return {
      id: `${type}_${instrument.index}`,
      name,
      type,
      instrumentId: `${instrument.index}`,
      isGroup: false,
      labelColor: `instrument-${instrument.index}`,
    };
  };

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByIndex = (a: NavigatorItem, b: NavigatorItem) => {
  return collator.compare(a.id, b.id);
};

export const ugeFilter = (s: Music) => {
  return s.type && s.type === "uge";
};

export const NavigatorSongs = ({
  height,
  defaultFirst,
  dutyInstruments,
  waveInstruments,
  noiseInstruments,
  modified,
}: NavigatorSongsProps) => {
  const dispatch = useAppDispatch();

  const [addSongMode, setAddSongMode] = useState(false);
  const allSongs = useAppSelector((state) => musicSelectors.selectAll(state));
  const songsLookup = useAppSelector((state) =>
    musicSelectors.selectEntities(state)
  );
  const navigationId = useAppSelector((state) => state.editor.selectedSongId);
  const selectedSongId = defaultFirst
    ? songsLookup[navigationId]?.id || allSongs.filter(ugeFilter)[0]?.id
    : navigationId;

  const {
    values: openFolders,
    isSet: isFolderOpen,
    toggle: toggleFolderOpen,
    set: openFolder,
    unset: closeFolder,
  } = useToggleableList<string>([]);

  const [songsSearchTerm, setSongsSearchTerm] = useState("");
  const [songsSearchEnabled, setSongsSearchEnabled] = useState(false);

  const nestedSongItems = useMemo(
    () =>
      buildAssetNavigatorItems(
        allSongs.filter(ugeFilter),
        openFolders,
        songsSearchTerm
      ),
    [allSongs, openFolders, songsSearchTerm]
  );

  const setSelectedSongId = useCallback(
    (id: string) => {
      dispatch(editorActions.setSelectedSongId(id));
    },
    [dispatch]
  );

  const selectedSong = songsLookup[selectedSongId];

  const [openInstrumentGroupIds, setOpenInstrumentGroupIds] = useState<
    InstrumentType[]
  >([]);

  const toggleInstrumentOpen = (id: InstrumentType) => () => {
    if (isOpen(id)) {
      closeInstrumentGroup(id);
    } else {
      openInstrumentGroup(id);
    }
  };

  const openInstrumentGroup = (id: InstrumentType) => {
    setOpenInstrumentGroupIds((value) =>
      ([] as InstrumentType[]).concat(value, id)
    );
  };

  const closeInstrumentGroup = (id: InstrumentType) => {
    setOpenInstrumentGroupIds((value) => value.filter((s) => s !== id));
  };

  const isOpen = useCallback(
    (id: InstrumentType) => {
      return openInstrumentGroupIds.includes(id);
    },
    [openInstrumentGroupIds]
  );

  const [instrumentItems, setInstrumentItems] = useState<
    InstrumentNavigatorItem[]
  >([]);
  useEffect(() => {
    const items: InstrumentNavigatorItem[] = [];
    setInstrumentItems(
      items.concat(
        [
          {
            name: "Duty",
            id: "duty_group",
            instrumentId: "group",
            type: "duty",
            isGroup: true,
          },
        ],
        isOpen("duty")
          ? (dutyInstruments || [])
              .map((duty, i) =>
                instrumentToNavigatorItem("duty")(duty, i, "Duty")
              )
              .sort(sortByIndex)
          : [],
        [
          {
            name: "Wave",
            id: "wave_group",
            instrumentId: "group",
            type: "wave",
            isGroup: true,
          },
        ],
        isOpen("wave")
          ? (waveInstruments || [])
              .map((wave, i) =>
                instrumentToNavigatorItem("wave")(wave, i, "Wave")
              )
              .sort(sortByIndex)
          : [],
        [
          {
            name: "Noise",
            id: "noise_group",
            instrumentId: "group",
            type: "noise",
            isGroup: true,
          },
        ],
        isOpen("noise")
          ? (noiseInstruments || [])
              .map((noise, i) =>
                instrumentToNavigatorItem("noise")(noise, i, "Noise")
              )
              .sort(sortByIndex)
          : []
      )
    );
  }, [
    dutyInstruments,
    waveInstruments,
    noiseInstruments,
    openInstrumentGroupIds,
    isOpen,
  ]);

  const [syncInstruments, setSyncInstruments] = useState(true);
  useEffect(() => {
    (async function set() {
      const syncedInstrumentSetting =
        (await API.settings.get("trackerSidebarSyncInstruments")) ?? true;
      setSyncInstruments(syncedInstrumentSetting as boolean);
    })();
  }, []);
  const handleSyncInstruments = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();

      setSyncInstruments(!syncInstruments);
      API.settings.set("trackerSidebarSyncInstruments", !syncInstruments);
    },
    [syncInstruments]
  );

  const selectedInstrument = useAppSelector(
    (state) => state.editor.selectedInstrument
  );
  const selectedChannel = useAppSelector(
    (state) => state.tracker.selectedChannel
  );
  const setSelectedInstrument = useCallback(
    (id: string, item: InstrumentNavigatorItem) => {
      dispatch(
        editorActions.setSelectedInstrument({
          id: item.instrumentId,
          type: item.type,
        })
      );

      if (!item.isGroup && syncInstruments) {
        let newSelectedChannel = 0;
        switch (item.type) {
          case "duty":
            newSelectedChannel = selectedChannel === 1 ? 1 : 0;
            break;
          case "wave":
            newSelectedChannel = 2;
            break;
          case "noise":
            newSelectedChannel = 3;
            break;
        }
        dispatch(trackerActions.setSelectedChannel(newSelectedChannel));
        const newDefaultInstrument = parseInt(item.instrumentId);
        dispatch(
          trackerActions.setDefaultInstruments([
            newDefaultInstrument,
            newDefaultInstrument,
            newDefaultInstrument,
            newDefaultInstrument,
          ])
        );
      }
    },
    [dispatch, selectedChannel, syncInstruments]
  );

  const [splitSizes, setSplitSizes] = useState([100, 200]);
  const [onDragStart, togglePane] = useSplitPane({
    sizes: splitSizes,
    setSizes: setSplitSizes,
    minSizes: [COLLAPSED_SIZE, COLLAPSED_SIZE],
    collapsedSize: COLLAPSED_SIZE,
    reopenSize: 200,
    maxTotal: height,
    direction: "vertical",
  });

  const showInstrumentList = selectedSong && selectedSong.type === "uge";

  const addSong = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      setAddSongMode(true);
    },
    []
  );

  const [renameId, setRenameId] = useState("");

  const listenForRenameStart = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        setRenameId(navigationId);
      }
    },
    [navigationId]
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

  const onRenameInstrumentComplete = useCallback(
    (name: string, item: InstrumentNavigatorItem) => {
      if (renameId) {
        const action =
          item.type === "duty"
            ? trackerDocumentActions.editDutyInstrument
            : item.type === "wave"
            ? trackerDocumentActions.editWaveInstrument
            : item.type === "noise"
            ? trackerDocumentActions.editNoiseInstrument
            : assertUnreachable(item.type);

        const instrumentId = parseInt(item.instrumentId);

        dispatch(
          action({
            instrumentId,
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

  const renderInstrumentContextMenu = useCallback(
    (item: InstrumentNavigatorItem) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
      ];
    },
    []
  );

  const renderLabel = useCallback(
    (item: FileSystemNavigatorItem<Music>) => {
      if (item.type === "folder") {
        return (
          <div onClick={() => toggleFolderOpen(item.id)}>{item.filename}</div>
        );
      }
      return `${item.filename}${
        modified && item.id === selectedSongId ? "*" : ""
      }`;
    },
    [modified, selectedSongId, toggleFolderOpen]
  );

  const renderInstrumentLabel = useCallback((item: InstrumentNavigatorItem) => {
    return `${(parseInt(item.instrumentId) + 1).toString().padStart(2, "0")}: ${
      item.name
    }`;
  }, []);

  const showSongsSearch = songsSearchEnabled && splitSizes[0] > 60;

  const toggleSongsSearchEnabled = useCallback(() => {
    if (songsSearchEnabled) {
      setSongsSearchTerm("");
    }
    setSongsSearchEnabled(!songsSearchEnabled);
  }, [songsSearchEnabled]);

  return (
    <>
      <Pane style={{ height: showInstrumentList ? splitSizes[0] : height }}>
        <SplitPaneHeader
          onToggle={() => togglePane(0)}
          collapsed={Math.floor(splitSizes[0]) <= COLLAPSED_SIZE}
          buttons={
            <>
              <Button
                variant="transparent"
                size="small"
                title={l10n("TOOL_ADD_SONG_LABEL")}
                onClick={addSong}
              >
                <PlusIcon />
              </Button>
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
                  dispatch(addNewSongFile(path));
                }
                setAddSongMode(false);
              }}
              onRenameCancel={() => {
                setAddSongMode(false);
              }}
            />
          </ListItem>
        )}
        {nestedSongItems.length > 0 || songsSearchTerm.length > 0 ? (
          <FlatList
            selectedId={navigationId}
            items={nestedSongItems}
            setSelectedId={setSelectedSongId}
            height={
              (showInstrumentList ? splitSizes[0] : height) -
              (showSongsSearch ? 60 : 30)
            }
            onKeyDown={(e: KeyboardEvent, item) => {
              listenForRenameStart(e);
              if (item?.type === "folder") {
                if (e.key === "ArrowRight") {
                  openFolder(navigationId);
                } else if (e.key === "ArrowLeft") {
                  closeFolder(navigationId);
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
            <NoSongsMessage type="uge" />
          </EmptyState>
        )}
      </Pane>
      {showInstrumentList && (
        <>
          <SplitPaneVerticalDivider onMouseDown={onDragStart(0)} />
          <Pane style={{ height: splitSizes[1] }}>
            <SplitPaneHeader
              onToggle={() => togglePane(1)}
              collapsed={Math.floor(splitSizes[1]) <= COLLAPSED_SIZE}
              buttons={
                <Button
                  variant={syncInstruments ? "primary" : "transparent"}
                  size="small"
                  title={l10n("TOOL_SYNC_INSTRUMENT_NAVIGATOR")}
                  onClick={handleSyncInstruments}
                >
                  <ArrowLeftRightIcon />
                </Button>
              }
            >
              {l10n("FIELD_INSTRUMENTS")}
            </SplitPaneHeader>
            <FlatList
              selectedId={`${selectedInstrument.type}_${selectedInstrument.id}`}
              items={instrumentItems}
              setSelectedId={setSelectedInstrument}
              height={splitSizes[1] - 30}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === "Enter") {
                  setRenameId(
                    `${selectedInstrument.type}_${selectedInstrument.id}`
                  );
                } else if (e.key === "ArrowRight") {
                  openInstrumentGroup(selectedInstrument.type);
                } else if (e.key === "ArrowLeft") {
                  closeInstrumentGroup(selectedInstrument.type);
                }
              }}
            >
              {({ item }) =>
                item.isGroup ? (
                  <EntityListItem
                    item={item}
                    type="song"
                    collapsable={true}
                    collapsed={!isOpen(item.type)}
                    onToggleCollapse={toggleInstrumentOpen(item.type)}
                  />
                ) : (
                  <EntityListItem
                    item={item}
                    type={item.type}
                    nestLevel={1}
                    rename={renameId === item.id}
                    onRename={onRenameInstrumentComplete}
                    onRenameCancel={onRenameCancel}
                    renderContextMenu={renderInstrumentContextMenu}
                    renderLabel={renderInstrumentLabel}
                  />
                )
              }
            </FlatList>
          </Pane>
        </>
      )}
    </>
  );
};
