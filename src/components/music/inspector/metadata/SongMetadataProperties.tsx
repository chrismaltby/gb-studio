import React, { useCallback, useEffect, useState } from "react";
import {
  FormColumn,
  FormColumns,
  FormHeader,
  FormRow,
} from "ui/form/layout/FormLayout";
import { SidebarColumn, SidebarColumns } from "ui/sidebars/Sidebar";
import { Label } from "ui/form/Label";
import { Input } from "ui/form/Input";
import { Song } from "shared/lib/uge/types";
import { castEventToInt } from "renderer/lib/helpers/castEventValue";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { NumberInput } from "ui/form/NumberInput";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { getBaseName } from "shared/lib/helpers/virtualFilesystem";
import {
  InputGroup,
  InputGroupAppend,
  InputGroupLabel,
} from "ui/form/InputGroup";
import { getBPM } from "shared/lib/uge/display";
import l10n from "shared/lib/lang/l10n";
import { EditableText, EditableTextOverlay } from "ui/form/EditableText";
import { FlexGrow } from "ui/spacing/Spacing";
import projectActions from "store/features/project/projectActions";
import { stripInvalidPathCharacters } from "shared/lib/helpers/stripInvalidFilenameCharacters";
import { musicSelectors } from "store/features/entities/entitiesSelectors";

export const SongMetadataProperties = () => {
  const dispatch = useAppDispatch();

  const hasSong = useAppSelector(
    (state) => !!state.trackerDocument.present.song,
  );

  const songName = useAppSelector(
    (state) => state.trackerDocument.present.song?.name ?? "",
  );

  const songArtist = useAppSelector(
    (state) => state.trackerDocument.present.song?.artist ?? "",
  );

  const ticksPerRow = useAppSelector(
    (state) => state.trackerDocument.present.song?.ticksPerRow ?? 0,
  );

  const selectedSongId = useAppSelector(
    (state) => state.tracker.selectedSongId,
  );

  const musicAsset = useAppSelector((state) =>
    musicSelectors.selectById(state, selectedSongId),
  );

  const onChangeSongProp = useCallback(
    <K extends keyof Song>(key: K, value: Song[K]) => {
      dispatch(
        trackerDocumentActions.editSong({
          changes: {
            [key]: value,
          },
        }),
      );
    },
    [dispatch],
  );

  const onChangeName = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSongProp("name", e.currentTarget.value),
    [onChangeSongProp],
  );

  const onChangeArtist = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSongProp("artist", e.currentTarget.value),
    [onChangeSongProp],
  );

  const onChangeTicksPerRow = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSongProp("ticksPerRow", castEventToInt(e, 0)),
    [onChangeSongProp],
  );

  const [localFilename, setLocalFilename] = useState(
    musicAsset?.filename.replace(/\.uge$/i, "") ?? "",
  );

  useEffect(() => {
    setLocalFilename(musicAsset?.filename.replace(/\.uge$/i, "") ?? "");
  }, [musicAsset?.filename]);

  const onRenameFile = useCallback(() => {
    const currentFilename = musicAsset?.filename.replace(/\.[^.]+$/i, "") ?? "";
    const sanitizedFilename = stripInvalidPathCharacters(localFilename).trim();

    if (
      !selectedSongId ||
      !sanitizedFilename ||
      sanitizedFilename === currentFilename
    ) {
      setLocalFilename(currentFilename);
      return;
    }

    dispatch(
      projectActions.renameMusicAsset({
        musicId: selectedSongId,
        newFilename: sanitizedFilename,
      }),
    );
  }, [dispatch, localFilename, selectedSongId, musicAsset?.filename]);

  const onRenameFileOnEnter = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.code === "Enter") {
        e.currentTarget.blur();
      }
    },
    [],
  );

  if (!hasSong || !musicAsset) {
    return null;
  }

  return (
    <>
      <FormHeader>
        <FlexGrow style={{ minWidth: 0 }}>
          <EditableText
            name="name"
            placeholder={getBaseName(musicAsset.filename)}
            value={localFilename}
            onChange={(e) => setLocalFilename(e.currentTarget.value)}
            onBlur={onRenameFile}
            onKeyDown={onRenameFileOnEnter}
            autoComplete="off"
          />
          <EditableTextOverlay>
            {getBaseName(musicAsset.filename)}
          </EditableTextOverlay>
        </FlexGrow>
      </FormHeader>
      <SidebarColumns>
        <SidebarColumn>
          <FormColumns>
            <FormColumn>
              <Label htmlFor="name">{l10n("FIELD_NAME")}</Label>
              <Input
                id="name"
                name="name"
                placeholder={l10n("FIELD_SONG")}
                value={songName}
                onChange={onChangeName}
                autoComplete="off"
              />
            </FormColumn>
            <FormColumn>
              <Label htmlFor="artist">{l10n("FIELD_ARTIST")}</Label>

              <Input
                id="artist"
                name="artist"
                placeholder={l10n("FIELD_ARTIST")}
                value={songArtist}
                onChange={onChangeArtist}
                autoComplete="off"
              />
            </FormColumn>
          </FormColumns>
        </SidebarColumn>
        <SidebarColumn>
          <FormRow>
            <Label htmlFor="ticksPerRow">
              {l10n("FIELD_TEMPO")} ({l10n("FIELD_TICKS_PER_ROW")})
            </Label>
          </FormRow>
          <FormRow>
            <InputGroup>
              <NumberInput
                id="ticksPerRow"
                name="ticksPerRow"
                type="number"
                value={ticksPerRow}
                min={1}
                max={20}
                placeholder="1"
                onChange={onChangeTicksPerRow}
                title={l10n("FIELD_TEMPO_TOOLTIP")}
                pattern="\d*"
              />
              <InputGroupAppend>
                <InputGroupLabel
                  htmlFor="ticksPerRow"
                  style={{ minWidth: 70, justifyContent: "flex-end" }}
                >
                  ~{Math.round(getBPM(ticksPerRow))} BPM
                </InputGroupLabel>
              </InputGroupAppend>
            </InputGroup>
          </FormRow>
        </SidebarColumn>
      </SidebarColumns>
    </>
  );
};
