import compile from "./src/lib/data/compiler/compileData";
import fs from "fs-extra";

/*
babel-node --presets env --plugins transform-object-rest-spread compile-example.js
*/

const projectPath =
  "/Users/cmaltby/Library/Mobile Documents/com~apple~CloudDocs/GBJam/Untitled GB Game Test/project2.json";
const projectRoot =
  "/Users/cmaltby/Library/Mobile Documents/com~apple~CloudDocs/GBJam/Untitled GB Game Test";
const outputRoot = "/Users/cmaltby/Desktop/out/";

const build = async () => {
  const data = await fs.readJson(projectPath);
  const compiledData = await compile(data, {
    projectRoot
  });
  for (let filename in compiledData) {
    await fs.writeFile(`${outputRoot}${filename}`, compiledData[filename]);
  }
};

build();
