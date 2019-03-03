import chokidar from "chokidar";
import path from "path";

const watchProject = async (
  projectPath,
  {
    onAddSprite = () => {},
    onAddBackground = () => {},
    onChangedSprite = () => {},
    onChangedBackground = () => {},
    onRemoveSprite = () => {},
    onRemoveBackground = () => {}
  }
) => {
  const projectRoot = path.dirname(projectPath);
  const spritesRoot = `${projectRoot}/assets/sprites`;
  const backgroundsRoot = `${projectRoot}/assets/backgrounds`;

  const relativeSpritePath = fn => filename => {
    fn(path.relative(spritesRoot, filename));
  };

  const relativeBackgroundPath = fn => filename => {
    fn(path.relative(backgroundsRoot, filename));
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

  const stopWatching = () => {
    spriteWatcher.close();
    backgroundWatcher.close();
  };

  return stopWatching;
};

export default watchProject;
