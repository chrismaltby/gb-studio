/* eslint-disable no-await-in-loop */
import fs from "fs-extra";

const copyFile = async (src, dest, options = {}) => {
  const { overwrite = true, errorOnExist = false, mode } = options;
  let throwAlreadyExists = false;
  if (!overwrite) {
    try {
      await fs.lstat(dest);
      if (errorOnExist) {
        throwAlreadyExists = true;
      } else {
        return;
      }
    } catch (e) {
      // Didn't exist so copy it
    }
    if (throwAlreadyExists) {
      throw new Error(`File already exists ${dest}`);
    }
  }
  await new Promise((resolve, reject) => {
    const inputStream = fs.createReadStream(src);
    const outputStream = fs.createWriteStream(dest, { mode });
    inputStream.once("error", (err) => {
      outputStream.close();
      reject(new Error(`Could not write file ${dest}: ${err}`));
    });
    inputStream.once("end", () => {
      resolve();
    });
    inputStream.pipe(outputStream);
  });
};

const copyDir = async (src, dest, options = {}) => {
  const filePaths = await fs.readdir(src);
  await fs.ensureDir(dest);
  for (const fileName of filePaths) {
    const fileStat = await fs.lstat(`${src}/${fileName}`);
    if (fileStat.isDirectory()) {
      await copyDir(`${src}/${fileName}`, `${dest}/${fileName}`, options);
    } else {
      await copyFile(`${src}/${fileName}`, `${dest}/${fileName}`, options);
    }
  }
};

const copy = async (src, dest, options) => {
  const fileStat = await fs.lstat(src);
  if (fileStat.isDirectory()) {
    await copyDir(src, dest, options);
  } else {
    await copyFile(src, dest, options);
  }
};

export default copy;
