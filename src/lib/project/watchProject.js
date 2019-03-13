import chokidar from "chokidar";
import path from "path";

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
  const projectRoot = path.dirname(projectPath);
  const spritesRoot = `${projectRoot}/assets/sprites`;
  const backgroundsRoot = `${projectRoot}/assets/backgrounds`;
  const musicRoot = `${projectRoot}/assets/music`;
  const uiRoot = `${projectRoot}/assets/ui`;

  const relativeSpritePath = fn => filename => {
    fn(path.relative(spritesRoot, filename));
  };
  const relativeBackgroundPath = fn => filename => {
    fn(path.relative(backgroundsRoot, filename));
  };
  const relativeMusicPath = fn => filename => {
    fn(path.relative(musicRoot, filename));
  };
  const relativeUIPath = fn => filename => {
    fn(path.relative(uiRoot, filename));
  };

  const spriteWatcher = chokidar
    .watch(spritesRoot, {
      ignored: /^.*\.(?!png$)[^.]+$/,
      ignoreInitial: true,
      persistent: true
    })
    .on("add", relativeSpritePath(onAddSprite))
    .on("change", relativeSpritePath(onChangedSprite))
    .on("unlink", relativeSpritePath(onRemoveSprite));

  const backgroundWatcher = chokidar
    .watch(backgroundsRoot, {
      ignored: /^.*\.(?!png$)[^.]+$/,
      ignoreInitial: true,
      persistent: true
    })
    .on("add", relativeBackgroundPath(onAddBackground))
    .on("change", relativeBackgroundPath(onChangedBackground))
    .on("unlink", relativeBackgroundPath(onRemoveBackground));

  const uiWatcher = chokidar
    .watch(uiRoot, {
      ignored: /^.*\.(?!png$)[^.]+$/,
      ignoreInitial: true,
      persistent: true
    })
    .on("add", relativeUIPath(onAddUI))
    .on("change", relativeUIPath(onChangedUI))
    .on("unlink", relativeUIPath(onRemoveUI));

  const musicWatcher = chokidar
    .watch(musicRoot, {
      ignored: /^.*\.(?!mod$)[^.]+$/,
      ignoreInitial: true,
      persistent: true
    })
    .on("add", relativeMusicPath(onAddMusic))
    .on("change", relativeMusicPath(onChangedMusic))
    .on("unlink", relativeMusicPath(onRemoveMusic));

  const stopWatching = () => {
    spriteWatcher.close();
    backgroundWatcher.close();
    uiWatcher.close();
    musicWatcher.close();
  };

  return stopWatching;
};

export default watchProject;
