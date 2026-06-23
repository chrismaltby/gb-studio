import React, { useCallback, useEffect, useRef } from "react";
import l10n from "shared/lib/lang/l10n";
import styled from "styled-components";
import { CheckboxField } from "ui/form/CheckboxField";
import { Knob } from "ui/form/Knob";
import { Label } from "ui/form/Label";

interface InstrumentWaveEnvelopePropertiesProps {
  volume: number;
  length: number | null;
  onChangeVolume: (value: number) => void;
  onChangeLength: (value: number | null) => void;
}

const StyledEnvelopeForm = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
  align-items: end;
  padding: 0 10px;
  padding-bottom: 10px;
`;

const StyledEnvelopeField = styled.div`
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 6px;

  > *:first-child {
    align-self: end;
    align-items: center;
    text-align: center;
    justify-content: center;
    height: auto;
  }

  &:first-child > *:first-child {
    position: relative;
    top: -1px;
  }

  > *:last-child {
    width: 100%;
  }
`;

const mapInput = (input: number): number => {
  if (input === 0) {
    return 0;
  } else if (input === 1) {
    return 100;
  } else if (input === 2) {
    return 50;
  } else {
    return 25;
  }
};

const waveVolumeDisplays = [0, 25, 50, 100] as const;
const waveVolumeDisplayToStored = {
  0: 0,
  25: 3,
  50: 2,
  100: 1,
} as const;

const mapDisplayValueToStoredVolume = (
  value: number,
  currentDisplayValue: number,
): number => {
  const closestDisplayValue = waveVolumeDisplays.reduce(
    (closest, candidate) => {
      const closestDistance = Math.abs(value - closest);
      const candidateDistance = Math.abs(value - candidate);

      if (candidateDistance !== closestDistance) {
        return candidateDistance < closestDistance ? candidate : closest;
      }

      if (value > currentDisplayValue) {
        return candidate;
      }

      return closest;
    },
  );

  return waveVolumeDisplayToStored[closestDisplayValue];
};

export const InstrumentWaveEnvelopeProperties = ({
  volume,
  length,
  onChangeVolume,
  onChangeLength,
}: InstrumentWaveEnvelopePropertiesProps) => {
  const lastRequestedDisplayValueRef = useRef(mapInput(volume));
  const lastResolvedStoredVolumeRef = useRef(volume);

  useEffect(() => {
    lastResolvedStoredVolumeRef.current = volume;
  }, [volume]);

  const fixedOnChangeVolume = useCallback(
    (value: number) => {
      const previousRequestedDisplayValue =
        lastRequestedDisplayValueRef.current;
      const nextStoredVolume =
        value === 75 && previousRequestedDisplayValue === 75
          ? lastResolvedStoredVolumeRef.current
          : mapDisplayValueToStoredVolume(value, previousRequestedDisplayValue);

      lastRequestedDisplayValueRef.current = value;
      lastResolvedStoredVolumeRef.current = nextStoredVolume;
      onChangeVolume(nextStoredVolume);
    },
    [onChangeVolume],
  );

  const formatValue = useCallback(() => {
    return `${mapInput(lastResolvedStoredVolumeRef.current)}%`;
  }, []);

  return (
    <StyledEnvelopeForm>
      <StyledEnvelopeField>
        <CheckboxField
          label={l10n("FIELD_LENGTH")}
          name="length"
          checked={length !== null}
          onChange={(e) => {
            const value = e.target.checked;
            if (!value) {
              onChangeLength(null);
            } else {
              onChangeLength(32);
            }
          }}
        />
        <Knob
          name="length"
          value={length ?? 0}
          min={1}
          max={256}
          onChange={onChangeLength}
        />
      </StyledEnvelopeField>

      <StyledEnvelopeField>
        <Label htmlFor="initialVolume">{l10n("FIELD_VOLUME")}</Label>
        <Knob
          name="initialVolume"
          value={mapInput(volume)}
          min={0}
          max={100}
          step={25}
          onChange={fixedOnChangeVolume}
          formatValue={formatValue}
        />
      </StyledEnvelopeField>
    </StyledEnvelopeForm>
  );
};
