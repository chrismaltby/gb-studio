import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/configureStore";
import { musicSelectors } from "../../store/features/entities/entitiesState";
import { FlatList } from "../ui/lists/FlatList";
import editorActions from "../../store/features/editor/editorActions";
import { Music } from "../../store/features/entities/entitiesTypes";
import { EntityListItem } from "../ui/lists/EntityListItem";
import { FormSectionTitle } from "../ui/form/FormLayout";
import l10n from "../../lib/helpers/l10n";
import { InstrumentType } from "../../store/features/editor/editorState";
import { NoiseInstrument } from "../../lib/helpers/uge/song/NoiseInstrument";
import { WaveInstrument } from "../../lib/helpers/uge/song/WaveInstrument";
import { DutyInstrument } from "../../lib/helpers/uge/song/DutyInstrument";

interface NavigatorSongsProps {
  height: number;
  defaultFirst?: boolean;
  instruments: DutyInstrument[];
  noises: NoiseInstrument[];
  waves: WaveInstrument[];
}

interface NavigatorItem {
  id: string;
  name: string;
}

const songToNavigatorItem = (
  song: Music,
  songIndex: number
): NavigatorItem => ({
  id: song.id,
  name: song.name ? song.name : `Song ${songIndex + 1}`,
});

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

export const NavigatorSongs = ({
  height,
  defaultFirst,
  instruments,
  waves,
  noises
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

  const dispatch = useDispatch();

  useEffect(() => {
    setItems(
      allSongs
        .map((song, songIndex) =>
          songToNavigatorItem(song, songIndex)
        )
        .sort(sortByName)
    );
  }, [allSongs]);

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

  return (
    <>
      <FlatList
        selectedId={selectedSongId}
        items={items}
        setSelectedId={setSelectedSongId}
        height={height - 25 * 15 - 32}
      >
        {({ item }) => <EntityListItem type="animation" item={item} />}
      </FlatList>

      <FormSectionTitle style={{ marginBottom: 0 }}>
        {l10n("FIELD_INSTRUMENTS")} ({instrumentItems.length}/15)
      </FormSectionTitle>

      <FlatList
        selectedId={selectedInstrument.type === "instrument" ? selectedInstrument.id : ""}
        items={instrumentItems}
        setSelectedId={setSelectedInstrumentWithType("instrument")}
        height={25 * instrumentItems.length}
      >
        {({ item }) => <EntityListItem type="animation" item={item} />}
      </FlatList>

      <FormSectionTitle style={{ marginBottom: 0 }}>
        {l10n("FIELD_WAVES")} ({wavesItems.length}/15)
      </FormSectionTitle>

      <FlatList
        selectedId={selectedInstrument.type === "wave" ? selectedInstrument.id : ""}
        items={wavesItems}
        setSelectedId={setSelectedInstrumentWithType("wave")}
        height={25 * wavesItems.length}
      >
        {({ item }) => <EntityListItem type="animation" item={item} />}
      </FlatList>

      <FormSectionTitle style={{ marginBottom: 0 }}>
        {l10n("FIELD_NOISE")} ({noiseItems.length}/15)
      </FormSectionTitle>

      <FlatList
        selectedId={selectedInstrument.type === "noise" ? selectedInstrument.id : ""}
        items={noiseItems}
        setSelectedId={setSelectedInstrumentWithType("noise")}
        height={25 * noiseItems.length}
      >
        {({ item }) => <EntityListItem type="animation" item={item} />}
      </FlatList>
    </>
  );
};
