import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { SongTracker } from "components/music/tracker/SongTracker";
import { musicSelectors } from "store/features/entities/entitiesSelectors";
import l10n from "shared/lib/lang/l10n";
import { UgePlayer } from "components/music/UgePlayer";
import { useAppSelector } from "store/hooks";
import { SongPianoRoll } from "components/music/piano/SongPianoRoll";

const ContentWrapper = styled.div`
  flex: 1 1 0;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  background: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  position: relative;
  display: flex;
`;

const ContentMessage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const ErrorTitle = styled.div`
  font-size: 14px;
  font-weight: bold;
`;

const ErrorDescription = styled.div`
  padding-top: 5px;
`;

const SongDocument = () => {
  const selectedSongId = useAppSelector(
    (state) => state.tracker.selectedSongId,
  );

  const song = useAppSelector((state) =>
    musicSelectors.selectById(state, selectedSongId),
  );

  const lastSongId = useRef("");
  useEffect(() => {
    if (song) {
      lastSongId.current = song.id;
    }
  }, [song]);

  const hasSongDocument = useAppSelector(
    (state) => !!state.trackerDocument.present.song,
  );
  const status = useAppSelector((state) => state.tracker.status);
  const error = useAppSelector((state) => state.tracker.error);

  const view = useAppSelector((state) => state.tracker.view);

  if (status === "error") {
    return (
      <ContentWrapper>
        <ContentMessage>
          <ErrorTitle>Can't load the song</ErrorTitle>
          <ErrorDescription>{error}</ErrorDescription>
        </ContentMessage>
      </ContentWrapper>
    );
  }

  if (status === "loading" || status === "init") {
    return (
      <ContentWrapper>
        <ContentMessage>{l10n("FIELD_LOADING")}</ContentMessage>
      </ContentWrapper>
    );
  }

  if (!hasSongDocument) {
    return (
      <ContentWrapper>
        <ContentMessage>No Song Loaded</ContentMessage>
      </ContentWrapper>
    );
  }

  return (
    <>
      {view === "tracker" && <SongTracker />}
      {view === "roll" && <SongPianoRoll />}
      <UgePlayer />
    </>
  );
};

export default SongDocument;
