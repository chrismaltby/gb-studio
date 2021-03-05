import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DropdownButton } from "../ui/buttons/DropdownButton";
import { EditableText } from "../ui/form/EditableText";
import {
  FormContainer,
  FormDivider,
  FormHeader,
  FormRow,
} from "../ui/form/FormLayout";
import { Sidebar, SidebarColumn } from "../ui/sidebars/Sidebar";
import { Label } from "../ui/form/Label";
import {
  musicSelectors,
} from "../../store/features/entities/entitiesState";
import editorActions from "../../store/features/editor/editorActions";
import { RootState } from "../../store/configureStore";
import { Input } from "../ui/form/Input";
import { InstrumentDutyEditor } from "./InstrumentDutyEditor";
import { InstrumentWaveEditor } from "./InstrumentWaveEditor";
import { InstrumentNoiseEditor } from "./InstrumentNoiseEditor";
import { Song } from "../../lib/helpers/uge/song/Song";
import { DutyInstrument } from "../../lib/helpers/uge/song/DutyInstrument";
import { NoiseInstrument } from "../../lib/helpers/uge/song/NoiseInstrument";
import { WaveInstrument } from "../../lib/helpers/uge/song/WaveInstrument";
import castEventValue from "../../lib/helpers/castEventValue";
import l10n from "../../lib/helpers/l10n";

interface SongEditorProps {
  id: string;
  data: Song | null;
}

const renderInstrumentEditor = (instrumentData: DutyInstrument | NoiseInstrument | WaveInstrument | null) => {
  if (instrumentData instanceof DutyInstrument) return <InstrumentDutyEditor id={`instrument_${instrumentData?.index}`} instrument={instrumentData} />

  if (instrumentData instanceof NoiseInstrument) return <InstrumentNoiseEditor id={`instrument_${instrumentData?.index}`} instrument={instrumentData} />

  if (instrumentData instanceof WaveInstrument) return <InstrumentWaveEditor id={`instrument_${instrumentData?.index}`} instrument={instrumentData} />
}

export const SongEditor = ({
  id,
  data,
}: SongEditorProps) => {
  const selectedInstrument = useSelector(
    (state: RootState) => state.editor.selectedInstrument
  );

  const dispatch = useDispatch();

  const selectSidebar = () => { };

  const onChangeFieldInput = <T extends keyof Song>(key: T) => (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const editValue = castEventValue(e);
    // dispatch(
    //   entitiesActions.editSpriteSheet({
    //     spriteSheetId: id,
    //     changes: {
    //       [key]: editValue,
    //     },
    //   })
    // );
  };

  let instrumentData: DutyInstrument | NoiseInstrument | WaveInstrument | null = null;
  if (data) {
    const selectedInstrumentId = parseInt(selectedInstrument.id);
    switch (selectedInstrument.type) {
      case "instrument":
        instrumentData = data[`duty_instruments`][selectedInstrumentId];
        break;
      case "noise":
        instrumentData = data[`noise_instruments`][selectedInstrumentId];
        break;
      case "wave":
        instrumentData = data[`wave_instruments`][selectedInstrumentId];
        break;
    }
  }
  console.log(instrumentData);

  if (!data || !instrumentData) {
    return null;
  }

  return (
    <Sidebar onClick={selectSidebar}>
      <SidebarColumn>
        <FormContainer>
          <FormHeader>
            <EditableText
              name="name"
              placeholder="Song"
              value={data?.name || ""}
              onChange={onChangeFieldInput("name")}
            />

            <DropdownButton
              size="small"
              variant="transparent"
              menuDirection="right"
            >
              {/* <MenuItem onClick={onCopyVar}>
                {l10n("MENU_VARIABLE_COPY_EMBED")}
              </MenuItem>
              <MenuItem onClick={onCopyChar}>
                {l10n("MENU_VARIABLE_COPY_EMBED_CHAR")}
              </MenuItem> */}
            </DropdownButton>
          </FormHeader>

          <FormRow>
            <Label htmlFor="artist">{l10n("FIELD_ARTIST")}</Label>
          </FormRow>
          <FormRow>
            <Input
              name="artist"
              value={data?.artist}
            />
          </FormRow>
          <FormRow>
            <Label htmlFor="ticks_per_row">{l10n("FIELD_TEMPO")}</Label>
          </FormRow>
          <FormRow>
            <Input
              name="ticks_per_row"
              type="number"
              value={data?.ticks_per_row}
              min={0}
              max={20}
            />
          </FormRow>
          <FormDivider />
          <FormHeader>
            <EditableText
              name="instrumentName"
              placeholder="Instrument"
              value={instrumentData ? instrumentData.name : ""}
              onChange={onChangeFieldInput("name")}
            />

            <DropdownButton
              size="small"
              variant="transparent"
              menuDirection="right"
            >
              {/* <MenuItem onClick={onCopyVar}>
                {l10n("MENU_VARIABLE_COPY_EMBED")}
              </MenuItem>
              <MenuItem onClick={onCopyChar}>
                {l10n("MENU_VARIABLE_COPY_EMBED_CHAR")}
              </MenuItem> */}
            </DropdownButton>
          </FormHeader>
          {
            renderInstrumentEditor(instrumentData)
          }
        </FormContainer>
      </SidebarColumn>
    </Sidebar>
  );
};
