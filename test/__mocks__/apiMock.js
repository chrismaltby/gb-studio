import en from "../../src/lang/en.json";

const APIMock = {
  platform: "test",
  l10n: {
    getL10NStrings: () => Promise.resolve(en),
  },
  theme: {
    getTheme: () => Promise.resolve("light"),
    onChange: () => {},
  },
  music: {
    openMusic: () => {},
    closeMusic: () => {},
    sendMusicData: () => {},
    musicDataSubscribe: () => {},
    musicDataUnsubscribe: () => {},
  },
};

export default APIMock;
