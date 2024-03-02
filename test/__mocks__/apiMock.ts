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
    sendMusicData: () => {},
    musicDataSubscribe: () => {},
    musicDataUnsubscribe: () => {},
  },
  clipboard: {
    readText: () => {},
    readBuffer: () => {},
    writeText: () => {},
    writeBuffer: () => {},
  },
} as unknown as typeof API;

export default APIMock;
