import en from "../../src/lang/en.json";
import type API from "../../src/renderer/lib/api/setup";

const APIMock = {
  platform: "test",
  l10n: {
    getL10NStrings: () => Promise.resolve(en),
  },
  theme: {
    getTheme: () => Promise.resolve("light"),
    onChange: () => {},
  },
  project: {
    ejectWebTemplate: () => Promise.resolve(undefined),
    getBackgroundInfo: () =>
      Promise.resolve({
        numTiles: 1,
        warnings: [],
        lookup: [],
      }),
  },

  music: {
    openMusic: () => {},
    closeMusic: () => {},
    sendToMusicWindow: () => {},
    sendToProjectWindow: () => {},
    updateMidiInputMenuState: () => {},
  },
  settings: {
    get: () => Promise.resolve(undefined),
    getString: (_key: string, fallback: string) => Promise.resolve(fallback),
    getNumber: (_key: string, fallback: number) => Promise.resolve(fallback),
    set: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    app: {
      openExternal: () => {},
      setUIScale: () => Promise.resolve(),
      getUIScale: () => Promise.resolve(0),
      setTrackerKeyBindings: () => Promise.resolve(),
      getTrackerKeyBindings: () => Promise.resolve(0),
    },
  },
  tracker: {
    addNewUGEFile: () => Promise.resolve({}),
    loadUGEFile: () => Promise.resolve(null),
    saveUGEFile: () => Promise.resolve(),
    convertModToUge: () => Promise.resolve({}),
  },
  dialog: {
    confirmUnsavedChangesTrackerDialog: () => Promise.resolve(2),
  },
  clipboard: {
    readText: () => {},
    readBuffer: () => {},
    writeText: () => {},
    writeBuffer: () => {},
  },
  events: {
    menu: {
      midiInputToggle: {
        subscribe: () => () => undefined,
      },
      midiInputSelect: {
        subscribe: () => () => undefined,
      },
    },
  },
} as unknown as typeof API;

export default APIMock;
