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
};

export default APIMock;
