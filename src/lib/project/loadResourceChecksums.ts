import path from "path";
import glob from "glob";
import { promisify } from "util";
import promiseLimit from "lib/helpers/promiseLimit";
import { checksumMD5File } from "lib/helpers/checksum";
import { pathToPosix } from "shared/lib/helpers/path";

const globAsync = promisify(glob);

const CONCURRENT_RESOURCE_LOAD_COUNT = 16;

export const loadProjectResourceChecksums = async (
  projectPath: string
): Promise<Record<string, string>> => {
  const projectRoot = path.dirname(projectPath);
  const projectResourcesRoot = path.join(projectRoot, "project");

  console.time("loadProjectResourceHashes.loadProject globResources");
  const projectResources = await globAsync(
    path.join(projectResourcesRoot, "**/*.gbsres")
  );
  console.timeEnd("loadProjectResourceHashes.loadProject globResources");

  console.time("loadProjectResourceHashes.loadProject readResources2");
  const resources = await promiseLimit(
    CONCURRENT_RESOURCE_LOAD_COUNT,
    projectResources.map((projectResourcePath) => async () => {
      const resourceData = await checksumMD5File(projectResourcePath);
      return {
        path: pathToPosix(path.relative(projectRoot, projectResourcePath)),
        data: resourceData,
      };
    })
  );
  console.timeEnd("loadProjectResourceHashes.loadProject readResources2");
  return resources.reduce((memo, { path, data }) => {
    memo[path] = data;
    return memo;
  }, {} as Record<string, string>);
};
