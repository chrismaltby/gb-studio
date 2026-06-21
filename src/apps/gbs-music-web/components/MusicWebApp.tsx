import React, { Suspense, lazy, useCallback, useEffect, useState } from "react";
import trackerActions from "store/features/tracker/trackerActions";
import styled from "styled-components";
import { saveSongFile } from "store/features/trackerDocument/trackerDocumentState";
import { webMusicEnvironment } from "gbs-music-web/lib/adapters";
import { MusicWebStatusBanner } from "gbs-music-web/components/MusicWebStatusBanner";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { musicSelectors } from "store/features/entities/entitiesSelectors";
import WebAPI from "gbs-music-web/lib/api";
import { ConfirmUnsavedChangesDialog } from "gbs-music-web/components/dialog/ConfirmUnsavedChangesDialog";
import { MusicWebSplash } from "gbs-music-web/components/MusicWebSplash";
import { useMusicWebUpdate } from "gbs-music-web/components/hooks/useMusicWebUpdate";
import { useUnsavedChangesGuard } from "gbs-music-web/components/hooks/useUnsavedChangesGuard";
import { useMusicWorkspace } from "gbs-music-web/components/hooks/useMusicWorkspace";
import { reloadMusicWebWithAlert } from "gbs-music-web/lib/reloadOnError";
import l10n from "shared/lib/lang/l10n";

const AppShell = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const AppContent = styled.div`
  flex: 1 1 0;
  min-height: 0;
  display: flex;
`;

const LoadingContent = styled.div`
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const recoverChunkLoad = (error: unknown) =>
  reloadMusicWebWithAlert(
    "GBS Music needs to reload to finish updating.",
    error,
  );

const StandaloneMusicPage = lazy(() =>
  import("gbs-music-web/components/StandaloneMusicPage").catch(
    recoverChunkLoad,
  ),
);
const MusicWebToolbar = lazy(async () =>
  import("gbs-music-web/components/MusicWebToolbar").catch(recoverChunkLoad),
);

export const MusicWebApp = () => {
  const dispatch = useAppDispatch();
  const { updateAvailable, reloadApp } = useMusicWebUpdate();
  const [themeId, setThemeId] = useState(WebAPI.getThemeId());
  const [localeId, setLocaleId] = useState(WebAPI.getLocaleId());
  const modified = useAppSelector((state) => state.tracker.modified);
  const currentSongName = useAppSelector((state) => {
    const currentId = state.tracker.selectedSongId;
    return musicSelectors.selectById(state, currentId)?.name ?? "";
  });
  const selectedSongId = useAppSelector(
    (state) => state.tracker.selectedSongId,
  );

  const saveCurrentSong = useCallback(async () => {
    const result = await dispatch(saveSongFile());
    return saveSongFile.fulfilled.match(result);
  }, [dispatch]);

  const {
    hasPendingAction,
    runWithUnsavedCheck,
    closeConfirm,
    saveAndContinue,
    discardAndContinue,
  } = useUnsavedChangesGuard({
    modified,
    save: saveCurrentSong,
  });
  useEffect(() => {
    webMusicEnvironment.setWindowTitle(
      currentSongName ? `GBS Music - ${currentSongName}` : "GBS Music",
    );
  }, [currentSongName]);

  const {
    singleDocumentMode,
    hasBackup,
    createSong,
    importSong,
    openDirectoryWorkspace,
    restoreBackupSong,
    openExample,
    closeWorkspace,
  } = useMusicWorkspace();

  const onSelectSong = useCallback(
    (nextSongId: string) => {
      if (nextSongId === selectedSongId) {
        return;
      }
      void runWithUnsavedCheck(async () => {
        dispatch(trackerActions.setSelectedSongId(nextSongId));
      });
    },
    [dispatch, runWithUnsavedCheck, selectedSongId],
  );

  const onThemeChange = useCallback((nextThemeId: string) => {
    WebAPI.setThemeId(nextThemeId);
    setThemeId(nextThemeId);
  }, []);

  const onLocaleChange = useCallback(async (nextLocaleId: string) => {
    await WebAPI.setLocaleId(nextLocaleId);
    setLocaleId(nextLocaleId);
  }, []);

  const allSongs = useAppSelector(musicSelectors.selectAll);
  const hasSongs = allSongs.length > 0;

  const onCreateSong = useCallback(
    (name: string, songArtist: string) => {
      void runWithUnsavedCheck(() => createSong({ name, artist: songArtist }));
    },
    [createSong, runWithUnsavedCheck],
  );

  const onAddSong = useCallback(() => {
    void runWithUnsavedCheck(() => createSong());
  }, [createSong, runWithUnsavedCheck]);

  const onImportSong = useCallback(() => {
    void runWithUnsavedCheck(importSong);
  }, [importSong, runWithUnsavedCheck]);

  const onOpenDirectoryWorkspace = useCallback(() => {
    void runWithUnsavedCheck(openDirectoryWorkspace);
  }, [openDirectoryWorkspace, runWithUnsavedCheck]);

  const onRestoreBackup = useCallback(() => {
    void runWithUnsavedCheck(restoreBackupSong);
  }, [restoreBackupSong, runWithUnsavedCheck]);

  const onOpenExample = useCallback(
    (name: string, filename: string, url: string) => {
      void runWithUnsavedCheck(() => openExample(name, filename, url));
    },
    [openExample, runWithUnsavedCheck],
  );

  const onCloseWorkspace = useCallback(() => {
    void runWithUnsavedCheck(closeWorkspace);
  }, [closeWorkspace, runWithUnsavedCheck]);

  return (
    <AppShell
      data-id="app-shell"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {updateAvailable ? (
        <MusicWebStatusBanner
          title={l10n("DIALOG_UPDATE_AVAILABLE")}
          actionLabel={l10n("DIALOG_OK")}
          onAction={reloadApp}
        />
      ) : null}
      {hasSongs ? (
        <Suspense fallback={null}>
          <MusicWebToolbar
            themeId={themeId}
            localeId={localeId}
            onThemeChange={onThemeChange}
            onLocaleChange={onLocaleChange}
            onCreateSong={onAddSong}
            onImportSong={onImportSong}
            onOpenDirectoryWorkspace={
              singleDocumentMode ? undefined : onOpenDirectoryWorkspace
            }
            onCloseWorkspace={onCloseWorkspace}
          />
        </Suspense>
      ) : null}
      <AppContent data-id="app-content">
        {hasSongs ? (
          <Suspense
            fallback={<LoadingContent>{l10n("FIELD_LOADING")}</LoadingContent>}
          >
            <StandaloneMusicPage
              localeId={localeId}
              onCreateSong={onAddSong}
              onImportSong={onImportSong}
              onOpenDirectoryWorkspace={onOpenDirectoryWorkspace}
              onSelectSong={onSelectSong}
            />
          </Suspense>
        ) : (
          <MusicWebSplash
            themeId={themeId}
            localeId={localeId}
            onThemeChange={onThemeChange}
            onLocaleChange={onLocaleChange}
            onCreateSong={onCreateSong}
            onImportSong={onImportSong}
            onOpenDirectoryWorkspace={
              singleDocumentMode ? undefined : onOpenDirectoryWorkspace
            }
            onRestoreBackup={hasBackup ? onRestoreBackup : undefined}
            onOpenExample={onOpenExample}
          />
        )}
      </AppContent>
      {hasPendingAction ? (
        <ConfirmUnsavedChangesDialog
          filename={currentSongName}
          onCancel={closeConfirm}
          onSave={saveAndContinue}
          onDiscard={discardAndContinue}
        />
      ) : null}
    </AppShell>
  );
};
