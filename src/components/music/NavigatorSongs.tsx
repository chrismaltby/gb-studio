import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/configureStore";
import { musicSelectors } from "../../store/features/entities/entitiesState";
import { FlatList } from "../ui/lists/FlatList";
import editorActions from "../../store/features/editor/editorActions";
import { Music } from "../../store/features/entities/entitiesTypes";
import { EntityListItem } from "../ui/lists/EntityListItem";
import l10n from "../../lib/helpers/l10n";
import { InstrumentType } from "../../store/features/editor/editorState";
import { DutyInstrument, NoiseInstrument, WaveInstrument } from "../../store/features/tracker/trackerTypes";
import { Button } from "../ui/buttons/Button";
import { PlusIcon } from "../library/Icons";
import { SplitPaneHeader } from "../ui/splitpane/SplitPaneHeader";
import useSplitPane from "../ui/hooks/use-split-pane";
import styled from "styled-components";
import { SplitPaneVerticalDivider } from "../ui/splitpane/SplitPaneDivider";

const COLLAPSED_SIZE = 30;

interface NavigatorSongsProps {
  height: number;
  defaultFirst?: boolean;
  instruments: DutyInstrument[];
  noises: NoiseInstrument[];
  waves: WaveInstrument[];
  modified: boolean;
}

interface NavigatorItem {
  id: string;
  name: string;
};

interface InstrumentNavigatorItem {
  id: string;
  name: string;
  instrumentId?: string;
  type: InstrumentType;
  isGroup: boolean;
}

const Pane = styled.div`
  overflow: hidden;
`;

const songToNavigatorItem = (
  song: Music,
  songIndex: number,
  selectedSongId: string,
  modified: boolean,
): NavigatorItem => {
  function nameIfModified(name: string) {
    return (song.id === selectedSongId && modified) ? `${name} (*)` : name;
  }
  return ({
    id: song.id,
    name: nameIfModified(song.filename ? song.filename : `Song ${songIndex + 1}`),
  });
};

const instrumentToNavigatorItem = (type: InstrumentType) => (
  instrument: DutyInstrument | NoiseInstrument | WaveInstrument,
  instrumentIndex: number,
  defaultName: string,
): InstrumentNavigatorItem => ({
  id: `${type}_${instrument.index}`,
  name: instrument.name ? instrument.name : `${defaultName} ${instrumentIndex + 1}`,
  type,
  instrumentId: `${instrument.index}`,
  isGroup: false,
});

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (a: NavigatorItem, b: NavigatorItem) => {
  return collator.compare(a.name, b.name);
};
const sortByIndex = (a: NavigatorItem, b: NavigatorItem) => {
  return collator.compare(a.id, b.id);
};

export const NavigatorSongs = ({
  height,
  defaultFirst,
  instruments,
  waves,
  noises,
  modified
}: NavigatorSongsProps) => {
  const dispatch = useDispatch();

  const [items, setItems] = useState<NavigatorItem[]>([]);
  const allSongs = useSelector((state: RootState) =>
    musicSelectors.selectAll(state)
  );
  const songsLookup = useSelector((state: RootState) =>
    musicSelectors.selectEntities(state)
  );
  const navigationId = useSelector(
    (state: RootState) => state.editor.selectedSongId
  );
  const selectedSongId = defaultFirst
    ? songsLookup[navigationId]?.id || allSongs[0]?.id
    : navigationId;

  const selectedSong = songsLookup[selectedSongId];

  useEffect(() => {
    setItems(
      allSongs
        .map((song, songIndex) =>
          songToNavigatorItem(song, songIndex, selectedSongId, modified)
        )
        .sort(sortByName)
    );
  }, [allSongs, modified, selectedSongId]);

  const setSelectedSongId = useCallback(
    (id: string) => {
      dispatch(editorActions.setSelectedSongId(id));
    },
    [dispatch]
  );

  const [openInstrumentGroupIds, setOpenInstrumentGroupIds] = useState<InstrumentType[]>([]);

  const toggleInstrumentOpen = (id: InstrumentType) => () => {
    if (isOpen(id)) {
      closeInstrumentGroup(id);
    } else {
      openInstrumentGroup(id);
    }
  };

  const openInstrumentGroup = (id: InstrumentType) => {
    setOpenInstrumentGroupIds((value) => ([] as InstrumentType[]).concat(value, id));
  };

  const closeInstrumentGroup = (id: InstrumentType) => {
    setOpenInstrumentGroupIds((value) => value.filter((s) => s !== id));
  };

  const isOpen = (id: InstrumentType) => {
    return openInstrumentGroupIds.includes(id);
  };

  const [instrumentItems, setInstrumentItems] = useState<InstrumentNavigatorItem[]>([]);
  useEffect(() => {
    const items: InstrumentNavigatorItem[] = [];
    setInstrumentItems(items.concat(
      [{ name: "Duty", id: "duty_group", type: "duty", isGroup: true }],
      isOpen("duty") ?
        instruments
          .map((instrument, i) =>
            instrumentToNavigatorItem("duty")(instrument, i, "Duty")
          )
          .sort(sortByIndex) : [],
      [{ name: "Waves", id: "wave_group", type: "wave", isGroup: true }],
      isOpen("wave") ?
        waves
          .map((wave, i) =>
            instrumentToNavigatorItem("wave")(wave, i, "Wave")
          )
          .sort(sortByIndex) : [],
      [{ name: "Noise", id: "noise_group", type: "noise", isGroup: true }],
      isOpen("noise") ?
        noises
          .map((noise, i) =>
            instrumentToNavigatorItem("noise")(noise, i, "Noise")
          )
          .sort(sortByIndex) : [],
    ))
  }, [instruments, waves, noises, openInstrumentGroupIds]);

  const selectedInstrument = useSelector(
    (state: RootState) => state.editor.selectedInstrument
  );
  const setSelectedInstrument = useCallback(
    (id: string, type: InstrumentType) => {
      dispatch(editorActions.setSelectedInstrument({ id, type }))
    },
    [dispatch]
  );

  const setSelectedInstrumentWithType = (id: string, item: InstrumentNavigatorItem) => {
    if (!item.isGroup && item.instrumentId !== undefined) {
      setSelectedInstrument(item.instrumentId, item.type);
    }
  }

  const [splitSizes, setSplitSizes] = useState([100, 200])
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

  return (
    <>
      <Pane style={{ height: showInstrumentList ? splitSizes[0] : height }}>
        <SplitPaneHeader
          onToggle={() => togglePane(0)}
          collapsed={Math.floor(splitSizes[0]) <= COLLAPSED_SIZE}
          buttons={
            <Button
              variant="transparent"
              size="small"
              title={l10n("TOOL_ADD_SONG_LABEL")}
              onClick={() => { }}
            >
              <PlusIcon />
            </Button>
          }
        >
          {l10n("FIELD_SONGS")}
        </SplitPaneHeader>
        <FlatList
          selectedId={selectedSongId}
          items={items}
          setSelectedId={setSelectedSongId}
          height={(showInstrumentList ? splitSizes[0] : height) - 30}
        >
          {({ item }) => <EntityListItem type="song" item={item} />}
        </FlatList>
      </Pane>
      {showInstrumentList && (
        <>
          <SplitPaneVerticalDivider onMouseDown={onDragStart(0)} />
          <Pane style={{ height: splitSizes[1] }}>
            <SplitPaneHeader
              onToggle={() => togglePane(1)}
              collapsed={Math.floor(splitSizes[1]) <= COLLAPSED_SIZE}
            >
              {l10n("FIELD_INSTRUMENTS")}
            </SplitPaneHeader>
            <FlatList
              selectedId={`${selectedInstrument.type}_${selectedInstrument.id}`}
              items={instrumentItems}
              setSelectedId={setSelectedInstrumentWithType}
              height={splitSizes[1] - 30}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === "ArrowRight") {
                  openInstrumentGroup(selectedInstrument.type);
                } else if (e.key === "ArrowLeft") {
                  closeInstrumentGroup(selectedInstrument.type);
                }
              }}
            >
              {({ selected, item }) =>
                item.isGroup ? (
                  <EntityListItem
                    item={item}
                    type="song"
                    collapsable={true}
                    collapsed={!isOpen(item.type)}
                    onToggleCollapse={toggleInstrumentOpen(item.type)}
                  />
                ) : (
                  <EntityListItem item={item} type={item.type} nestLevel={1} />
                )}
            </FlatList>
          </Pane>
        </>
      )}
    </>
  );
};
