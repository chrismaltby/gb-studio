const APIMock = {
  platform: "test",
  l10n: {
    getL10NStrings: () => Promise.resolve({}),
  },
  theme: {
    getTheme: () => Promise.resolve("light"),
    onChange: () => {},
  },
};

export default APIMock;
