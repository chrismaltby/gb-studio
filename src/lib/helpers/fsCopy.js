import fs from "fs-extra";

const copyDir = async (src, dest, options = {}) => {
  const { overwrite = true } = options;
  const filePaths = await fs.readdir(src);
  await fs.ensureDir(dest);
  for (const fileName of filePaths) {
    // console.log(fileName);
    const fileStat = await fs.lstat(`${src}/${fileName}`);
    // console.log(fileStat);
    if (fileStat.isDirectory()) {
      // console.log("IS DIR");
      await copyDir(`${src}/${fileName}`, `${dest}/${fileName}`, options);
    } else {
      await copyFile(`${src}/${fileName}`, `${dest}/${fileName}`, options);
    }
  }
  // console.log("DONE COPY");
};

const copyFile = async (src, dest, options = {}) => {
  const { overwrite = true, errorOnExist = false, mode } = options;
  if (!overwrite) {
    try {
      const destStat = await fs.lstat(dest);
      // console.log("dest already existed", destStat);
      if (errorOnExist) {
        throw new Error(`File already exists ${  destFile}`);
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
