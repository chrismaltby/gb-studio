import type {
  Song,
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
} from "shared/lib/uge/types";

export type MusicExportFormat = "wav" | "mp3" | "flac";

export type MusicDataPacket =
  | {
      action: "load-song";
      song: Song;
    }
  | {
      action: "load-sound";
      sound: string;
    }
  | {
      action: "play";
      song: Song;
      position?: [number, number];
    }
  | {
      action: "play-sound";
    }
  | {
      action: "stop";
      position?: [number, number];
    }
  | {
      action: "position";
      position: [number, number];
    }
  | {
      action: "preview";
      type: "duty" | "wave" | "noise";
      note: number;
      instrument: DutyInstrument | NoiseInstrument | WaveInstrument;
      square2: boolean;
      waveForms?: Uint8Array[];
    }
  | {
      action: "export-song";
      requestId: string;
      song: Song;
      format: MusicExportFormat;
      loopCount: number;
    }
  | {
      action: "set-mute";
      channel: number;
      muted: boolean;
    }
  | {
      action: "set-solo";
      channel: number;
      enabled: boolean;
    };

export type MusicDataReceivePacket =
  | {
      action: "initialized";
    }
  | {
      action: "log";
      message: string;
    }
  | {
      action: "loaded";
    }
  | {
      action: "update";
      update: [number, number];
    }
  | {
      action: "muted";
      channels: boolean[];
    }
  | {
      action: "exported-song";
      requestId: string;
      format: MusicExportFormat;
      data: Uint8Array;
    }
  | {
      action: "export-failed";
      requestId: string;
      message: string;
    };
