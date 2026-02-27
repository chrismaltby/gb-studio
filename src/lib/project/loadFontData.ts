import glob from "glob";
import { promisify } from "util";
import uuid from "uuid/v4";
import { createReadStream, readJson } from "fs-extra";
import { stat } from "fs";
import { PNG } from "pngjs";

import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { toValidSymbol } from "shared/lib/helpers/symbols";
import { FontResource, FontResourceAsset } from "shared/lib/resources/types";
import { getAssetResource } from "./assets";

const globAsync = promisify(glob);
const statAsync = promisify(stat);

const sizeOfAsync = (
  filename: string,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    createReadStream(filename)
      .pipe(new PNG())
      .on("metadata", resolve)
      .on("error", reject);
  });
};

const loadFontData =
  (projectRoot: string) =>
  async (filename: string): Promise<FontResourceAsset | null> => {
    const { file, plugin } = parseAssetPath(filename, projectRoot, "fonts");
    const resource = await getAssetResource(FontResource, filename);
    try {
      const size = await sizeOfAsync(filename);
      const fileStat = await statAsync(filename, { bigint: true });
      const inode = fileStat.ino.toString();

      const metadataFilename = filename.replace(/\.png$/i, ".json");
      let mapping: Record<string, number> = {};
      let tableMapping: Record<string, number> = {};
      let name: string = file.replace(/.png/i, "");
      try {
        const metadataFile = await readJson(metadataFilename);
        if (typeof metadataFile === "object"){
          if (metadataFile.mapping && typeof metadataFile.mapping === "object") {
            mapping = metadataFile.mapping;
          }
          if (metadataFile.table && typeof metadataFile.table === "object") {
            tableMapping = metadataFile.table;
          }
          if (metadataFile.name) {
            name = metadataFile.name;
          }
        }
      } catch (e) {}      
      
      let table = (Array.from(Array(256)) as number[]).fill(-1);
      
      if (Object.keys(tableMapping).length){
        //get highest mapped char
        const mappingKeys = Object.keys(tableMapping).map((mappingKey)=> {return mappingKey.charCodeAt(0);}).filter((charcode)=> {return charcode < 256;});
        const maxValue = Math.max(...mappingKeys) + 1;
        //adjust the table size to fit tableMapping
        if (table.length < maxValue){
          table = table.concat((Array.from(Array(maxValue - table.length)) as number[]).fill(-1));
        }    
        //modify the table with the tableMapping
        Object.entries(tableMapping).forEach(([key, value]) => {
            const tableIndex = key.charCodeAt(0); //get ascii value of mapped char
            if (tableIndex < 256) {
              table[tableIndex] = value; //assign mapped value to table
            }
        });
  }

      return {
        _resourceType: "font",
        id: uuid(),
        plugin,
        name,
        symbol: toValidSymbol(`font_${name}`),
        _v: Date.now(),
        ...resource,
        width: size.width,
        height: size.height,
        mapping,
        table,
        filename: file,
        inode,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  };

const loadAllFontData = async (
  projectRoot: string,
): Promise<FontResourceAsset[]> => {
  const imagePaths = await globAsync(
    `${projectRoot}/assets/fonts/**/@(*.png|*.PNG)`,
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/*/**/fonts/**/@(*.png|*.PNG)`,
  );
  const imageData = (
    await Promise.all(
      ([] as Promise<FontResourceAsset | null>[]).concat(
        imagePaths.map(loadFontData(projectRoot)),
        pluginPaths.map(loadFontData(projectRoot)),
      ),
    )
  ).filter((i) => i);
  return imageData as FontResourceAsset[];
};

export default loadAllFontData;
export { loadFontData };
