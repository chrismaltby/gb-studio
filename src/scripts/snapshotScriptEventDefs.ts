import { Command } from "commander";
import { eventsRoot } from "consts";
import { readFile, writeJSON } from "fs-extra";
import { glob } from "lib/helpers/glob";
import { scriptEventDefsToSnapshot } from "lib/project/migration/snapshots/scriptEventDefs";
import { loadScriptEventHandlerFromTrustedString } from "lib/scriptEventsHandlers/trustedHandler";
import { join } from "path";

const parseFieldTypes = (value: string) =>
  value
    .split(",")
    .map((fieldType) => fieldType.trim())
    .filter(Boolean);

const program = new Command()
  .requiredOption("--tag <tag>", "Snapshot tag used in the output filename")
  .option(
    "--fieldTypes <fieldTypes>",
    "Comma-separated field types to include",
    parseFieldTypes,
  )
  .parse();

const options = program.opts<{
  tag: string;
  fieldTypes?: string[];
}>();

if (!/^[a-zA-Z0-9_-]+$/.test(options.tag)) {
  throw new Error(
    "Snapshot tag may only contain letters, numbers, underscores, and hyphens",
  );
}

const main = async () => {
  const eventPaths = await glob("event*.js", {
    cwd: eventsRoot,
    absolute: true,
  });
  const handlers = await Promise.all(
    eventPaths.map(async (eventPath) =>
      loadScriptEventHandlerFromTrustedString(
        await readFile(eventPath, "utf8"),
        eventPath,
      ),
    ),
  );
  const scriptEventDefs = Object.fromEntries(
    handlers.map((handler) => [handler.id, handler]),
  );
  const snapshot = scriptEventDefsToSnapshot(
    scriptEventDefs,
    options.fieldTypes,
  );
  const outputPath = join(
    process.cwd(),
    "src",
    "lib",
    "project",
    "migration",
    "snapshots",
    `scriptEventDefs${options.tag}.json`,
  );

  await writeJSON(outputPath, snapshot, { spaces: 2 });
  console.log(
    `Wrote ${Object.keys(snapshot).length} definitions to ${outputPath}`,
  );

  for (const handler of handlers) {
    handler.cleanup();
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
