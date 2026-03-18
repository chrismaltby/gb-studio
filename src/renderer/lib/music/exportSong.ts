import API from "renderer/lib/api";
import l10n from "shared/lib/lang/l10n";
import {
  ERROR_TIMED_OUT,
  ERROR_AUDIO_ENCODE_FAILED,
} from "shared/lib/music/constants";
import { MusicExportFormat } from "shared/lib/music/types";
import { Song } from "shared/lib/uge/types";

const exportMimeTypes: Record<MusicExportFormat, string> = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
  flac: "audio/flac",
};

const exportSong = (
  song: Song,
  format: MusicExportFormat,
  loopCount: number,
) => {
  return new Promise<{
    format: MusicExportFormat;
    data: Uint8Array;
  }>((resolve, reject) => {
    const requestId = `request_${Math.random()}`;

    const timeout = window.setTimeout(() => {
      unsubscribe();
      reject(new Error(l10n("ERROR_TIMED_OUT")));
    }, 120000);

    const unsubscribe = API.events.music.response.subscribe((_, data) => {
      if (data.action === "exported-song" && data.requestId === requestId) {
        window.clearTimeout(timeout);
        unsubscribe();
        resolve({
          format: data.format,
          data: data.data,
        });
      } else if (
        data.action === "export-failed" &&
        data.requestId === requestId
      ) {
        window.clearTimeout(timeout);
        unsubscribe();
        reject(new Error(data.message));
      }
    });

    API.music.sendToMusicWindow({
      requestId,
      action: "export-song",
      song,
      format,
      loopCount,
    });
  });
};

export const downloadExportedSong = async (
  song: Song,
  format: MusicExportFormat,
  loopCount: number,
  filename: string,
) => {
  if (!song) {
    return;
  }
  try {
    const exportedData = await exportSong(song, format, loopCount);
    const blob = new Blob([new Uint8Array(exportedData.data)], {
      type: exportMimeTypes[exportedData.format],
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    let displayMessage = message;
    if (message === ERROR_TIMED_OUT) {
      displayMessage = l10n("ERROR_TIMED_OUT");
    } else if (message === ERROR_AUDIO_ENCODE_FAILED) {
      displayMessage = l10n("ERROR_AUDIO_ENCODE_FAILED");
    }
    API.dialog.showError(
      l10n("ERROR_EXPORT_FILE_FAILED", { filetype: format }),
      displayMessage,
    );
  }
};
