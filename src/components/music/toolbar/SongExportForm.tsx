import React, { useCallback } from "react";
import trackerActions from "store/features/tracker/trackerActions";
import { Button } from "ui/buttons/Button";
import { ToggleButtonGroup } from "ui/form/ToggleButtonGroup";
import { NumberField } from "ui/form/NumberField";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { MusicExportFormat } from "shared/lib/music/types";
import { downloadExportedSong } from "renderer/lib/music/exportSong";
import { FormField, FormRow } from "ui/form/layout/FormLayout";
import { StyledExportPanel } from "./style";
import { MAX_EXPORT_LOOPS, MIN_EXPORT_LOOPS } from "shared/lib/music/constants";
import l10n from "shared/lib/lang/l10n";

interface SongExportFormProps {
  name?: string;
}

const musicExportFormats: MusicExportFormat[] = ["mp3", "flac", "wav"];
const exportFormatOptions = musicExportFormats.map((format) => ({
  value: format,
  label: format.toLocaleUpperCase(),
}));

const noop = () => {};

const SongExportForm = ({ name }: SongExportFormProps) => {
  const dispatch = useAppDispatch();

  const song = useAppSelector((state) => state.trackerDocument.present.song);
  const exporting = useAppSelector((state) => state.tracker.exporting);
  const exportFormat = useAppSelector((state) => state.tracker.exportFormat);
  const exportLoopCount = useAppSelector(
    (state) => state.tracker.exportLoopCount,
  );

  const exportSong = useCallback(
    async (format: MusicExportFormat, loopCount: number) => {
      if (!song) {
        return;
      }

      const filename = `${(name || "song").replace(
        /\.[^.]+$/,
        "",
      )}${loopCount > 1 ? `-loop-x${loopCount}` : ""}.${format}`;

      dispatch(trackerActions.setExporting(true));
      try {
        await downloadExportedSong(song, format, loopCount, filename);
      } finally {
        dispatch(trackerActions.setExporting(false));
      }
    },
    [dispatch, name, song],
  );

  const setMusicExportSettings = useCallback(
    (format: MusicExportFormat, loopCount: number) => {
      dispatch(trackerActions.setExportSettings({ format, loopCount }));
    },
    [dispatch],
  );

  const onChangeExportFormat = useCallback(
    (newFormat: MusicExportFormat) => {
      setMusicExportSettings(newFormat, exportLoopCount);
    },
    [exportLoopCount, setMusicExportSettings],
  );

  const onChangeExportLoopCount = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = parseInt(event.currentTarget.value, 10);
      if (Number.isNaN(nextValue)) {
        return;
      }
      setMusicExportSettings(exportFormat, nextValue);
    },
    [exportFormat, setMusicExportSettings],
  );

  const onSubmitExportPanel = useCallback(async () => {
    await exportSong(exportFormat, exportLoopCount);
  }, [exportFormat, exportLoopCount, exportSong]);

  return (
    <StyledExportPanel>
      <FormRow>
        <FormField label={l10n("FIELD_FILE_FORMAT")} name={"exportFormat"}>
          <ToggleButtonGroup
            name="exportFormat"
            value={exportFormat}
            options={exportFormatOptions}
            onChange={onChangeExportFormat}
          />
        </FormField>
      </FormRow>
      <FormRow>
        <NumberField
          name="exportLoopCount"
          label={l10n("FIELD_LOOPS")}
          value={exportLoopCount}
          min={MIN_EXPORT_LOOPS}
          max={MAX_EXPORT_LOOPS}
          onChange={onChangeExportLoopCount}
        />
      </FormRow>
      <FormRow>
        {exporting ? (
          <Button disabled onClick={noop}>
            {l10n("FIELD_EXPORTING")}
          </Button>
        ) : (
          <Button onClick={onSubmitExportPanel}>
            {l10n("FIELD_EXPORT_SONG")}
          </Button>
        )}
      </FormRow>
    </StyledExportPanel>
  );
};

export default SongExportForm;
