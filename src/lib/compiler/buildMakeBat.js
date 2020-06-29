import glob from "glob";
import { promisify } from "util";

const globAsync = promisify(glob);

export default async (
  buildRoot,
  { CART_TYPE, CART_SIZE, customColorsEnabled }
) => {
  const cmds = ["set __COMPAT_LAYER=WIN7RTM"];
  const objFiles = [];

  const CC = `..\\_gbs\\gbdk\\bin\\lcc`;
  let CFLAGS = `-Wa-l -Iinclude`;
  let LFLAGS = `-Wl-yo${CART_SIZE} -Wa-l -Wl-m -Wl-j -Wl-yt${CART_TYPE} -Wl-ya4`;

  if (customColorsEnabled) {
    CFLAGS += " -DCGB";
    LFLAGS += " -Wl-yp0x143=0x80";
  }

  const srcRoot = `${buildRoot}/src/**/*.@(c|s)`;
  const buildFiles = await globAsync(srcRoot);

  for (const file of buildFiles) {
    const objFile = `${file.replace(/src.*\//, "obj/").replace(/\.[cs]$/, "")}.o`;
    if(file.indexOf("data/bank_") == -1 && file.indexOf("music/music_bank_") == -1) {
     cmds.push(`${CC} ${CFLAGS} -c -o ${objFile} ${file}`);
    }
    objFiles.push(objFile);
  }

  cmds.push(`${CC} ${LFLAGS} -o build/rom/game.gb ${objFiles.join(" ")}`);

  return cmds.join("\n");
};
