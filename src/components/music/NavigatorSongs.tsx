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
    name: nameIfModified(song.name ? song.name : `Song ${songIndex + 1}`),
  });
};

const instrumentToNavigatorItem = (
  instrument: DutyInstrument | NoiseInstrument | WaveInstrument,
  instrumentIndex: number,
  defaultName: string,
): NavigatorItem => ({
  id: `${instrument.index}`,
  name: instrument.name ? instrument.name : `${defaultName} ${instrumentIndex + 1}`,
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

const COLLAPSED_SIZE = 30;
export const NavigatorSongs = ({
  height,
  defaultFirst,
  instruments,
  waves,
  noises,
  modified
}: NavigatorSongsProps) => {
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

  const dispatch = useDispatch();

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

  const [instrumentItems, setInstrumentItems] = useState<NavigatorItem[]>([]);
  useEffect(() => {
    if (!instruments) return;
    setInstrumentItems(
      instruments
        .map((instrument, instrumentIndex) =>
          instrumentToNavigatorItem(instrument, instrumentIndex, "Duty")
        )
        .sort(sortByIndex)
    );
  }, [instruments]);

  const [wavesItems, setWavesItems] = useState<NavigatorItem[]>([]);
  useEffect(() => {
    if (!waves) return;
    setWavesItems(
      waves
        .map((wave, waveIndex) =>
          instrumentToNavigatorItem(wave, waveIndex, "Wave")
        )
        .sort(sortByIndex)
    );
  }, [waves]);

  const [noiseItems, setNoiseItems] = useState<NavigatorItem[]>([]);
  useEffect(() => {
    if (!noises) return;
    setNoiseItems(
      noises
        .map((noise, noiseIndex) =>
          instrumentToNavigatorItem(noise, noiseIndex, "Noise")
        )
        .sort(sortByIndex)
    );
  }, [noises]);

  const selectedInstrument = useSelector(
    (state: RootState) => state.editor.selectedInstrument
  );
  const setSelectedInstrument = useCallback(
    (id: string, type: InstrumentType) => {
      dispatch(editorActions.setSelectedInstrument({ id, type }))
    },
    [dispatch]
  );

  const setSelectedInstrumentWithType = (type: InstrumentType) => (id: string) => {
    setSelectedInstrument(id, type);
  }

  const [splitSizes, setSplitSizes] = useState([100, 100, 100, 100])
  const [onDragStart, togglePane] = useSplitPane({
    sizes: splitSizes,
    setSizes: setSplitSizes,
    minSizes: [COLLAPSED_SIZE, COLLAPSED_SIZE, COLLAPSED_SIZE, COLLAPSED_SIZE],
    collapsedSize: COLLAPSED_SIZE,
    reopenSize: 200,
    maxTotal: height,
    direction: "vertical",
  });

  const showInstruments = selectedSong && selectedSong.type === "uge";

  return (
    <>
      <Pane style={{ height: showInstruments ? splitSizes[0] : height }}>
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
          height={(showInstruments ? splitSizes[0] : height) - 30}
        >
          {({ item }) => <EntityListItem type="song" item={item} />}
        </FlatList>
      </Pane>
      {showInstruments && (
        <>
        <SplitPaneVerticalDivider onMouseDown={onDragStart(0)} />
        <Pane style={{ height: splitSizes[1] }}>
          <SplitPaneHeader
            onToggle={() => togglePane(1)}
            collapsed={Math.floor(splitSizes[1]) <= COLLAPSED_SIZE}
            buttons={
              <Button
                variant="transparent"
                size="small"
                title={l10n("TOOL_ADD_DUTY_INSTRUMENT_LABEL")}
                onClick={() => { }}
              >
                <PlusIcon />
              </Button>
            }
          >
            {l10n("FIELD_INSTRUMENTS")} ({instrumentItems.length}/15)
          </SplitPaneHeader>
          <FlatList
            selectedId={selectedInstrument.type === "instrument" ? selectedInstrument.id : ""}
            items={instrumentItems}
            setSelectedId={setSelectedInstrumentWithType("instrument")}
            height={splitSizes[1] - 30}
          >
            {({ item }) => <EntityListItem type="instrument" item={item} />}
          </FlatList>
        </Pane>
        <SplitPaneVerticalDivider onMouseDown={onDragStart(1)} />
        <Pane style={{ height: splitSizes[2] }}>

          <SplitPaneHeader
            onToggle={() => togglePane(2)}
            collapsed={Math.floor(splitSizes[2]) <= COLLAPSED_SIZE}
            buttons={
              <Button
                variant="transparent"
                size="small"
                title={l10n("TOOL_ADD_WAVE_INSTRUMENT_LABEL")}
                onClick={() => { }}
              >
                <PlusIcon />
              </Button>
            }
          >
            {l10n("FIELD_WAVES")} ({wavesItems.length}/15)
          </SplitPaneHeader>
          <FlatList
            selectedId={selectedInstrument.type === "wave" ? selectedInstrument.id : ""}
            items={wavesItems}
            setSelectedId={setSelectedInstrumentWithType("wave")}
            height={splitSizes[2] - 30}
          >
            {({ item }) => <EntityListItem type="wave" item={item} />}
          </FlatList>
        </Pane>
        <SplitPaneVerticalDivider onMouseDown={onDragStart(2)} />

        <Pane style={{ height: splitSizes[3] }}>
          <SplitPaneHeader
            onToggle={() => togglePane(3)}
            collapsed={Math.floor(splitSizes[3]) <= COLLAPSED_SIZE}
            buttons={
              <Button
                variant="transparent"
                size="small"
                title={l10n("TOOL_ADD_NOISE_INSTRUMENT_LABEL")}
                onClick={() => { }}
              >
                <PlusIcon />
              </Button>
            }
          >
            {l10n("FIELD_NOISE")} ({noiseItems.length}/15)
          </SplitPaneHeader>
          <FlatList
            selectedId={selectedInstrument.type === "noise" ? selectedInstrument.id : ""}
            items={noiseItems}
            setSelectedId={setSelectedInstrumentWithType("noise")}
            height={splitSizes[3] - 30}
          >
            {({ item }) => <EntityListItem type="noise" item={item} />}
          </FlatList>
        </Pane>
        </>
      )}
    </>
  );
};
