import {
  CompressedProjectResources,
  WriteResourcesPatch,
} from "shared/lib/resources/types";
import { buildResourceExportBuffer } from "./save";

export const buildCompressedProjectResourcesPatch = (
  resources: CompressedProjectResources,
  checksums: Record<string, string>,
): WriteResourcesPatch => {
  const writeBuffer = buildResourceExportBuffer(resources);

  const dirtyWriteBuffer = writeBuffer.filter((writeFile) => {
    const newChecksum = writeFile.checksum;
    const oldChecksum = checksums[writeFile.path];
    return newChecksum !== oldChecksum;
  });

  const expectedPaths = writeBuffer.map((writeFile) => writeFile.path);

  return {
    data: dirtyWriteBuffer,
    paths: expectedPaths,
    metadata: resources.metadata,
  };
};
