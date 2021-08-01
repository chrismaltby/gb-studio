const Path = require("path");

const srcPath = (subdir) => {
  return Path.join(__dirname, "..", "src", subdir);
};

module.exports = ({ config }) => {
  config.resolve.modules = [
    Path.resolve(__dirname, "..", "src"),
    "node_modules",
  ];

  config.resolve.alias = {
    store: srcPath("store"),
    components: srcPath("components"),
    lib: srcPath("lib"),
    ui: srcPath("components/ui"),
  };

  return config;
};
