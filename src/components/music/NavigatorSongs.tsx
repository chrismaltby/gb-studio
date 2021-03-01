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

interface NavigatorSongsProps {
  height: number;
  defaultFirst?: boolean;
  instruments: Array<any>;
  noise: Array<any>;
  waves: Array<any>;
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
  instrument: any,
  instrumentIndex: number,
  defaultName: string,
): NavigatorItem => ({
  id: instrument.index,
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
  noise
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
  const selectedId = defaultFirst
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

  const setSelectedId = useCallback(
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
    if (!noise) return;
    setNoiseItems(
      noise
        .map((noise, noiseIndex) =>
          instrumentToNavigatorItem(noise, noiseIndex, "Noise")
        )
        .sort(sortByIndex)
    );
  }, [noise]);

  return (
    <>
      <FlatList
        selectedId={selectedId}
        items={items}
        setSelectedId={setSelectedId}
        height={height - 25 * 15 - 32}
      >
        {({ item }) => <EntityListItem type="animation" item={item} />}
      </FlatList>

      <FormSectionTitle style={{ marginBottom: 0 }}>
        {l10n("FIELD_INSTRUMENTS")} ({instrumentItems.length}/15)
      </FormSectionTitle>

      <FlatList
        selectedId={selectedId}
        items={instrumentItems}
        setSelectedId={setSelectedId}
        height={25 * instrumentItems.length}
      >
        {({ item }) => <EntityListItem type="animation" item={item} />}
      </FlatList>

      <FormSectionTitle style={{ marginBottom: 0 }}>
        {l10n("FIELD_WAVES")} ({wavesItems.length}/15)
      </FormSectionTitle>

      <FlatList
        selectedId={selectedId}
        items={wavesItems}
        setSelectedId={setSelectedId}
        height={25 * wavesItems.length}
      >
        {({ item }) => <EntityListItem type="animation" item={item} />}
      </FlatList>

      <FormSectionTitle style={{ marginBottom: 0 }}>
        {l10n("FIELD_NOISE")} ({noiseItems.length}/15)
      </FormSectionTitle>

      <FlatList
        selectedId={selectedId}
        items={noiseItems}
        setSelectedId={setSelectedId}
        height={25 * noiseItems.length}
      >
        {({ item }) => <EntityListItem type="animation" item={item} />}
      </FlatList>
    </>
  );
};
