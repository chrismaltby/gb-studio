import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import uniq from "lodash/uniq";
import { RootState } from "store/configureStore";
import { musicSelectors } from "store/features/entities/entitiesState";
import {
  Option,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
  OptGroup,
} from "ui/form/Select";
import { PauseIcon, PlayIcon } from "ui/icons/Icons";
import { Button } from "ui/buttons/Button";
import musicActions from "store/features/music/musicActions";

interface MusicSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
}

interface PlayPauseTrackProps extends SelectCommonProps {
  musicId: string;
}

export const PlayPauseTrack = ({ musicId }: PlayPauseTrackProps) => {
  const dispatch = useDispatch();
  const musicPlaying = useSelector((state: RootState) => state.music.playing);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      if (musicPlaying) {
        dispatch(musicActions.pauseMusic());
      } else {
        dispatch(musicActions.playMusic({ musicId }));
      }
    },
    [dispatch, musicId, musicPlaying]
  );

  return (
    <Button
      size="small"
      variant="transparent"
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      {musicPlaying ? <PauseIcon /> : <PlayIcon />}
    </Button>
  );
};

export const MusicSelect = ({
  value,
  onChange,
  ...selectProps
}: MusicSelectProps) => {
  const tracks = useSelector((state: RootState) =>
    musicSelectors.selectAll(state)
  );
  const musicDriver = useSelector(
    (state: RootState) => state.project.present.settings.musicDriver
  );

  const [options, setOptions] = useState<OptGroup[]>([]);
  const [currentValue, setCurrentValue] = useState<Option>();

  useEffect(() => {
    const driverTracks = tracks.filter(
      (track) =>
        (musicDriver === "huge" && track.type === "uge") ||
        (musicDriver !== "huge" && track.type !== "uge")
    );
    const plugins = uniq(driverTracks.map((s) => s.plugin || "")).sort();
    setOptions(
      plugins.map((pluginKey) => ({
        label: pluginKey,
        options: driverTracks
          .filter((track) => (track.plugin || "") === pluginKey)
          .map((track) => ({
            label: track.name,
            value: track.id,
          })),
      }))
    );
  }, [tracks, musicDriver]);

  useEffect(() => {
    let option: Option | null = null;
    options.find((optGroup) => {
      const foundOption = optGroup.options.find((opt) => opt.value === value);
      if (foundOption) {
        option = foundOption;
        return true;
      }
      return false;
    });
    setCurrentValue(option || options[0]?.options[0]);
  }, [options, value]);

  const onSelectChange = useCallback(
    (newValue: Option) => {
      onChange?.(newValue.value);
    },
    [onChange]
  );

  return (
    <Select
      value={currentValue}
      options={options}
      onChange={onSelectChange}
      formatOptionLabel={(option: Option) => {
        return (
          <OptionLabelWithPreview
            preview={<PlayPauseTrack musicId={option.value} />}
          >
            {option.label}
          </OptionLabelWithPreview>
        );
      }}
      components={{
        SingleValue: () => (
          <SingleValueWithPreview
            preview={<PlayPauseTrack musicId={currentValue?.value || ""} />}
          >
            {currentValue?.label}
          </SingleValueWithPreview>
        ),
      }}
      {...selectProps}
    />
  );
};
