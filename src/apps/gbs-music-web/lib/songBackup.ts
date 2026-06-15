import { isSong, type Song } from "shared/lib/uge/types";

export const BACKUP_SONG_KEY = "gbsMusicWeb:song.bck";
export const BACKUP_TIMESTAMP_KEY = "gbsMusicWeb:song.bck.timestamp";

const UINT8_TAG = "__uint8array";

// JSON replacer that converts Uint8Array to a tagged plain object so it can
// survive a JSON round-trip without being silently mangled into {0:…, 1:…}.
const songReplacer = (_key: string, value: unknown): unknown => {
  if (value instanceof Uint8Array) {
    return { [UINT8_TAG]: Array.from(value) };
  }
  return value;
};

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === "number");

// Paired JSON reviver that reconstructs Uint8Arrays from the tagged form.
const songReviver = (_key: string, value: unknown): unknown => {
  if (
    value !== null &&
    typeof value === "object" &&
    UINT8_TAG in (value as Record<string, unknown>)
  ) {
    const taggedValue = (value as Record<string, unknown>)[UINT8_TAG];
    if (isNumberArray(taggedValue)) {
      return new Uint8Array(taggedValue);
    }
  }
  return value;
};

export const serializeSong = (song: Song): string =>
  JSON.stringify(song, songReplacer);

export const deserializeSong = (json: string): Song | null => {
  try {
    const data: unknown = JSON.parse(json, songReviver);
    return isSong(data) ? data : null;
  } catch {
    return null;
  }
};

interface BackupInfo {
  name: string;
  filename: string;
  timestamp: number;
}

/** Returns metadata about the stored backup without fully deserialising the song. */
export const getBackupInfo = (): BackupInfo | null => {
  try {
    const json = localStorage.getItem(BACKUP_SONG_KEY);
    if (!json) return null;
    const parsed = deserializeSong(json);
    if (!parsed) {
      return null;
    }
    const name = parsed.name ?? "Backup";
    const filename = parsed.filename ?? "backup.uge";
    const rawTimestamp = localStorage.getItem(BACKUP_TIMESTAMP_KEY);
    const timestamp = rawTimestamp ? parseInt(rawTimestamp, 10) : Date.now();
    return { name, filename, timestamp };
  } catch {
    return null;
  }
};

export const clearBackup = (): void => {
  localStorage.removeItem(BACKUP_SONG_KEY);
  localStorage.removeItem(BACKUP_TIMESTAMP_KEY);
};
