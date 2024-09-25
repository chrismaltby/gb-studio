import chokidar from "chokidar";
import Path from "path";

type WatchCallback = (path: string) => void;

const watchProject = (
  projectPath: string,
  callbacks: {
    onChangedSprite: WatchCallback;
    onChangedBackground: WatchCallback;
    onChangedUI: WatchCallback;
    onChangedMusic: WatchCallback;
    onChangedSound: WatchCallback;
    onChangedFont: WatchCallback;
    onChangedAvatar: WatchCallback;
    onChangedEmote: WatchCallback;
    onChangedTileset: WatchCallback;
    onRemoveSprite: WatchCallback;
    onRemoveBackground: WatchCallback;
    onRemoveUI: WatchCallback;
    onRemoveMusic: WatchCallback;
    onRemoveSound: WatchCallback;
    onRemoveFont: WatchCallback;
    onRemoveAvatar: WatchCallback;
    onRemoveEmote: WatchCallback;
    onRemoveTileset: WatchCallback;
    onChangedEngineSchema: WatchCallback;
    onChangedEventPlugin: WatchCallback;
  }
) => {
  const projectRoot = Path.dirname(projectPath);
  const spritesRoot = `${projectRoot}/assets/sprites`;
  const backgroundsRoot = `${projectRoot}/assets/backgrounds`;
  const musicRoot = `${projectRoot}/assets/music`;
  const soundsRoot = `${projectRoot}/assets/sounds`;
  const fontsRoot = `${projectRoot}/assets/fonts`;
  const avatarsRoot = `${projectRoot}/assets/avatars`;
  const emotesRoot = `${projectRoot}/assets/emotes`;
  const tilesetsRoot = `${projectRoot}/assets/tilesets`;
  const uiRoot = `${projectRoot}/assets/ui`;
  const sgbRoot = `${projectRoot}/assets/sgb`;
  const pluginsRoot = `${projectRoot}/plugins`;
  const engineSchema = `${projectRoot}/assets/engine/engine.json`;

  const awaitWriteFinish = {
    stabilityThreshold: 1000,
    pollInterval: 100,
  };

  const musicAwaitWriteFinish = {
    stabilityThreshold: 500,
    pollInterval: 100,
  };

  const pluginSubfolder = (filename: string) => {
    return Path.relative(pluginsRoot, filename).split(Path.sep)[1];
  };

  const spriteWatcher = chokidar
    .watch(`${spritesRoot}/**/*.{png,PNG}`, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", callbacks.onChangedSprite)
    .on("change", callbacks.onChangedSprite)
    .on("unlink", callbacks.onRemoveSprite);

  const backgroundWatcher = chokidar
    .watch(
      [
        `${backgroundsRoot}/**/*.{png,PNG}`,
        `${pluginsRoot}/**/backgrounds/**/*.{png,PNG}`,
      ],
      {
        ignoreInitial: true,
        persistent: true,
        awaitWriteFinish,
      }
    )
    .on("add", callbacks.onChangedBackground)
    .on("change", callbacks.onChangedBackground)
    .on("unlink", callbacks.onRemoveBackground);

  const uiWatcher = chokidar
    .watch(`${uiRoot}/**/*.{png,PNG}`, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", callbacks.onChangedUI)
    .on("change", callbacks.onChangedUI)
    .on("unlink", callbacks.onRemoveUI);

  const sgbWatcher = chokidar
    .watch(`${sgbRoot}/**/*.{png,PNG}`, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", callbacks.onChangedUI)
    .on("change", callbacks.onChangedUI)
    .on("unlink", callbacks.onRemoveUI);

  const musicWatcher = chokidar
    .watch(`${musicRoot}/**/*.{uge,UGE,mod,MOD}`, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: musicAwaitWriteFinish,
    })
    .on("add", callbacks.onChangedMusic)
    .on("change", callbacks.onChangedMusic)
    .on("unlink", callbacks.onRemoveMusic);

  const soundsWatcher = chokidar
    .watch(`${soundsRoot}/**/*.{wav,WAV,vgm,VGM,vgz,VGZ,sav,SAV}`, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", callbacks.onChangedSound)
    .on("change", callbacks.onChangedSound)
    .on("unlink", callbacks.onRemoveSound);

  const fontsWatcher = chokidar
    .watch(`${fontsRoot}/**/*.{png,PNG}`, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", callbacks.onChangedFont)
    .on("change", callbacks.onChangedFont)
    .on("unlink", callbacks.onRemoveFont);

  const avatarsWatcher = chokidar
    .watch(`${avatarsRoot}/**/*.{png,PNG}`, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", callbacks.onChangedAvatar)
    .on("change", callbacks.onChangedAvatar)
    .on("unlink", callbacks.onRemoveAvatar);

  const emotesWatcher = chokidar
    .watch(`${emotesRoot}/**/*.{png,PNG}`, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", callbacks.onChangedEmote)
    .on("change", callbacks.onChangedEmote)
    .on("unlink", callbacks.onRemoveEmote);

  const tilesetsWatcher = chokidar
    .watch(`${tilesetsRoot}/**/*.{png,PNG}`, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", callbacks.onChangedTileset)
    .on("change", callbacks.onChangedTileset)
    .on("unlink", callbacks.onRemoveTileset);

  const engineSchemaWatcher = chokidar
    .watch([engineSchema, `${pluginsRoot}/**/engine/engine.json`], {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", callbacks.onChangedEngineSchema)
    .on("change", callbacks.onChangedEngineSchema)
    .on("unlink", callbacks.onChangedEngineSchema);

  const pluginEventsWatcher = chokidar
    .watch(`${pluginsRoot}/**/events/event*.js`, {
      ignoreInitial: true,
      persistent: true,
    })
    .on("add", callbacks.onChangedEventPlugin)
    .on("change", callbacks.onChangedEventPlugin)
    .on("unlink", callbacks.onChangedEventPlugin);

  const pluginAssetsWatcher = chokidar
    .watch(
      `${pluginsRoot}/**/*.{png,PNG,uge,UGE,mod,MOD,wav,WAV,vgm,VGM,vgz,VGZ,sav,SAV}`,
      {
        ignoreInitial: true,
        persistent: true,
        awaitWriteFinish,
      }
    )
    .on("add", (filename) => {
      const subfolder = pluginSubfolder(filename);
      if (subfolder === "backgrounds") {
        callbacks.onChangedBackground(filename);
      } else if (subfolder === "sprites") {
        callbacks.onChangedSprite(filename);
      } else if (subfolder === "music") {
        callbacks.onChangedMusic(filename);
      } else if (subfolder === "fonts") {
        callbacks.onChangedFont(filename);
      } else if (subfolder === "avatar") {
        callbacks.onChangedAvatar(filename);
      } else if (subfolder === "emotes") {
        callbacks.onChangedEmote(filename);
      } else if (subfolder === "tilesets") {
        callbacks.onChangedTileset(filename);
      } else if (subfolder === "sounds") {
        callbacks.onChangedSound(filename);
      }
    })
    .on("change", (filename) => {
      const subfolder = pluginSubfolder(filename);
      if (subfolder === "backgrounds") {
        callbacks.onChangedBackground(filename);
      } else if (subfolder === "sprites") {
        callbacks.onChangedSprite(filename);
      } else if (subfolder === "music") {
        callbacks.onChangedMusic(filename);
      } else if (subfolder === "fonts") {
        callbacks.onChangedFont(filename);
      } else if (subfolder === "avatars") {
        callbacks.onChangedAvatar(filename);
      } else if (subfolder === "emotes") {
        callbacks.onChangedEmote(filename);
      } else if (subfolder === "tilesets") {
        callbacks.onChangedTileset(filename);
      } else if (subfolder === "sounds") {
        callbacks.onChangedSound(filename);
      }
    })
    .on("unlink", (filename) => {
      const subfolder = pluginSubfolder(filename);
      if (subfolder === "backgrounds") {
        callbacks.onRemoveBackground(filename);
      } else if (subfolder === "sprites") {
        callbacks.onRemoveSprite(filename);
      } else if (subfolder === "music") {
        callbacks.onRemoveMusic(filename);
      } else if (subfolder === "fonts") {
        callbacks.onRemoveFont(filename);
      } else if (subfolder === "avatars") {
        callbacks.onRemoveAvatar(filename);
      } else if (subfolder === "emotes") {
        callbacks.onRemoveEmote(filename);
      } else if (subfolder === "tilesets") {
        callbacks.onRemoveTileset(filename);
      } else if (subfolder === "sounds") {
        callbacks.onRemoveSound(filename);
      }
    });

  const stopWatching = () => {
    spriteWatcher.close();
    backgroundWatcher.close();
    uiWatcher.close();
    sgbWatcher.close();
    musicWatcher.close();
    soundsWatcher.close();
    fontsWatcher.close();
    avatarsWatcher.close();
    emotesWatcher.close();
    tilesetsWatcher.close();
    engineSchemaWatcher.close();
    pluginEventsWatcher.close();
    pluginAssetsWatcher.close();
  };

  return stopWatching;
};

export default watchProject;
