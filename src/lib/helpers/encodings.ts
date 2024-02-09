import fs from "fs";
import glob from "glob";
import Path from "path";
import { localesRoot } from "consts";

interface EncodingData {
  name: string;
  mapping: Record<string, number | undefined>;
}

type EncodingDef = EncodingData & {
  id: string;
};

const encodingsPath = `${localesRoot}/encodings/*.json`;

export const encodings: EncodingDef[] = glob.sync(encodingsPath).map((path) => {
  try {
    const data = JSON.parse(fs.readFileSync(path, "utf8"));
    return {
      id: Path.basename(path, ".json"),
      ...data,
    };
  } catch (e) {
    return {
      id: Path.basename(path, ".json"),
      name: e.toString(),
      mapping: {},
    };
  }
});
