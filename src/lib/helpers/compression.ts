import { promisify } from "util";
import { deflate, unzip } from "zlib";
import { SceneData } from "../../store/features/entities/entitiesTypes";
import { ProjectData } from "../../store/features/project/projectActions";

const deflateAsync = promisify(deflate);
const unzipAsync = promisify(unzip);

export type CompressedSceneData = Omit<
  SceneData,
  "collisions" | "tileColors"
> & {
  collisions: string;
  tileColors: string;
};

export type CompressedProjectData = Omit<ProjectData, "scenes"> & {
  scenes: CompressedSceneData[];
};

export const compress = async (data: number[]): Promise<string> => {
  return deflateAsync(Buffer.from(data)).then((buffer) =>
    (buffer as Buffer).toString("base64")
  );
};

export const decompress = async (data: string): Promise<number[]> => {
  if (!data) {
    return [];
  }
  if (Array.isArray(data)) {
    return (data as unknown) as number[];
  }
  return unzipAsync(Buffer.from(data, "base64"))
    .then((buf) => Array.from(buf as Buffer))
    .catch((error) => {
      console.log(error);
      return [];
    });
};

export const compressProject = async (
  project: ProjectData
): Promise<CompressedProjectData> => {
  return {
    ...project,
    scenes: await Promise.all(
      project.scenes.map(async (scene) => {
        return {
          ...scene,
          collisions: await compress(scene.collisions || []),
          tileColors: await compress(scene.tileColors || []),
        };
      })
    ),
  };
};

export const decompressProject = async (
  project: CompressedProjectData
): Promise<ProjectData> => {
  return {
    ...project,
    scenes: await Promise.all(
      project.scenes.map(async (scene) => {
        return {
          ...scene,
          collisions: await decompress(scene.collisions),
          tileColors: await decompress(scene.tileColors),
        };
      })
    ),
  };
};
