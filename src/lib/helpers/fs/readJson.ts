import fs from "fs-extra";

// Wrapper casts output of readJson as unknown
// forcing type guards to be used before data can be read
export const readJson = async (file: string): Promise<unknown> => {
  return fs.readJson(file);
};
