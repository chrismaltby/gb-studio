import React from "react";
import l10n from "shared/lib/lang/l10n";
import styled from "styled-components";
import { CheckboxField } from "ui/form/CheckboxField";
import { Knob } from "ui/form/Knob";
import { Label } from "ui/form/Label";

interface InstrumentEnvelopePropertiesProps {
  volume: number;
  sweep: number;
  length: number | null;
  onChangeVolume: (value: number) => void;
  onChangeSweep: (value: number) => void;
  onChangeLength: (value: number | null) => void;
}

const StyledEnvelopeForm = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

export const InstrumentEnvelopeProperties = ({
  volume,
  sweep,
  length,
  onChangeVolume,
  onChangeLength,
  onChangeSweep,
}: InstrumentEnvelopePropertiesProps) => {
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
          max={64}
          onChange={onChangeLength}
        />
      </StyledEnvelopeField>

      <StyledEnvelopeField>
        <Label htmlFor="initialVolume">{l10n("FIELD_INITIAL_VOLUME")}</Label>
        <Knob
          name="initialVolume"
          value={volume}
          min={0}
          max={15}
          onChange={onChangeVolume}
        />
      </StyledEnvelopeField>
      <StyledEnvelopeField>
        <Label htmlFor="sweepChange">{l10n("FIELD_VOLUME_SWEEP_CHANGE")}</Label>
        <Knob
          name="sweepChange"
          value={sweep}
          min={-7}
          max={7}
          onChange={onChangeSweep}
        />
      </StyledEnvelopeField>
    </StyledEnvelopeForm>
  );
};
