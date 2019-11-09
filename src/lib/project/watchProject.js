import chokidar from "chokidar";
import Path from "path";

const watchProject = async (
  projectPath,
  {
    onAddSprite = () => {},
    onAddBackground = () => {},
    onAddUI = () => {},
    onAddMusic = () => {},
    onChangedSprite = () => {},
    onChangedBackground = () => {},
    onChangedUI = () => {},
    onChangedMusic = () => {},
    onRemoveSprite = () => {},
    onRemoveBackground = () => {},
    onRemoveUI = () => {},
    onRemoveMusic = () => {}
  }
) => {
  const projectRoot = Path.dirname(projectPath);
  const spritesRoot = `${projectRoot}/assets/sprites`;
  const backgroundsRoot = `${projectRoot}/assets/backgrounds`;
  const musicRoot = `${projectRoot}/assets/music`;
  const uiRoot = `${projectRoot}/assets/ui`;
  const pluginsRoot = `${projectRoot}/plugins`;

  const awaitWriteFinish = {
    stabilityThreshold: 200,
    pollInterval: 50
  };

  const pluginSubfolder = filename => {
    return Path.relative(pluginsRoot, filename).split(Path.sep)[1];
  };

  const spriteWatcher = chokidar
    .watch(spritesRoot, {
      ignored: /^.*\.(?!png$)[^.]+$/,
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish
    })
    .on("add", onAddSprite)
    .on("change", onChangedSprite)
    .on("unlink", onRemoveSprite);

  const backgroundWatcher = chokidar
    .watch(backgroundsRoot, {
      ignored: /^.*\.(?!png$)[^.]+$/,
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish
    })
    .on("add", onAddBackground)
    .on("change", onChangedBackground)
    .on("unlink", onRemoveBackground);

  const uiWatcher = chokidar
    .watch(uiRoot, {
      ignored: /^.*\.(?!png$)[^.]+$/,
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish
    })
    .on("add", onAddUI)
    .on("change", onChangedUI)
    .on("unlink", onRemoveUI);

  const musicWatcher = chokidar
    .watch(musicRoot, {
      ignored: /^.*\.(?!mod$)[^.]+$/,
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish
    })
    .on("add", onAddMusic)
    .on("change", onChangedMusic)
    .on("unlink", onRemoveMusic);

  const pluginsWatcher = chokidar
    .watch(pluginsRoot, {
      ignored: /^.*\.(?!(png|mod)$)[^.]+$/,
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish
    })
    .on("add", filename => {
      const subfolder = pluginSubfolder(filename);
      if (subfolder === "backgrounds") {
        onAddBackground(filename);
      } else if (subfolder === "sprites") {
        onAddSprite(filename);
      } else if (subfolder === "music") {
        onAddMusic(filename);
      }
    })
    .on("change", filename => {
      const subfolder = pluginSubfolder(filename);
      if (subfolder === "backgrounds") {
        onChangedBackground(filename);
      } else if (subfolder === "sprites") {
        onChangedSprite(filename);
      } else if (subfolder === "music") {
        onChangedMusic(filename);
      }
    })
    .on("unlink", filename => {
      const subfolder = pluginSubfolder(filename);
      if (subfolder === "backgrounds") {
        onRemoveBackground(filename);
      } else if (subfolder === "sprites") {
        onRemoveSprite(filename);
      } else if (subfolder === "music") {
        onRemoveMusic(filename);
      }
    });

  const stopWatching = () => {
    spriteWatcher.close();
    backgroundWatcher.close();
    uiWatcher.close();
    musicWatcher.close();
    pluginsWatcher.close();
  };

  return stopWatching;
};

export default watchProject;
