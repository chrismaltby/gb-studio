import glob from "glob";
import Path from "path";
import { localesRoot } from "../../consts";

interface EncodingData {
  name: string;
  mapping: Record<string, number | undefined>;
}

type EncodingDef = EncodingData & {
  id: string;
};

const encodingsPath = `${localesRoot}/encodings/*.json`;

export const encodings: EncodingDef[] = glob.sync(encodingsPath).map((path) => {
  const data = __non_webpack_require__(path) as EncodingData;
  return {
    id: Path.basename(path, ".json"),
    ...data,
  };
});

export const encodeString = (inStr: string, encodingId: string) => {
  const encoding = encodings.find((encoding) => encoding.id === encodingId);
  let output = "";
  const nlStr = inStr.replace(/\n/g, "\\n");
  for (let i = 0; i < nlStr.length; i++) {
    let code = nlStr.charCodeAt(i);
    const mappedCode = encoding && encoding.mapping[nlStr.charAt(i)];
    if (mappedCode) {
      code = mappedCode;
    }
    if (code > 127 || code === 34) {
      output += "\\" + (code & 0xff).toString(8).padStart(3, "0");
    } else {
      output += String.fromCharCode(code);
    }
  }
  return output;
};
