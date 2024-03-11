import loadAllScriptEvents, {
  ScriptEventHandlersLookup,
} from "lib/project/loadScriptEvents";

export const getTestScriptHandlersLookup =
  async (): Promise<ScriptEventHandlersLookup> => {
    const projectPath = `${__dirname}/data/projects/BlankProject/BlankProject.gbsproj`;
    return loadAllScriptEvents(projectPath);
  };
