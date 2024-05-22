import { readFile } from "fs-extra";
import Path from "path";

type ValidateOptions = {
  buildRoot: string;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

export const validateEjectedBuild = async ({
  buildRoot,
  progress = (_msg) => {},
  warnings = (_msg) => {},
}: ValidateOptions) => {
  const vmIncludePath = Path.join(buildRoot, "include/vm.h");
  const gameGlobalsPath = Path.join(buildRoot, "include/data/game_globals.i");
  const vmInclude = await readFile(vmIncludePath, "utf8");
  const gameGlobals = await readFile(gameGlobalsPath, "utf8");

  const vmHeapSizeStr = vmInclude.match(/#define VM_HEAP_SIZE (\d+)/m)?.[1];
  const maxGlobalVarsStr = gameGlobals.match(/MAX_GLOBAL_VARS = (\d+)/m)?.[1];

  const vmHeapSize = parseInt(vmHeapSizeStr ?? "", 10);
  const maxGlobalVars = parseInt(maxGlobalVarsStr ?? "", 10);

  progress(`Validating build files...`);

  if (isNaN(vmHeapSize) || isNaN(maxGlobalVars)) {
    warnings(
      "Unable to read VM_HEAP_SIZE and MAX_GLOBAL_VARS to determine if project contains too many unique variables"
    );
  }

  if (maxGlobalVars > vmHeapSize) {
    warnings(
      `Your project contains too many unique variables and will not work as expected. VM_HEAP_SIZE defines the maximum amount of variables allowed ${vmHeapSize} but your project contained ${maxGlobalVars} unique variables.`
    );
  }
};
