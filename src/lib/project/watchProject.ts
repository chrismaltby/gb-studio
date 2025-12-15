import chokidar from "chokidar";
import Path from "path";
import type { Stats } from "fs";

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
  },
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

  const endsWithExt = (path: string, extensions: string[]) => {
    const lowerPath = path.toLowerCase();
    return extensions.some((ext) => lowerPath.endsWith(ext));
  };

  const ignoreUnlessExt = (extensions: string[]) => {
    const lowerExts = extensions.map((e) => e.toLowerCase());
    return (path: string, stats: Stats | undefined) => {
      if (stats?.isFile()) {
        return !endsWithExt(path, lowerExts);
      }
      return false;
    };
  };

  const getPluginType = (filename: string) => {
    const folderParts = Path.relative(pluginsRoot, filename).split(Path.sep);
    for (let i = 1; i < folderParts.length; i++) {
      const part = folderParts[i];
      if (part === "backgrounds" && endsWithExt(filename, [".png"])) {
        return part;
      }
      if (part === "sprites" && endsWithExt(filename, [".png"])) {
        return part;
      }
      if (part === "music" && endsWithExt(filename, [".uge", ".mod"])) {
        return part;
      }
      if (part === "fonts" && endsWithExt(filename, [".png"])) {
        return part;
      }
      if (part === "avatars" && endsWithExt(filename, [".png"])) {
        return part;
      }
      if (part === "emotes" && endsWithExt(filename, [".png"])) {
        return part;
      }
      if (part === "tilesets" && endsWithExt(filename, [".png"])) {
        return part;
      }
      if (
        part === "sounds" &&
        endsWithExt(filename, [".wav", ".vgm", ".vgz", ".sav"])
      ) {
        return part;
      }
      if (part === "engine" && filename.endsWith("engine.json")) {
        return part;
      }
    }
    return null;
  };

  const spriteWatcher = chokidar
    .watch(spritesRoot, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
      ignored: ignoreUnlessExt([".png"]),
    })
    .on("add", callbacks.onChangedSprite)
    .on("change", callbacks.onChangedSprite)
    .on("unlink", callbacks.onRemoveSprite);

  const backgroundWatcher = chokidar
    .watch(backgroundsRoot, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
      ignored: ignoreUnlessExt([".png"]),
    })
    .on("add", callbacks.onChangedBackground)
    .on("change", callbacks.onChangedBackground)
    .on("unlink", callbacks.onRemoveBackground);

  const uiWatcher = chokidar
    .watch(uiRoot, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
      ignored: ignoreUnlessExt([".png"]),
    })
    .on("add", callbacks.onChangedUI)
    .on("change", callbacks.onChangedUI)
    .on("unlink", callbacks.onRemoveUI);

  const sgbWatcher = chokidar
    .watch(sgbRoot, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
      ignored: ignoreUnlessExt([".png"]),
    })
    .on("add", callbacks.onChangedUI)
    .on("change", callbacks.onChangedUI)
    .on("unlink", callbacks.onRemoveUI);

  const musicWatcher = chokidar
    .watch(musicRoot, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: musicAwaitWriteFinish,
      ignored: ignoreUnlessExt([".uge", ".mod"]),
    })
    .on("add", callbacks.onChangedMusic)
    .on("change", callbacks.onChangedMusic)
    .on("unlink", callbacks.onRemoveMusic);

  const soundsWatcher = chokidar
    .watch(soundsRoot, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
      ignored: ignoreUnlessExt([".wav", ".vgm", ".vgz", ".sav"]),
    })
    .on("add", callbacks.onChangedSound)
    .on("change", callbacks.onChangedSound)
    .on("unlink", callbacks.onRemoveSound);

  const fontsWatcher = chokidar
    .watch(fontsRoot, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
      ignored: ignoreUnlessExt([".png"]),
    })
    .on("add", callbacks.onChangedFont)
    .on("change", callbacks.onChangedFont)
    .on("unlink", callbacks.onRemoveFont);

  const avatarsWatcher = chokidar
    .watch(avatarsRoot, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
      ignored: ignoreUnlessExt([".png"]),
    })
    .on("add", callbacks.onChangedAvatar)
    .on("change", callbacks.onChangedAvatar)
    .on("unlink", callbacks.onRemoveAvatar);

  const emotesWatcher = chokidar
    .watch(emotesRoot, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
      ignored: ignoreUnlessExt([".png"]),
    })
    .on("add", callbacks.onChangedEmote)
    .on("change", callbacks.onChangedEmote)
    .on("unlink", callbacks.onRemoveEmote);

  const tilesetsWatcher = chokidar
    .watch(tilesetsRoot, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
      ignored: ignoreUnlessExt([".png"]),
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
    .watch(`${pluginsRoot}/**/events/**`, {
      ignoreInitial: true,
      persistent: true,
    })
    .on("add", callbacks.onChangedEventPlugin)
    .on("change", callbacks.onChangedEventPlugin)
    .on("unlink", callbacks.onChangedEventPlugin);

  const pluginAssetsWatcher = chokidar
    .watch(pluginsRoot, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
      ignored: ignoreUnlessExt([
        ".png",
        ".uge",
        ".mod",
        ".wav",
        ".vgm",
        ".vgz",
        ".sav",
        "engine.json",
      ]),
    })
    .on("add", (filename) => {
      const pluginType = getPluginType(filename);
      if (pluginType === "backgrounds") {
        callbacks.onChangedBackground(filename);
      } else if (pluginType === "sprites") {
        callbacks.onChangedSprite(filename);
      } else if (
        pluginType === "music" &&
        endsWithExt(filename, [".uge", ".mod"])
      ) {
        callbacks.onChangedMusic(filename);
      } else if (pluginType === "fonts") {
        callbacks.onChangedFont(filename);
      } else if (pluginType === "avatars") {
        callbacks.onChangedAvatar(filename);
      } else if (pluginType === "emotes") {
        callbacks.onChangedEmote(filename);
      } else if (pluginType === "tilesets") {
        callbacks.onChangedTileset(filename);
      } else if (pluginType === "sounds") {
        callbacks.onChangedSound(filename);
      } else if (pluginType === "engine") {
        callbacks.onChangedEngineSchema(filename);
      }
    })
    .on("change", (filename) => {
      const pluginType = getPluginType(filename);
      if (pluginType === "backgrounds") {
        callbacks.onChangedBackground(filename);
      } else if (pluginType === "sprites") {
        callbacks.onChangedSprite(filename);
      } else if (pluginType === "music") {
        callbacks.onChangedMusic(filename);
      } else if (pluginType === "fonts") {
        callbacks.onChangedFont(filename);
      } else if (pluginType === "avatars") {
        callbacks.onChangedAvatar(filename);
      } else if (pluginType === "emotes") {
        callbacks.onChangedEmote(filename);
      } else if (pluginType === "tilesets") {
        callbacks.onChangedTileset(filename);
      } else if (pluginType === "sounds") {
        callbacks.onChangedSound(filename);
      } else if (pluginType === "engine") {
        callbacks.onChangedEngineSchema(filename);
      }
    })
    .on("unlink", (filename) => {
      const pluginType = getPluginType(filename);
      if (pluginType === "backgrounds") {
        callbacks.onRemoveBackground(filename);
      } else if (pluginType === "sprites") {
        callbacks.onRemoveSprite(filename);
      } else if (pluginType === "music") {
        callbacks.onRemoveMusic(filename);
      } else if (pluginType === "fonts") {
        callbacks.onRemoveFont(filename);
      } else if (pluginType === "avatars") {
        callbacks.onRemoveAvatar(filename);
      } else if (pluginType === "emotes") {
        callbacks.onRemoveEmote(filename);
      } else if (pluginType === "tilesets") {
        callbacks.onRemoveTileset(filename);
      } else if (pluginType === "sounds") {
        callbacks.onRemoveSound(filename);
      } else if (pluginType === "engine") {
        callbacks.onChangedEngineSchema(filename);
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
