import { useCallback, useRef, useState } from "react";
import {
  createMusicWorkspace,
  MusicDocumentReference,
  MusicWorkspace,
} from "shared/lib/music/workspace";
import trackerActions from "store/features/tracker/trackerActions";
import {
  createTemplateMusicDocument,
  importMusicDocument,
  registerExampleData,
  resetMusicWorkspaceAdapterState,
  registerSongBackupData,
  supportsPersistentSave,
  webMusicEnvironment,
} from "gbs-music-web/lib/adapters";
import { musicAssetActions } from "gbs-music-web/store/features/musicAssets/musicAssetsState";
import { musicWorkspaceToAssets } from "gbs-music-web/store/features/musicAssets/musicAssetsHelpers";
import { useAppDispatch } from "store/hooks";
import {
  BACKUP_SONG_KEY,
  deserializeSong,
  getBackupInfo,
} from "gbs-music-web/lib/songBackup";
import API from "renderer/lib/api";
import l10n from "shared/lib/lang/l10n";
import templateUgeUrl from "gbs-music-web/data/template.uge";

const toSafeBaseName = (name: string) =>
  name.replace(/[/\\]/g, "").trim() || l10n("FIELD_NEW_SONG");

const sortDocuments = (documents: MusicDocumentReference[]) =>
  [...documents].sort((a, b) =>
    a.filename.localeCompare(b.filename, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

const appendWorkspaceDocument = (
  workspace: MusicWorkspace | undefined,
  document: MusicDocumentReference,
) => {
  if (!workspace) {
    return createMusicWorkspace({
      source: "browser",
      openMode: "file",
      activeDocumentId: document.id,
      documents: [document],
    });
  }

  const existingDocuments = workspace.documents.filter(
    (item) => item.id !== document.id,
  );

  return createMusicWorkspace({
    ...workspace,
    documents: sortDocuments([...existingDocuments, document]),
    activeDocumentId: document.id,
  });
};

interface UseMusicWorkspaceResult {
  singleDocumentMode: boolean;
  hasBackup: boolean;
  backupSongName: string;
  createSong: (options?: { name?: string; artist?: string }) => Promise<void>;
  importSong: () => Promise<void>;
  openDirectoryWorkspace: () => Promise<void>;
  restoreBackupSong: () => Promise<void>;
  openExample: (name: string, filename: string, url: string) => Promise<void>;
  closeWorkspace: () => void;
}

export const useMusicWorkspace = (): UseMusicWorkspaceResult => {
  const dispatch = useAppDispatch();
  const [workspace, setWorkspace] = useState<MusicWorkspace>();
  const templateSongDataPromiseRef = useRef<Promise<Uint8Array> | undefined>(
    undefined,
  );
  const singleDocumentMode = !supportsPersistentSave();

  const backupInfo = getBackupInfo();
  const hasBackup = backupInfo !== null;
  const backupSongName = backupInfo?.name ?? "";

  const applyWorkspace = useCallback(
    (nextWorkspace: MusicWorkspace) => {
      setWorkspace(nextWorkspace);
      dispatch(
        musicAssetActions.setMusicAssets(musicWorkspaceToAssets(nextWorkspace)),
      );
      dispatch(
        trackerActions.setSelectedSongId(nextWorkspace.activeDocumentId ?? ""),
      );
    },
    [dispatch],
  );

  const closeWorkspace = useCallback(() => {
    API.music.sendToMusicWindow({
      action: "stop",
    });
    resetMusicWorkspaceAdapterState();
    setWorkspace(undefined);
    dispatch(musicAssetActions.setMusicAssets([]));
    dispatch(trackerActions.reset());
  }, [dispatch]);

  const loadTemplateSongData = useCallback(async () => {
    if (!templateSongDataPromiseRef.current) {
      templateSongDataPromiseRef.current = fetch(templateUgeUrl).then(
        async (response) => {
          if (!response.ok) {
            throw new Error("Failed to load template song.");
          }

          return new Uint8Array(await response.arrayBuffer());
        },
      );
    }

    return Uint8Array.from(await templateSongDataPromiseRef.current);
  }, []);

  const openMusicWorkspace = useCallback(
    async (mode: "file" | "directory") => {
      try {
        const nextWorkspace =
          mode === "file"
            ? await webMusicEnvironment.openFileWorkspace?.()
            : await webMusicEnvironment.openDirectoryWorkspace?.();

        if (!nextWorkspace) {
          return;
        }

        if (nextWorkspace.documents.length === 0) {
          const templateSongData = await loadTemplateSongData();
          const document = await createTemplateMusicDocument(
            templateSongData,
            nextWorkspace,
          );

          if (!document) {
            return;
          }
          applyWorkspace(appendWorkspaceDocument(nextWorkspace, document));
          return;
        }

        applyWorkspace(nextWorkspace);
      } catch (error) {
        if (!isAbortError(error)) {
          throw error;
        }
      }
    },
    [applyWorkspace, loadTemplateSongData],
  );

  const createSong = useCallback(
    async (options?: { name?: string; artist?: string }) => {
      const songName = options?.name?.trim() || l10n("FIELD_NEW_SONG");
      const songArtist =
        options?.artist !== undefined ? options.artist : l10n("FIELD_ARTIST");
      const baseName = toSafeBaseName(songName);
      const templateSongData = await loadTemplateSongData();

      // Stamp the template UGE data with the requested name and artist before
      // writing it to disk / the in-memory store.
      const { loadUGESong, saveUGESong } =
        await import("shared/lib/uge/ugeHelper");
      const song = loadUGESong(Buffer.from(templateSongData));
      song.name = songName;
      song.artist = songArtist;
      song.filename = baseName;
      const stampedData = new Uint8Array(saveUGESong(song));

      const document = await createTemplateMusicDocument(
        stampedData,
        workspace,
        baseName,
      );

      if (!document) {
        return;
      }

      const nextWorkspace = singleDocumentMode
        ? createMusicWorkspace({
            source: "browser",
            openMode: "file",
            activeDocumentId: document.id,
            documents: [document],
          })
        : appendWorkspaceDocument(workspace, document);

      applyWorkspace(nextWorkspace);
    },
    [applyWorkspace, loadTemplateSongData, singleDocumentMode, workspace],
  );

  const importSong = useCallback(async () => {
    if (singleDocumentMode) {
      await openMusicWorkspace("file");
      return;
    }

    const document = await importMusicDocument();
    if (!document) {
      return;
    }

    const nextWorkspace = appendWorkspaceDocument(workspace, document);
    applyWorkspace(nextWorkspace);
  }, [applyWorkspace, openMusicWorkspace, singleDocumentMode, workspace]);

  const openDirectoryWorkspace = useCallback(async () => {
    if (singleDocumentMode) {
      return;
    }

    await openMusicWorkspace("directory");
  }, [openMusicWorkspace, singleDocumentMode]);

  const restoreBackupSong = useCallback(async () => {
    const json = localStorage.getItem(BACKUP_SONG_KEY);
    if (!json) {
      return;
    }

    const song = deserializeSong(json);
    if (!song) {
      return;
    }

    const { saveUGESong } = await import("shared/lib/uge/ugeHelper");
    const data = new Uint8Array(saveUGESong(song));

    const name = song.name || "Backup";
    const filename = song.filename || "backup.uge";
    const reference = registerSongBackupData(data, name, filename);

    const nextWorkspace = createMusicWorkspace({
      source: "browser",
      openMode: "file",
      activeDocumentId: reference.id,
      documents: [reference],
    });

    applyWorkspace(nextWorkspace);
  }, [applyWorkspace]);

  const openExample = useCallback(
    async (name: string, filename: string, url: string) => {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const data = new Uint8Array(buffer);
      const reference = registerExampleData(data, name, filename);
      const nextWorkspace = createMusicWorkspace({
        source: "browser",
        openMode: "file",
        activeDocumentId: reference.id,
        documents: [reference],
      });
      applyWorkspace(nextWorkspace);
    },
    [applyWorkspace],
  );

  return {
    singleDocumentMode,
    hasBackup,
    backupSongName,
    createSong,
    importSong,
    openDirectoryWorkspace,
    restoreBackupSong,
    openExample,
    closeWorkspace,
  };
};
