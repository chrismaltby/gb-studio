import compile from "./src/lib/compiler/compileData";
import fs from "fs-extra";

/*
babel-node --presets env --plugins transform-object-rest-spread compile-example.js
*/

const projectPath =
  "/Users/chris/Library/Mobile Documents/com~apple~CloudDocs/GBJam/Untitled GB Game Test/project2.json";
const projectRoot =
  "/Users/chris/Library/Mobile Documents/com~apple~CloudDocs/GBJam/Untitled GB Game Test";
const outputRoot = "/Users/chris/Desktop/out/";

const build = async () => {
  const data = await fs.readJson(projectPath);
  const compiledData = await compile(data, {
    projectRoot,
    eventEmitter: {
      emit: (key, msg) => {
        console.log(new Date() + ": " + key + " - " + msg);
      }
    }
  });
  for (let filename in compiledData) {
    await fs.writeFile(`${outputRoot}${filename}`, compiledData[filename]);
  }
};

build();
