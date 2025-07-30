import React, { useCallback } from "react";
import styled from "styled-components";
import { musicSelectors } from "store/features/entities/entitiesState";
import musicActions from "store/features/music/musicActions";
import { Button } from "ui/buttons/Button";
import { PauseIcon, PlayIcon } from "ui/icons/Icons";
import { CheckboxField } from "ui/form/CheckboxField";
import l10n from "shared/lib/lang/l10n";
import entitiesActions from "store/features/entities/entitiesActions";
import electronActions from "store/features/electron/electronActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { assetPath } from "shared/lib/helpers/assets";

interface ModViewerProps {
  trackId: string;
}

const ContentWrapper = styled.div`
  display: flex;
  height: 100%;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const PillWrapper = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  bottom: 25px;
  left: 10px;
  z-index: 11;
  border-radius: 16px;
  background: ${(props) => props.theme.colors.background};
  box-shadow: 0 0 0 4px ${(props) => props.theme.colors.background};
  font-size: ${(props) => props.theme.typography.fontSize};
`;

const Pill = styled.button`
  color: ${(props) => props.theme.colors.button.text};
  background: ${(props) => props.theme.colors.list.activeBackground};
  border: 0px;
  border-radius: 16px;
  padding: 3px 10px;
  font-size: ${(props) => props.theme.typography.fontSize};

  &:active {
    background: ${(props) => props.theme.colors.list.selectedBackground};
  }
`;

const TrackContainer = styled.div`
  display: flex;
  flex-direction: column;
  text-align: center;
  align-items: center;
`;

const TrackName = styled.div`
  margin: 20px 0;
`;

const TrackSettings = styled.div`
  margin-top: 20px;
  background-color: ${(props) => props.theme.colors.sidebar.background};
  border-radius: 8px;
  padding: 20px;
`;

const ModViewer = ({ trackId }: ModViewerProps) => {
  const dispatch = useAppDispatch();
  const track = useAppSelector((state) =>
    musicSelectors.selectById(state, trackId),
  );
  const playing = useAppSelector((state) => state.music.playing);

  const onPlay = useCallback(() => {
    dispatch(musicActions.playMusic({ musicId: trackId }));
  }, [dispatch, trackId]);

  const onPause = useCallback(() => {
    dispatch(musicActions.pauseMusic());
  }, [dispatch]);

  const onChangeSpeedConversion = useCallback(() => {
    dispatch(
      entitiesActions.editMusicSettings({
        musicId: trackId,
        changes: {
          disableSpeedConversion: !track?.settings.disableSpeedConversion,
        },
      }),
    );
  }, [dispatch, track?.settings.disableSpeedConversion, trackId]);

  const onEdit = useCallback(() => {
    if (track) {
      dispatch(
        electronActions.openFile({
          filename: assetPath("music", track),
          type: "music",
        }),
      );
    }
  }, [dispatch, track]);

  if (!track) {
    return <div />;
  }

  return (
    <ContentWrapper>
      <TrackContainer>
        {playing ? (
          <Button size="large" variant="transparent" onClick={onPause}>
            <PauseIcon />
          </Button>
        ) : (
          <Button size="large" variant="transparent" onClick={onPlay}>
            <PlayIcon />
          </Button>
        )}

        <TrackName> {track.filename}</TrackName>
        <TrackSettings>
          <CheckboxField
            name="disableSpeedConversion"
            label={l10n("FIELD_MUSIC_DISABLE_SPEED_CONVERSION")}
            onChange={onChangeSpeedConversion}
            checked={track.settings?.disableSpeedConversion ?? false}
          />
        </TrackSettings>
      </TrackContainer>
      <PillWrapper>
        <Pill onClick={onEdit}>{l10n("ASSET_EDIT")}</Pill>
      </PillWrapper>
    </ContentWrapper>
  );
};

export default ModViewer;
