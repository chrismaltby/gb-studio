import type {
  MusicDataPacket,
  MusicDataReceivePacket,
} from "shared/lib/music/types";
import player, { PlaybackPosition } from "./player";
import { playNotePreview } from "./notePreview";

type MusicSessionListener = (data: MusicDataReceivePacket) => void;

export interface MusicSession {
  open: (sfx?: string) => void;
  send: (data: MusicDataPacket) => void;
  subscribe: (listener: MusicSessionListener) => () => void;
}

export const createMusicSession = (): MusicSession => {
  let isInitialized = false;
  let isOpening = false;
  let openedSfx: string | undefined;
  let position: PlaybackPosition = [0, 0];
  let queuedActions: MusicDataPacket[] = [];

  const listeners = new Set<MusicSessionListener>();

  const emit = (data: MusicDataReceivePacket) => {
    listeners.forEach((listener) => listener(data));
  };

  const flushQueuedActions = () => {
    if (queuedActions.length === 0) {
      return;
    }
    const actions = queuedActions;
    queuedActions = [];
    actions.forEach((action) => {
      handleAction(action);
    });
  };

  const handleAction = (data: MusicDataPacket) => {
    switch (data.action) {
      case "load-song":
        player.reset();
        player.loadSong(data.song);
        emit({
          action: "log",
          message: "load song",
        });
        emit({
          action: "loaded",
        });
        break;
      case "load-sound":
        player.loadSound(data.sound);
        break;
      case "play":
        if (data.position) {
          position = data.position;
        }
        player.reset();
        player.play(data.song, position);
        emit({
          action: "log",
          message: "playing",
        });
        break;
      case "play-sound":
        player.playSound();
        emit({
          action: "log",
          message: "playing SFX",
        });
        break;
      case "stop":
        if (data.position) {
          position = data.position;
        }
        player.stop(data.position);
        emit({
          action: "log",
          message: "stop",
        });
        break;
      case "position":
        position = data.position;
        player.setStartPosition(data.position);
        emit({
          action: "log",
          message: "position",
        });
        break;
      case "set-mute":
        emit({
          action: "muted",
          channels: player.setChannel(data.channel, data.muted),
        });
        break;
      case "set-solo":
        emit({
          action: "muted",
          channels: player.setSolo(data.channel, data.enabled),
        });
        break;
      case "preview": {
        let waves = data.waveForms || [];
        const song = player.getCurrentSong();
        if (waves.length === 0 && song) {
          waves = song.waves;
        }
        playNotePreview(
          data.note,
          data.type,
          data.instrument,
          data.square2,
          waves,
        );
        emit({
          action: "log",
          message: "preview",
        });
        break;
      }
      case "export-song": {
        void player
          .exportSong(data.song, data.format, data.loopCount)
          .then((fileData) => {
            emit({
              action: "exported-song",
              requestId: data.requestId,
              format: data.format,
              data: fileData,
            });
            player.reset();
          })
          .catch((error) => {
            emit({
              action: "export-failed",
              requestId: data.requestId,
              message: error instanceof Error ? error.message : String(error),
            });
          });
        break;
      }
      default: {
        const unsupportedAction: never = data;
        console.log(`Unsupported music action`, unsupportedAction);
      }
    }
  };

  player.setOnIntervalCallback((playbackUpdate) => {
    position = playbackUpdate;
    emit({
      action: "update",
      update: playbackUpdate,
    });
  });

  const open = (sfx?: string) => {
    if (isInitialized) {
      queueMicrotask(() => {
        emit({
          action: "initialized",
        });
      });
      return;
    }

    if (isOpening) {
      return;
    }

    isOpening = true;
    openedSfx = sfx;

    player.initPlayer((file) => {
      isOpening = false;
      if (!file) {
        emit({
          action: "log",
          message: "compile error",
        });
        return;
      }

      isInitialized = true;
      emit({
        action: "initialized",
      });
      flushQueuedActions();
    }, openedSfx);
  };

  const send = (data: MusicDataPacket) => {
    if (!isInitialized) {
      queuedActions = queuedActions.concat(data);
      open(openedSfx);
      return;
    }
    handleAction(data);
  };

  const subscribe = (listener: MusicSessionListener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    open,
    send,
    subscribe,
  };
};

export default createMusicSession;
