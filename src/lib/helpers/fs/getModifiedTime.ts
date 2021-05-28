import fs from "fs-extra";

const getFileModifiedTime = async (filename: string): Promise<number> => {
  return (await fs.stat(filename)).mtimeMs;
};

export default getFileModifiedTime;
