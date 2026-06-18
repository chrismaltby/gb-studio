// GBA Studio - GBA build "eject" step.
//
// Counterpart to ejectBuild.ts for the GBA target. Instead of writing a GBDK
// project tree, it turns the start scene's compiled GBVM assembly into gbavm
// bytecode (parseGbvmAsm -> emitGbaBytecode -> formatGbaProgramC) and writes it
// as the engine's src/game_script.c. makeGbaBuild then compiles the gbavm engine.
//
// M2 scope (see the editor->GBA pipeline notes): a single self-contained
// start-scene-init blob - no multi-script linking, no engine-symbol memory
// model, no per-project asset conversion. The build happens in the gbavm engine
// tree (gbaEngineRoot); an isolated/vendored build dir is a later packaging
// concern.

import { writeFile, ensureDir, pathExists } from "fs-extra";
import Path from "path";
import { gbaEngineRoot } from "consts";
import { ProjectResources } from "shared/lib/resources/types";
import { parseGbvmAsm } from "./parseGbvmAsm";
import { emitGbaBytecode, formatGbaProgramC } from "./emitGbaBytecode";

type EjectGbaOptions = {
  projectData: ProjectResources;
  outputRoot: string;
  compiledData: {
    files: Record<string, string>;
  };
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

const ejectGbaBuild = async ({
  projectData,
  outputRoot,
  compiledData,
  progress,
  warnings,
}: EjectGbaOptions) => {
  if (!(await pathExists(Path.join(gbaEngineRoot, "Makefile")))) {
    throw new Error(
      `GBA build: gbavm engine not found at ${gbaEngineRoot} (set the GBAVM_ROOT environment variable).`,
    );
  }

  // Resolve the start scene exactly as compileData does (settings.startSceneId,
  // falling back to the first scene), then locate its compiled init script.
  const { settings, scenes } = projectData;
  const startScene =
    scenes.find((scene) => scene.id === settings.startSceneId) ?? scenes[0];
  if (!startScene) {
    throw new Error("GBA build: project has no scenes to build");
  }
  // compileData keys per-scene init scripts as `${scene.symbol}_init.s`.
  const scriptKey = `${startScene.symbol}_init.s`;
  const asm = compiledData.files[scriptKey];
  if (asm === undefined) {
    throw new Error(
      `GBA build: start scene init script "${scriptKey}" not found in compiled output`,
    );
  }

  progress(`Generating GBA bytecode from ${scriptKey}...`);
  const { items, skipped } = parseGbvmAsm(asm);
  for (const note of skipped) {
    warnings(`GBA: deferred unsupported instruction "${note}"`);
  }
  const program = emitGbaBytecode(items);

  await ensureDir(Path.join(gbaEngineRoot, "src"));
  await writeFile(
    Path.join(gbaEngineRoot, "src", "game_script.c"),
    formatGbaProgramC("game_script", program) + "\n",
  );
  // The built .gba is collected here by makeGbaBuild (mirrors build/rom for GBDK).
  await ensureDir(Path.join(outputRoot, "build", "gba"));

  progress(
    `GBA bytecode: ${program.bytes.length} bytes, ${program.relocations.length} relocations`,
  );
};

export default ejectGbaBuild;
