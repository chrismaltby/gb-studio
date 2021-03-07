import chokidar from "chokidar";
import Path from "path";

const watchProject = async (
  projectPath,
  {
    onAddSprite = () => {},
    onAddBackground = () => {},
    onAddUI = () => {},
    onAddMusic = () => {},
    onAddFont = () => {},
    onChangedSprite = () => {},
    onChangedBackground = () => {},
    onChangedUI = () => {},
    onChangedMusic = () => {},
    onChangedFont = () => {},
    onRemoveSprite = () => {},
    onRemoveBackground = () => {},
    onRemoveUI = () => {},
    onRemoveMusic = () => {},
    onRemoveFont = () => {},
    onChangedEngineSchema = () => {},
  }
) => {
  const projectRoot = Path.dirname(projectPath);
  const spritesRoot = `${projectRoot}/assets/sprites`;
  const backgroundsRoot = `${projectRoot}/assets/backgrounds`;
  const musicRoot = `${projectRoot}/assets/music`;
  const fontsRoot = `${projectRoot}/assets/fonts`;
  const uiRoot = `${projectRoot}/assets/ui`;
  const pluginsRoot = `${projectRoot}/plugins`;
  const engineSchema = `${projectRoot}/assets/engine/engine.json`;

  const awaitWriteFinish = {
    stabilityThreshold: 1000,
    pollInterval: 100,
  };

  const musicAwaitWriteFinish = {
    stabilityThreshold: 5000,
    pollInterval: 100,
  };

  const pluginSubfolder = (filename) => {
    return Path.relative(pluginsRoot, filename).split(Path.sep)[1];
  };

  const spriteWatcher = chokidar
    .watch(spritesRoot, {
      ignored: /^.*\.(?!(png|PNG)$)[^.]+$/,
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", onAddSprite)
    .on("change", onChangedSprite)
    .on("unlink", onRemoveSprite);

  const backgroundWatcher = chokidar
    .watch(backgroundsRoot, {
      ignored: /^.*\.(?!(png|PNG)$)[^.]+$/,
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", onAddBackground)
    .on("change", onChangedBackground)
    .on("unlink", onRemoveBackground);

  const uiWatcher = chokidar
    .watch(uiRoot, {
      ignored: /^.*\.(?!png$)[^.]+$/,
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", onAddUI)
    .on("change", onChangedUI)
    .on("unlink", onRemoveUI);

  const musicWatcher = chokidar
    .watch(musicRoot, {
      ignored: /^.*\.(?!(mod|MOD)$)[^.]+$/,
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: musicAwaitWriteFinish,
    })
    .on("add", onAddMusic)
    .on("change", onChangedMusic)
    .on("unlink", onRemoveMusic);

  const fontsWatcher = chokidar
    .watch(fontsRoot, {
      ignored: /^.*\.(?!(png|PNG)$)[^.]+$/,
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", onAddFont)
    .on("change", onChangedFont)
    .on("unlink", onRemoveFont);

  const engineSchemaWatcher = chokidar
    .watch(engineSchema, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", onChangedEngineSchema)
    .on("change", onChangedEngineSchema)
    .on("unlink", onChangedEngineSchema);

  const pluginsWatcher = chokidar
    .watch(pluginsRoot, {
      ignored: /^.*\.(?!(png|mod|PNG|MOD)$)[^.]+$/,
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", (filename) => {
      const subfolder = pluginSubfolder(filename);
      if (subfolder === "backgrounds") {
        onAddBackground(filename);
      } else if (subfolder === "sprites") {
        onAddSprite(filename);
      } else if (subfolder === "music") {
        onAddMusic(filename);
      } else if (subfolder === "fonts") {
        onAddFonts(filename);
      }
    })
    .on("change", (filename) => {
      const subfolder = pluginSubfolder(filename);
      if (subfolder === "backgrounds") {
        onChangedBackground(filename);
      } else if (subfolder === "sprites") {
        onChangedSprite(filename);
      } else if (subfolder === "music") {
        onChangedMusic(filename);
      } else if (subfolder === "fonts") {
        onChangedFont(filename);
      }
    })
    .on("unlink", (filename) => {
      const subfolder = pluginSubfolder(filename);
      if (subfolder === "backgrounds") {
        onRemoveBackground(filename);
      } else if (subfolder === "sprites") {
        onRemoveSprite(filename);
      } else if (subfolder === "music") {
        onRemoveMusic(filename);
      } else if (subfolder === "fonts") {
        onRemoveFont(filename);
      }
    });

  const stopWatching = () => {
    spriteWatcher.close();
    backgroundWatcher.close();
    uiWatcher.close();
    musicWatcher.close();
    fontsWatcher.close();
    engineSchemaWatcher.close();
    pluginsWatcher.close();
  };

  return stopWatching;
};

export default watchProject;
