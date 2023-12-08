import React, { FC, useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { EditableText } from "ui/form/EditableText";
import {
  FormContainer,
  FormDivider,
  FormHeader,
  FormRow,
} from "ui/form/FormLayout";
import { Sidebar, SidebarColumn } from "ui/sidebars/Sidebar";
import { Label } from "ui/form/Label";
import { RootState } from "store/configureStore";
import { Input } from "ui/form/Input";
import { InstrumentDutyEditor } from "./InstrumentDutyEditor";
import { InstrumentWaveEditor } from "./InstrumentWaveEditor";
import { InstrumentNoiseEditor } from "./InstrumentNoiseEditor";
import { Song } from "lib/helpers/uge/song/Song";
import castEventValue from "lib/helpers/castEventValue";
import l10n from "lib/helpers/l10n";
import {
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
} from "store/features/trackerDocument/trackerDocumentTypes";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { MenuItem } from "components/library/Menu";
import { PatternCellEditor } from "./PatternCellEditor";
import trackerActions from "store/features/tracker/trackerActions";
import { StickyTabs, TabBar } from "ui/tabs/Tabs";
import { InstrumentSubpatternEditor } from "./InstrumentSubpatternEditor";
import styled from "styled-components";

type Instrument = DutyInstrument | NoiseInstrument | WaveInstrument;

const instrumentEditorTabs = {
  main: l10n("SIDEBAR_INSTRUMENT"),
  subpattern: l10n("SIDEBAR_SUBPATTERN"),
} as const;

type InstrumentEditorTab = keyof typeof instrumentEditorTabs;

interface SongEditorProps {
  multiColumn: boolean;
}

const InstrumentEditorWrapper = styled.div`
  padding-top: 10px;
`;

const renderInstrumentEditor = (
  type: string,
  instrumentData: Instrument | null,
  waveForms?: Uint8Array[]
) => {
  if (type === "duty")
    return (
      <InstrumentDutyEditor
        id={`instrument_${instrumentData?.index}`}
        instrument={instrumentData as DutyInstrument}
      />
    );

  if (type === "noise")
    return (
      <InstrumentNoiseEditor
        id={`instrument_${instrumentData?.index}`}
        instrument={instrumentData as NoiseInstrument}
      />
    );

  if (type === "wave")
    return (
      <InstrumentWaveEditor
        id={`instrument_${instrumentData?.index}`}
        instrument={instrumentData as WaveInstrument}
        waveForms={waveForms}
      />
    );
};

const instrumentName = (instrument: Instrument, type: string) => {
  let typeName = "Instrument";
  if (type === "duty") typeName = "Duty";
  if (type === "wave") typeName = "Wave";
  if (type === "noise") typeName = "Noise";

  return instrument.name
    ? instrument.name
    : `${typeName} ${instrument.index + 1}`;
};

export const SongEditor: FC<SongEditorProps> = ({ multiColumn }) => {
  const dispatch = useDispatch();
  const selectedInstrument = useSelector(
    (state: RootState) => state.editor.selectedInstrument
  );
  useEffect(() => {
    dispatch(trackerActions.setSelectedEffectCell(null));
  }, [dispatch, selectedInstrument]);
  const sequenceId = useSelector(
    (state: RootState) => state.editor.selectedSequence
  );
  const song = useSelector(
    (state: RootState) => state.trackerDocument.present.song
  );
  console.log("SONG", song);

  const selectSidebar = () => {};

  const onChangeFieldInput =
    <T extends keyof Song>(key: T) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const editValue = castEventValue(e);
      dispatch(
        trackerDocumentActions.editSong({
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onChangeInstrumentName =
    (type: string) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const editValue = castEventValue(e);

      let action;
      if (type === "duty") action = trackerDocumentActions.editDutyInstrument;
      if (type === "wave") action = trackerDocumentActions.editWaveInstrument;
      if (type === "noise") action = trackerDocumentActions.editNoiseInstrument;

      if (!action || !instrumentData) return;

      dispatch(
        action({
          instrumentId: instrumentData.index,
          changes: {
            name: editValue,
          },
        })
      );
    };

  let instrumentData: Instrument | null = null;
  if (song) {
    const selectedInstrumentId = parseInt(selectedInstrument.id);
    switch (selectedInstrument.type) {
      case "duty":
        instrumentData = song.duty_instruments[selectedInstrumentId];
        break;
      case "noise":
        instrumentData = song.noise_instruments[selectedInstrumentId];
        break;
      case "wave":
        instrumentData = song.wave_instruments[selectedInstrumentId];
        break;
    }
  }

  const onRemovePattern = useCallback(() => {
    dispatch(
      trackerDocumentActions.removeSequence({
        sequenceIndex: sequenceId,
      })
    );
  }, [dispatch, sequenceId]);

  const selectedEffectCell = useSelector(
    (state: RootState) => state.tracker.selectedEffectCell
  );

  const patternId = song?.sequence[sequenceId] || 0;

  const [instrumentEditorTab, setInstrumentEditorTab] =
    useState<InstrumentEditorTab>("main");
  const onInstrumentEditorChange = useCallback((mode: InstrumentEditorTab) => {
    console.log(mode);
    setInstrumentEditorTab(mode);
  }, []);

  if (!song) {
    return null;
  }

  return (
    <Sidebar onClick={selectSidebar} multiColumn={multiColumn}>
      <SidebarColumn style={{ maxWidth: multiColumn ? 300 : undefined }}>
        <FormContainer>
          <FormHeader>
            <EditableText
              name="name"
              placeholder="Song"
              value={song?.name || ""}
              onChange={onChangeFieldInput("name")}
            />

            <DropdownButton
              size="small"
              variant="transparent"
              menuDirection="right"
            >
              <MenuItem onClick={onRemovePattern}>
                {l10n("MENU_PATTERN_DELETE")}
              </MenuItem>
            </DropdownButton>
          </FormHeader>

          <FormRow>
            <Label htmlFor="artist">{l10n("FIELD_ARTIST")}</Label>
          </FormRow>
          <FormRow>
            <Input
              name="artist"
              value={song?.artist}
              onChange={onChangeFieldInput("artist")}
            />
          </FormRow>
          <FormRow>
            <Label htmlFor="ticks_per_row">{l10n("FIELD_TEMPO")}</Label>
          </FormRow>
          <FormRow>
            <Input
              name="ticks_per_row"
              type="number"
              value={song?.ticks_per_row}
              min={0}
              max={20}
              onChange={onChangeFieldInput("ticks_per_row")}
              title={l10n("FIELD_TEMPO_TOOLTIP")}
            />
          </FormRow>
        </FormContainer>
      </SidebarColumn>
      <SidebarColumn>
        <FormContainer>
          {selectedEffectCell !== null ? (
            <PatternCellEditor
              id={selectedEffectCell}
              patternId={patternId}
              pattern={song?.patterns[patternId][selectedEffectCell]}
            />
          ) : instrumentData ? (
            <>
              {!multiColumn ? <FormDivider /> : ""}
              <FormHeader>
                <EditableText
                  name="instrumentName"
                  placeholder={instrumentName(
                    instrumentData,
                    selectedInstrument.type
                  )}
                  value={instrumentData.name || ""}
                  onChange={onChangeInstrumentName(selectedInstrument.type)}
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

              <StickyTabs>
                <TabBar
                  value={instrumentEditorTab}
                  values={instrumentEditorTabs}
                  onChange={onInstrumentEditorChange}
                  overflowActiveTab={instrumentEditorTab === "main"}
                />
              </StickyTabs>
              <InstrumentEditorWrapper>
                {instrumentEditorTab === "main" ? (
                  <SidebarColumn>
                    {renderInstrumentEditor(
                      selectedInstrument.type,
                      instrumentData,
                      song.waves
                    )}
                  </SidebarColumn>
                ) : (
                  <InstrumentSubpatternEditor
                    enabled={instrumentData.subpattern_enabled}
                    subpattern={instrumentData.subpattern}
                    instrumentId={instrumentData.index}
                    instrumentType={selectedInstrument.type}
                  />
                )}
              </InstrumentEditorWrapper>
            </>
          ) : (
            ""
          )}
        </FormContainer>
      </SidebarColumn>
    </Sidebar>
  );
};
