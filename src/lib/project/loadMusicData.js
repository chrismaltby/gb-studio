import glob from "glob";
import { promisify } from "util";
import uuidv4 from "uuid/v4";

const globAsync = promisify(glob);

const loadMusicData = async filename => {
  const relativePath = filename.replace(/.*assets\/music\//, "");
  return {
    id: uuidv4(),
    name: relativePath.replace(".mod", ""),
    filename: relativePath,
    _v: Date.now()
  };
};

const loadAllMusicData = async projectRoot => {
  const musicPaths = await globAsync(`${projectRoot}/assets/music/**/*.mod`);
  const musicData = await Promise.all(musicPaths.map(loadMusicData));
  return musicData;
};

export default loadAllMusicData;
export { loadMusicData };
