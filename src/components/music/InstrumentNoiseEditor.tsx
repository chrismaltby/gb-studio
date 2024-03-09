import React from "react";
import { useDispatch } from "react-redux";
import castEventValue from "renderer/lib/helpers/castEventValue";
import l10n from "shared/lib/lang/l10n";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { NoiseInstrument } from "store/features/trackerDocument/trackerDocumentTypes";
import { CheckboxField } from "ui/form/CheckboxField";
import { FormDivider, FormRow } from "ui/form/FormLayout";
import { InstrumentLengthForm } from "./InstrumentLengthForm";
import { InstrumentVolumeEditor } from "./InstrumentVolumeEditor";
import { NoiseMacroEditorForm } from "./NoiseMacroEditorForm";
import { Button } from "ui/buttons/Button";
import { SubPatternCell } from "shared/lib/uge/song/SubPatternCell";
import { cloneDeep } from "lodash";
import Alert, { AlertItem } from "ui/alerts/Alert";
import API from "renderer/lib/api";

interface InstrumentNoiseEditorProps {
  id: string;
  instrument?: NoiseInstrument;
}

export const InstrumentNoiseEditor = ({
  instrument,
}: InstrumentNoiseEditorProps) => {
  const dispatch = useDispatch();

  if (!instrument) return <></>;

  const onChangeField =
    <T extends keyof NoiseInstrument>(key: T) =>
    (editValue: NoiseInstrument[T]) => {
      dispatch(
        trackerDocumentActions.editNoiseInstrument({
          instrumentId: instrument.index,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onChangeSubpattern = (macros: number[]) => {
    const newSubPattern = cloneDeep(instrument.subpattern);
    macros.forEach((value, i) => {
      newSubPattern[i].note = value + 36;
    });

    dispatch(
      trackerDocumentActions.editSubPattern({
        instrumentId: instrument.index,
        instrumentType: "noise",
        subpattern: newSubPattern,
      })
    );
  };

  const onTestInstrument = () => {
    API.music.sendToMusicWindow({
      action: "preview",
      note: 24, // C_5
      type: "noise",
      instrument: instrument,
      square2: false,
    });
  };

  const noiseMacros = !instrument.subpattern_enabled
    ? []
    : instrument.subpattern
        // .slice(0, 6)
        .map((subpatternCell: SubPatternCell) =>
          subpatternCell && subpatternCell.note ? subpatternCell.note - 36 : 0
        );

  return (
    <>
      <InstrumentLengthForm
        value={instrument.length}
        onChange={onChangeField("length")}
      />

      <FormDivider />

      <InstrumentVolumeEditor
        initialVolume={instrument.initial_volume}
        volumeSweepChange={instrument.volume_sweep_change}
        length={instrument.length}
        onChange={onChangeField}
      />

      <FormDivider />

      <FormRow>
        <CheckboxField
          name="bit_count"
          label={l10n("FIELD_BIT_COUNT")}
          checked={instrument.bit_count === 7}
          onChange={(e) => {
            const v = castEventValue(e);
            const value = v ? 7 : 15;
            onChangeField("bit_count")(value);
          }}
        />
      </FormRow>

      {/* Disable the noise macro preview for now. In the future it should edit the subpattern visually  */}
      {false ? ( // {instrument.noise_macro ? (
        <>
          <NoiseMacroEditorForm
            macros={noiseMacros}
            onChange={onChangeSubpattern}
          />
        </>
      ) : (
        ""
      )}

      <FormDivider />

      <FormRow>
        <Button onClick={onTestInstrument}>
          {l10n("FIELD_TEST_INSTRUMENT")}
        </Button>
      </FormRow>
      {instrument.subpattern_enabled && (
        <FormRow>
          <Alert variant="info">
            <AlertItem>{l10n("MESSAGE_NOT_PREVIEW_SUBPATTERN")}</AlertItem>
          </Alert>
        </FormRow>
      )}
    </>
  );
};
