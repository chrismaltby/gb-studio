import {
  CompressedProjectResources,
  WriteResourcesPatch,
} from "shared/lib/resources/types";
import { buildResourceExportBuffer } from "./save";

export const buildCompressedProjectResourcesPatch = (
  resources: CompressedProjectResources,
  checksums: Record<string, string>
): WriteResourcesPatch => {
  console.time("buildCompressedProjectResourcesPatch writeBuffer");
  const writeBuffer = buildResourceExportBuffer(resources);
  console.timeEnd("buildCompressedProjectResourcesPatch writeBuffer");
  console.log({ writeBuffer });

  console.time("buildCompressedProjectResourcesPatch dirtyWriteBuffer");
  const dirtyWriteBuffer = writeBuffer.filter((writeFile) => {
    const newChecksum = writeFile.checksum;
    const oldChecksum = checksums[writeFile.path];
    return newChecksum !== oldChecksum;
  });
  console.timeEnd("buildCompressedProjectResourcesPatch dirtyWriteBuffer");

  console.log({ dirtyWriteBuffer });

  const expectedPaths = writeBuffer.map((writeFile) => writeFile.path);

  console.log({ expectedPaths });

  return {
    data: dirtyWriteBuffer,
    paths: expectedPaths,
    metadata: resources.metadata,
  };
};
