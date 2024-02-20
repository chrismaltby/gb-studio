import type { Song } from "renderer/lib/uge/song/Song";
import type {
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
} from "store/features/trackerDocument/trackerDocumentTypes";

export type MusicDataPacket =
  | {
      action: "initialized";
    }
  | {
      action: "load-song";
      song: Song;
    }
  | {
      action: "loaded";
    }
  | {
      action: "play";
      song: Song;
      position?: [number, number];
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
      action: "muted";
      channels: boolean[];
    }
  | {
      action: "set-mute";
      channel?: number;
      muted: boolean;
    }
  | {
      action: "update";
      update: [number, number];
    }
  | {
      action: "log";
      message: string;
    };
