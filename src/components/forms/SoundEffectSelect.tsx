import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Option,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
  OptGroup,
} from "ui/form/Select";
import { PlayIcon } from "ui/icons/Icons";
import { Button } from "ui/buttons/Button";
import soundfxActions from "store/features/soundfx/soundfxActions";
import l10n from "lib/helpers/l10n";
import { soundSelectors } from "store/features/entities/entitiesState";
import uniq from "lodash/uniq";
import { RootState } from "store/configureStore";

interface SoundEffectSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
  pitch?: number;
  frequency?: number;
  duration?: number;
}

type EffectType = "beep" | "tone" | "crash";

interface PlaySoundEffectProps extends SelectCommonProps {
  effect?: EffectType;
  pitch?: number;
  frequency?: number;
  duration?: number;
}

export const PlaySoundEffect = ({
  effect,
  pitch = 4,
  frequency = 200,
  duration = 0.5,
}: PlaySoundEffectProps) => {
  const dispatch = useDispatch();

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      if (effect === "beep") {
        dispatch(soundfxActions.playSoundFxBeep({ pitch }));
      } else if (effect === "tone") {
        dispatch(soundfxActions.playSoundFxTone({ frequency, duration }));
      } else if (effect === "crash") {
        dispatch(soundfxActions.playSoundFxCrash());
      }
    },
    [dispatch, duration, effect, frequency, pitch]
  );

  return (
    <Button
      size="small"
      variant="transparent"
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <PlayIcon />
    </Button>
  );
};

export const SoundEffectSelect = ({
  value,
  onChange,
  pitch,
  duration,
  frequency,
  ...selectProps
}: SoundEffectSelectProps) => {
  const [currentValue, setCurrentValue] = useState<Option>();
  const [options, setOptions] = useState<OptGroup[]>([]);

  const sounds = useSelector((state: RootState) =>
    soundSelectors.selectAll(state)
  );

  useEffect(() => {
    const plugins = uniq(sounds.map((s) => s.plugin || "")).sort();
    setOptions([
      {
        label: l10n("FIELD_BASIC"),
        options: [
          {
            label: l10n("FIELD_EFFECT_BEEP"),
            value: "beep",
          },
          {
            label: l10n("FIELD_EFFECT_TONE"),
            value: "tone",
          },
          {
            label: l10n("FIELD_EFFECT_CRASH"),
            value: "crash",
          },
        ],
      },
      ...plugins.map((pluginKey) => ({
        label: pluginKey || l10n("FIELD_FILES"),
        options: sounds
          .filter((track) => (track.plugin || "") === pluginKey)
          .map((track) => ({
            label: track.name,
            value: track.id,
          })),
      })),
    ]);
  }, [sounds]);

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
            preview={
              <PlaySoundEffect
                effect={option.value as EffectType | undefined}
                pitch={pitch}
                duration={duration}
                frequency={frequency}
              />
            }
          >
            {option.label}
          </OptionLabelWithPreview>
        );
      }}
      components={{
        SingleValue: () => (
          <SingleValueWithPreview
            preview={
              <PlaySoundEffect
                effect={currentValue?.value as EffectType | undefined}
                pitch={pitch}
                duration={duration}
                frequency={frequency}
              />
            }
          >
            {currentValue?.label}
          </SingleValueWithPreview>
        ),
      }}
      {...selectProps}
    />
  );
};
