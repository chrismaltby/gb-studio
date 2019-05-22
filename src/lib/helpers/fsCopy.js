import fs from "fs-extra";

const copyDir = async (src, dest, options = {}) => {
  const filePaths = await fs.readdir(src);
  await fs.ensureDir(dest);
  filePaths.forEach(async fileName => {
    const fileStat = await fs.lstat(`${src}/${fileName}`);
    if (fileStat.isDirectory()) {
      await copyDir(`${src}/${fileName}`, `${dest}/${fileName}`, options);
    } else {
      await copyFile(`${src}/${fileName}`, `${dest}/${fileName}`, options);
    }
  });
};

const copyFile = async (src, dest, options = {}) => {
  const { overwrite = true, errorOnExist = false, mode } = options;
  if (!overwrite) {
    try {
      await fs.lstat(dest);
      if (errorOnExist) {
        throw new Error(`File already exists ${dest}`);
      } else {
        return;
      }
    } catch (e) {
      // console.log("didn't exist so copy it");
    }
  }
  // console.log("IS FILE");
  const fileData = await fs.readFile(src);
  // console.log("READ FILE");
  await fs.writeFile(dest, fileData, { mode });
};

const copy = async (src, dest, options) => {
  // console.log("COPY", { src, dest, options });
  const fileStat = await fs.lstat(src);
  if (fileStat.isDirectory()) {
    // console.log("WAS DIR");
    await copyDir(src, dest, options);
  } else {
    // console.log("WAS FILE");
    await copyFile(src, dest, options);
  }
};

export default copy;
