import React, { useCallback, useMemo } from "react";
import { FormDivider, FormRow } from "ui/form/layout/FormLayout";
import { useAppDispatch, useAppSelector, useAppStore } from "store/hooks";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { Button } from "ui/buttons/Button";
import { ButtonGroup } from "ui/buttons/ButtonGroup";
import { Label } from "ui/form/Label";
import l10n from "shared/lib/lang/l10n";
import { getPatternCellSelectionValue } from "shared/lib/uge/editor/helpers";
import { InstrumentSelect } from "components/music/form/InstrumentSelect";
import { PitchSelect } from "components/music/form/PitchSelect";
import { EffectCodeSelect } from "components/music/form/EffectCodeSelect";
import { PatternCellAddress } from "shared/lib/uge/editor/types";
import { Pattern, PatternCell, SequenceItem } from "shared/lib/uge/types";
import { EffectParamsForm } from "components/music/form/EffectParamsForm";
import {
  InstrumentIcon,
  MinusSmallIcon,
  PlusSmallIcon,
  TrashIcon,
} from "ui/icons/Icons";
import trackerActions from "store/features/tracker/trackerActions";
import {
  channelIdToInstrumentType,
  transposeNoteValue,
} from "shared/lib/uge/display";
import { InputGroup, InputGroupAppend } from "ui/form/InputGroup";
import { useMusicNotePreview } from "components/music/hooks/useMusicNotePreview";
import { OCTAVE_SIZE } from "consts";
import { useDebouncedValue } from "ui/hooks/use-debounced-value";

const getSharedValue = <T extends keyof PatternCell>(
  sequence: SequenceItem[] | undefined,
  patterns: Pattern[] | undefined,
  selectedPatternCells: PatternCellAddress[],
  field: T,
) => {
  if (!sequence || !patterns || selectedPatternCells.length === 0) {
    return { type: "none", value: null } as const;
  }
  return getPatternCellSelectionValue(
    sequence,
    patterns,
    selectedPatternCells,
    (cell) => cell[field],
  );
};

export const PatternCellSelectionProperties = () => {
  const store = useAppStore();
  const dispatch = useAppDispatch();
  const playPreview = useMusicNotePreview();

  const sequence = useAppSelector(
    (state) => state.trackerDocument.present.song?.sequence,
  );

  const patterns = useAppSelector(
    (state) => state.trackerDocument.present.song?.patterns,
  );

  const currentSelectedPatternCells = useAppSelector(
    (state) => state.tracker.selectedPatternCells,
  );

  const selectedPatternCells = useDebouncedValue(
    currentSelectedPatternCells,
    100,
  );

  const firstChannelId = useMemo(
    () =>
      selectedPatternCells.length > 0 ? selectedPatternCells[0].channelId : 0,
    [selectedPatternCells],
  );

  const selectedInstrumentId = useAppSelector(
    (state) => state.tracker.selectedInstrumentId,
  );

  const sharedNote = useMemo(
    () => getSharedValue(sequence, patterns, selectedPatternCells, "note"),
    [patterns, selectedPatternCells, sequence],
  );

  const sharedInstrumentId = useMemo(
    () =>
      getSharedValue(sequence, patterns, selectedPatternCells, "instrument"),
    [patterns, selectedPatternCells, sequence],
  );

  const sharedEffectCode = useMemo(
    () =>
      getSharedValue(sequence, patterns, selectedPatternCells, "effectCode"),
    [patterns, selectedPatternCells, sequence],
  );

  const sharedEffectParam = useMemo(
    () =>
      getSharedValue(sequence, patterns, selectedPatternCells, "effectParam"),
    [patterns, selectedPatternCells, sequence],
  );

  const onViewInstrument = useCallback(() => {
    if (
      sharedInstrumentId.type === "shared" &&
      sharedInstrumentId.value !== null
    ) {
      dispatch(
        trackerActions.setSelectedInstrument({
          id: String(sharedInstrumentId.value),
          type: channelIdToInstrumentType(firstChannelId),
        }),
      );
      dispatch(trackerActions.setSidebarView("instrument"));
      dispatch(trackerActions.setMobileOverlayView("instrument"));
    }
  }, [
    dispatch,
    firstChannelId,
    sharedInstrumentId.type,
    sharedInstrumentId.value,
  ]);

  const onChangeInstrument = useCallback(
    (instrumentId: number) => {
      const state = store.getState();
      const song = state.trackerDocument.present.song;
      if (!song) {
        return;
      }
      const sequence = song.sequence;
      const patterns = song.patterns;
      const selectedPatternCells = state.tracker.selectedPatternCells;
      const firstChannelId =
        selectedPatternCells.length > 0 ? selectedPatternCells[0].channelId : 0;

      const sharedNote = getSharedValue(
        sequence,
        patterns,
        selectedPatternCells,
        "note",
      );
      const sharedEffectCode = getSharedValue(
        sequence,
        patterns,
        selectedPatternCells,
        "effectCode",
      );
      const sharedEffectParam = getSharedValue(
        sequence,
        patterns,
        selectedPatternCells,
        "effectParam",
      );

      dispatch(
        trackerDocumentActions.changeInstrumentAbsoluteCells({
          patternCells: selectedPatternCells,
          instrumentId,
        }),
      );
      playPreview({
        channelId: firstChannelId,
        note: sharedNote.value ?? undefined,
        instrumentId,
        effectCode: sharedEffectCode.value ?? undefined,
        effectParam: sharedEffectParam.value ?? undefined,
      });
    },
    [dispatch, playPreview, store],
  );

  return (
    <>
      <FormRow>
        <Label>{l10n("FIELD_PITCH")}</Label>
      </FormRow>
      <FormRow>
        <PitchSelect
          name="note"
          value={sharedNote.value ?? undefined}
          onChange={(note) => {
            dispatch(
              trackerDocumentActions.changeNoteAbsoluteCells({
                patternCells: selectedPatternCells,
                note,
              }),
            );
            if (sharedInstrumentId.type === "none") {
              dispatch(
                trackerDocumentActions.changeInstrumentAbsoluteCells({
                  patternCells: selectedPatternCells,
                  instrumentId: selectedInstrumentId,
                }),
              );
            }
            playPreview({
              channelId: firstChannelId,
              note,
              instrumentId: sharedInstrumentId.value ?? undefined,
              effectCode: sharedEffectCode.value ?? undefined,
              effectParam: sharedEffectParam.value ?? undefined,
            });
          }}
          noneLabel={
            sharedNote.type === "multiple"
              ? l10n("FIELD_MULTIPLE_VALUES")
              : l10n("FIELD_NONE")
          }
        />
      </FormRow>

      <FormRow>
        <Label>{l10n("FIELD_INSTRUMENT")}</Label>
      </FormRow>
      <FormRow>
        <InputGroup>
          <InstrumentSelect
            name="instrument"
            value={sharedInstrumentId.value ?? undefined}
            onChange={onChangeInstrument}
            noneLabel={
              sharedInstrumentId.type === "multiple"
                ? l10n("FIELD_MULTIPLE_VALUES")
                : l10n("FIELD_NONE")
            }
          />
          {sharedInstrumentId.type === "shared" &&
            sharedInstrumentId.value !== null && (
              <InputGroupAppend>
                <Button onClick={onViewInstrument} title="Edit Instrument">
                  <InstrumentIcon />
                </Button>
              </InputGroupAppend>
            )}
        </InputGroup>
      </FormRow>

      <FormRow>
        <Label>{l10n("FIELD_EFFECT")}</Label>
      </FormRow>
      <FormRow>
        <EffectCodeSelect
          name="effectCode"
          value={sharedEffectCode.value ?? undefined}
          onChange={(effectCode, effectParam) => {
            dispatch(
              trackerDocumentActions.editPatternCells({
                patternCells: selectedPatternCells,
                changes: {
                  effectCode: effectCode,
                  effectParam: effectCode === null ? null : effectParam,
                },
              }),
            );
            playPreview({
              channelId: firstChannelId,
              note: sharedNote.value ?? undefined,
              instrumentId: sharedInstrumentId.value ?? undefined,
              effectCode,
              effectParam,
            });
          }}
          noneLabel={
            sharedEffectCode.type === "multiple"
              ? l10n("FIELD_MULTIPLE_VALUES")
              : l10n("FIELD_NONE")
          }
        />
      </FormRow>

      {sharedEffectCode.type === "shared" && (
        <EffectParamsForm
          effectCode={sharedEffectCode.value ?? undefined}
          value={sharedEffectParam.value ?? undefined}
          note={sharedNote.value ?? undefined}
          onChange={(newEffectParam) => {
            dispatch(
              trackerDocumentActions.editPatternCells({
                patternCells: selectedPatternCells,
                changes: {
                  effectParam: newEffectParam,
                },
              }),
            );
            playPreview({
              channelId: firstChannelId,
              note: sharedNote.value ?? undefined,
              instrumentId: sharedInstrumentId.value ?? undefined,
              effectCode: sharedEffectCode.value ?? undefined,
              effectParam: newEffectParam ?? undefined,
            });
          }}
          onChangeNote={(newNote) => {
            dispatch(
              trackerDocumentActions.editPatternCells({
                patternCells: selectedPatternCells,
                changes: {
                  note: newNote,
                },
              }),
            );
            playPreview({
              channelId: firstChannelId,
              note: newNote ?? undefined,
              instrumentId: sharedInstrumentId.value ?? undefined,
              effectCode: sharedEffectCode.value ?? undefined,
              effectParam: sharedEffectParam.value ?? undefined,
            });
          }}
        />
      )}
      <FormDivider />
      {(sharedNote.type !== "none" || sharedEffectCode.type !== "none") && (
        <FormRow>
          {sharedNote.type !== "none" && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                maxWidth: "calc(100% - 60px)",
              }}
            >
              <div>
                <Label>{l10n("FIELD_SEMITONE")}</Label>
                <ButtonGroup>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      dispatch(
                        trackerDocumentActions.transposeAbsoluteCells({
                          patternCells: selectedPatternCells,
                          direction: "down",
                          size: "note",
                        }),
                      );
                      if (
                        sharedNote.type === "shared" &&
                        typeof sharedNote.value === "number"
                      ) {
                        playPreview({
                          channelId: firstChannelId,
                          note:
                            transposeNoteValue(sharedNote.value, -1) ??
                            undefined,
                          instrumentId: sharedInstrumentId.value ?? undefined,
                          effectCode: sharedEffectCode.value ?? undefined,
                          effectParam: sharedEffectParam.value ?? undefined,
                        });
                      }
                    }}
                  >
                    <MinusSmallIcon />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      dispatch(
                        trackerDocumentActions.transposeAbsoluteCells({
                          patternCells: selectedPatternCells,
                          direction: "up",
                          size: "note",
                        }),
                      );
                      if (
                        sharedNote.type === "shared" &&
                        typeof sharedNote.value === "number"
                      ) {
                        playPreview({
                          channelId: firstChannelId,
                          note:
                            transposeNoteValue(sharedNote.value, 1) ??
                            undefined,
                          instrumentId: sharedInstrumentId.value ?? undefined,
                          effectCode: sharedEffectCode.value ?? undefined,
                          effectParam: sharedEffectParam.value ?? undefined,
                        });
                      }
                    }}
                  >
                    <PlusSmallIcon />
                  </Button>
                </ButtonGroup>
              </div>
              <div>
                <Label>{l10n("FIELD_OCTAVE")}</Label>
                <ButtonGroup>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      dispatch(
                        trackerDocumentActions.transposeAbsoluteCells({
                          patternCells: selectedPatternCells,
                          direction: "down",
                          size: "octave",
                        }),
                      );
                      if (
                        sharedNote.type === "shared" &&
                        typeof sharedNote.value === "number"
                      ) {
                        playPreview({
                          channelId: firstChannelId,
                          note:
                            transposeNoteValue(
                              sharedNote.value,
                              -OCTAVE_SIZE,
                            ) ?? undefined,
                          instrumentId: sharedInstrumentId.value ?? undefined,
                          effectCode: sharedEffectCode.value ?? undefined,
                          effectParam: sharedEffectParam.value ?? undefined,
                        });
                      }
                    }}
                  >
                    <MinusSmallIcon />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      dispatch(
                        trackerDocumentActions.transposeAbsoluteCells({
                          patternCells: selectedPatternCells,
                          direction: "up",
                          size: "octave",
                        }),
                      );
                      if (
                        sharedNote.type === "shared" &&
                        typeof sharedNote.value === "number"
                      ) {
                        playPreview({
                          channelId: firstChannelId,
                          note:
                            transposeNoteValue(sharedNote.value, OCTAVE_SIZE) ??
                            undefined,
                          instrumentId: sharedInstrumentId.value ?? undefined,
                          effectCode: sharedEffectCode.value ?? undefined,
                          effectParam: sharedEffectParam.value ?? undefined,
                        });
                      }
                    }}
                  >
                    <PlusSmallIcon />
                  </Button>
                </ButtonGroup>
              </div>
              {selectedPatternCells.length > 1 && (
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      dispatch(
                        trackerDocumentActions.interpolateAbsoluteCells({
                          patternCells: selectedPatternCells,
                        }),
                      );
                    }}
                  >
                    {l10n("FIELD_INTERPOLATE")}
                  </Button>
                </div>
              )}
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-end",
              flexGrow: 1,
            }}
          >
            <Button
              onClick={(e) => {
                e.preventDefault();
                dispatch(
                  trackerDocumentActions.clearAbsoluteCells({
                    patternCells: selectedPatternCells,
                  }),
                );
              }}
            >
              <TrashIcon />
            </Button>
          </div>
        </FormRow>
      )}
    </>
  );
};
