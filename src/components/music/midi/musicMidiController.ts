import { TOTAL_NOTES } from "consts";
import API from "renderer/lib/api";
import trackerActions from "store/features/tracker/trackerActions";
import {
  defaultMusicMidiState,
  MusicMidiInputDevice,
  MusicMidiState,
} from "shared/lib/music/midi";

const MIDI_ENABLED_SETTING_KEY = "midiInputEnabled";
const MIDI_DEVICE_ID_SETTING_KEY = "midiInputDeviceId";
const NOTE_ON_STATUS_MASK = 0xf0;
const NOTE_ON_STATUS = 0x90;
const NOTE_OFFSET = 48;

type MidiNoteListener = (note: number) => void;

type StoredMidiDevice = {
  id: string | null;
  name: string | null;
  manufacturer: string | null;
};

interface MusicMidiControllerEnv {
  supportsMidi: () => boolean;
  requestAccess: () => Promise<MIDIAccess>;
  getStoredEnabled: () => Promise<boolean>;
  setStoredEnabled: (enabled: boolean) => Promise<void>;
  getStoredDevice: () => Promise<StoredMidiDevice | null>;
  setStoredDevice: (device: StoredMidiDevice | null) => Promise<void>;
}

type MusicMidiControllerStore = {
  dispatch: (action: unknown) => unknown;
};

const defaultEnv: MusicMidiControllerEnv = {
  supportsMidi: () => isMidiSupported(),
  requestAccess: async () => {
    const nav = navigator as Navigator & {
      requestMIDIAccess?: () => Promise<MIDIAccess>;
    };

    if (typeof nav.requestMIDIAccess !== "function") {
      throw new Error("Web MIDI API is not supported in this environment.");
    }

    return nav.requestMIDIAccess();
  },
  getStoredEnabled: async () =>
    (await API.settings.get(MIDI_ENABLED_SETTING_KEY)) === true,
  setStoredEnabled: async (enabled: boolean) => {
    await API.settings.set(MIDI_ENABLED_SETTING_KEY, enabled);
  },
  getStoredDevice: async () => {
    const value = await API.settings.get(MIDI_DEVICE_ID_SETTING_KEY);
    if (typeof value === "string" && value.length > 0) {
      try {
        const parsed = JSON.parse(value) as Partial<StoredMidiDevice>;
        if (parsed && typeof parsed === "object") {
          const id =
            typeof parsed.id === "string" && parsed.id.length > 0
              ? parsed.id
              : null;
          const name =
            typeof parsed.name === "string" && parsed.name.length > 0
              ? parsed.name
              : null;
          const manufacturer =
            typeof parsed.manufacturer === "string" &&
            parsed.manufacturer.length > 0
              ? parsed.manufacturer
              : null;

          if (id || name || manufacturer) {
            return {
              id,
              name,
              manufacturer,
            };
          }
        }
      } catch {
        // Legacy values were stored as raw device ids.
      }

      return {
        id: value,
        name: null,
        manufacturer: null,
      };
    }

    if (!value || typeof value !== "object") {
      return null;
    }

    const device = value as Partial<StoredMidiDevice>;
    const id =
      typeof device.id === "string" && device.id.length > 0 ? device.id : null;
    const name =
      typeof device.name === "string" && device.name.length > 0
        ? device.name
        : null;
    const manufacturer =
      typeof device.manufacturer === "string" && device.manufacturer.length > 0
        ? device.manufacturer
        : null;

    return id || name || manufacturer
      ? {
          id,
          name,
          manufacturer,
        }
      : null;
  },
  setStoredDevice: async (device: StoredMidiDevice | null) => {
    if (device && (device.id || device.name || device.manufacturer)) {
      await API.settings.set(
        MIDI_DEVICE_ID_SETTING_KEY,
        JSON.stringify(device),
      );
      return;
    }
    await API.settings.delete(MIDI_DEVICE_ID_SETTING_KEY);
  },
};

export const isMidiSupported = () => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const nav = navigator as Navigator & {
    requestMIDIAccess?: () => Promise<MIDIAccess>;
  };

  return typeof nav.requestMIDIAccess === "function";
};

const clampMidiNote = (note: number) =>
  Math.max(0, Math.min(TOTAL_NOTES - 1, note));

const getMidiInputDevices = (midiAccess: MIDIAccess): MusicMidiInputDevice[] =>
  Array.from(midiAccess.inputs.values()).map((input) => ({
    id: input.id,
    name: input.name?.trim() || input.id,
  }));

const normalizeMidiValue = (value: string | null | undefined) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toStoredMidiDevice = (
  input: MIDIInput | null,
): StoredMidiDevice | null => {
  if (!input) {
    return null;
  }

  return {
    id: normalizeMidiValue(input.id),
    name: normalizeMidiValue(input.name),
    manufacturer: normalizeMidiValue(input.manufacturer),
  };
};

const isSameStoredMidiDevice = (
  a: StoredMidiDevice | null,
  b: StoredMidiDevice | null,
) =>
  a?.id === b?.id && a?.name === b?.name && a?.manufacturer === b?.manufacturer;

const findBestMatchingInput = (
  midiAccess: MIDIAccess,
  stored: StoredMidiDevice | null,
): MIDIInput | null => {
  const inputs = Array.from(midiAccess.inputs.values());

  if (!stored) {
    return null;
  }

  return (
    (stored.id ? inputs.find((input) => input.id === stored.id) : undefined) ||
    inputs.find(
      (input) =>
        normalizeMidiValue(input.name) === stored.name &&
        normalizeMidiValue(input.manufacturer) === stored.manufacturer,
    ) ||
    (stored.name
      ? inputs.find((input) => normalizeMidiValue(input.name) === stored.name)
      : undefined) ||
    null
  );
};

export const getMidiNoteFromMessage = (
  data: Uint8Array | readonly number[],
): number | null => {
  if (data.length < 3) {
    return null;
  }

  const [status, note, velocity] = data;
  if ((status & NOTE_ON_STATUS_MASK) !== NOTE_ON_STATUS || velocity === 0) {
    return null;
  }

  return clampMidiNote(note - NOTE_OFFSET);
};

class MusicMidiController {
  private readonly env: MusicMidiControllerEnv;

  private state: MusicMidiState = {
    ...defaultMusicMidiState,
    supported: defaultEnv.supportsMidi(),
  };

  private readonly noteListeners = new Set<MidiNoteListener>();

  private midiAccess: MIDIAccess | null = null;

  private activeInput: MIDIInput | null = null;

  private preferredInput: StoredMidiDevice | null = null;

  private initializePromise: Promise<void> | null = null;

  private queuedOperation: Promise<void> = Promise.resolve();

  private store: MusicMidiControllerStore | null = null;

  constructor(env: MusicMidiControllerEnv = defaultEnv) {
    this.env = env;
  }

  subscribeToNotes = (listener: MidiNoteListener) => {
    this.noteListeners.add(listener);
    return () => {
      this.noteListeners.delete(listener);
    };
  };

  bindStore = (store: MusicMidiControllerStore) => {
    this.store = store;
    this.store.dispatch(trackerActions.setMidiState(this.state));
  };

  private logError(error: unknown) {
    console.error(error);
  }

  initialize = async () => {
    if (this.initializePromise) {
      return this.initializePromise;
    }

    this.setState({
      ...this.state,
      supported: this.env.supportsMidi(),
    });

    this.initializePromise = (async () => {
      const [enabled, storedDevice] = await Promise.all([
        this.env.getStoredEnabled(),
        this.env.getStoredDevice(),
      ]);

      this.preferredInput = storedDevice;
      this.setState({
        ...this.state,
        enabled,
        selectedInputId: enabled ? (storedDevice?.id ?? null) : null,
      });

      if (enabled) {
        await this.enableAccess();
      }
    })().catch((error) => {
      this.logError(error);
      this.setState({
        ...this.state,
        enabled: false,
        inputs: [],
        selectedInputId: null,
      });
    });

    return this.initializePromise;
  };

  toggleEnabled = async () => {
    await this.setEnabled(!this.state.enabled);
  };

  setEnabled = async (enabled: boolean) => {
    await this.runExclusive(async () => {
      await this.initialize();

      if (enabled) {
        await this.enableAccess();
        return;
      }

      await this.disableAccess();
    });
  };

  toggleRecordingEnabled = () => {
    this.setRecordingEnabled(!this.state.recordingEnabled);
  };

  setRecordingEnabled = (recordingEnabled: boolean) => {
    if (this.state.recordingEnabled === recordingEnabled) {
      return;
    }

    this.setState({
      ...this.state,
      recordingEnabled,
    });
  };

  selectInput = async (inputId: string) => {
    await this.runExclusive(async () => {
      await this.initialize();

      const selectedInput = this.midiAccess?.inputs.get(inputId) ?? null;
      this.preferredInput = toStoredMidiDevice(selectedInput) ?? {
        id: inputId,
        name: null,
        manufacturer: null,
      };
      await this.env.setStoredDevice(this.preferredInput);

      if (!this.midiAccess) {
        this.setState({
          ...this.state,
          selectedInputId: inputId,
        });
        return;
      }

      await this.refreshInputs();
    });
  };

  private async runExclusive(operation: () => Promise<void>) {
    const nextOperation = this.queuedOperation.then(operation, operation);
    this.queuedOperation = nextOperation.catch(() => undefined);
    await nextOperation;
  }

  private setState(nextState: MusicMidiState) {
    this.state = nextState;
    this.store?.dispatch(trackerActions.setMidiState(nextState));
  }

  private setAccessStateListener(midiAccess: MIDIAccess | null) {
    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
    }

    if (midiAccess) {
      midiAccess.onstatechange = () => {
        void this.refreshInputs();
      };
    }
  }

  private setActiveInput(input: MIDIInput | null) {
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
    }

    this.activeInput = input;

    if (!input) {
      return;
    }

    input.onmidimessage = (event) => {
      if (!event.data) {
        return;
      }

      const note = getMidiNoteFromMessage(event.data);
      if (note === null) {
        return;
      }

      for (const listener of this.noteListeners) {
        listener(note);
      }
    };
  }

  private async enableAccess() {
    if (!this.state.supported) {
      this.logError(
        new Error("Web MIDI API is not supported in this environment."),
      );
      await this.env.setStoredEnabled(false);
      this.setState({
        ...this.state,
        enabled: false,
        inputs: [],
        selectedInputId: null,
      });
      return;
    }

    try {
      const midiAccess = await this.env.requestAccess();
      this.setAccessStateListener(midiAccess);
      this.midiAccess = midiAccess;
      await this.env.setStoredEnabled(true);
      await this.refreshInputs();
      this.setState({
        ...this.state,
        enabled: true,
      });
    } catch (error) {
      this.logError(error);
      this.setAccessStateListener(null);
      this.midiAccess = null;
      this.setActiveInput(null);
      await this.env.setStoredEnabled(false);
      this.setState({
        ...this.state,
        enabled: false,
        inputs: [],
        selectedInputId: null,
      });
    }
  }

  private async disableAccess() {
    this.setAccessStateListener(null);
    this.midiAccess = null;
    this.setActiveInput(null);
    await this.env.setStoredEnabled(false);
    this.setState({
      ...this.state,
      enabled: false,
      inputs: [],
      selectedInputId: null,
    });
  }

  private async refreshInputs() {
    if (!this.midiAccess) {
      return;
    }

    const inputs = getMidiInputDevices(this.midiAccess);
    const matchedPreferredInput = findBestMatchingInput(
      this.midiAccess,
      this.preferredInput,
    );
    const selectedInput =
      matchedPreferredInput ??
      (inputs.length > 0
        ? (this.midiAccess.inputs.get(inputs[0].id) ?? null)
        : null);

    if (!this.preferredInput && selectedInput) {
      this.preferredInput = toStoredMidiDevice(selectedInput);
      await this.env.setStoredDevice(this.preferredInput);
    } else if (matchedPreferredInput) {
      const normalizedMatchedInput = toStoredMidiDevice(matchedPreferredInput);
      if (
        !isSameStoredMidiDevice(this.preferredInput, normalizedMatchedInput)
      ) {
        this.preferredInput = normalizedMatchedInput;
        await this.env.setStoredDevice(this.preferredInput);
      }
    }

    const selectedInputId = selectedInput?.id ?? null;

    this.setActiveInput(selectedInput);
    this.setState({
      ...this.state,
      inputs,
      selectedInputId,
    });
  }
}

export const createMusicMidiController = (env?: MusicMidiControllerEnv) =>
  new MusicMidiController(env);

export const musicMidiController = createMusicMidiController();
