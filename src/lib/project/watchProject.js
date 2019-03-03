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

  const spriteWatcher = chokidar
    .watch([`${projectRoot}/assets/sprites`], {
      ignored: /^.*\.(?!png$)[^.]+$/,
      ignoreInitial: true,
      persistent: true
    })
    .on("add", onAddSprite)
    .on("change", onChangedSprite)
    .on("unlink", onRemoveSprite);

  const backgroundWatcher = chokidar
    .watch([`${projectRoot}/assets/backgrounds`], {
      ignored: /^.*\.(?!png$)[^.]+$/,
      ignoreInitial: true,
      persistent: true
    })
    .on("add", onAddBackground)
    .on("change", onChangedBackground)
    .on("unlink", onRemoveBackground);

  const stopWatching = () => {
    spriteWatcher.close();
    backgroundWatcher.close();
  };

  return stopWatching;
};

export default watchProject;
