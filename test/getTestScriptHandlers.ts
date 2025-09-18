import loadAllScriptEventHandlers from "lib/project/loadScriptEventHandlers";
import { ScriptEventHandlers } from "lib/scriptEventsHandlers/handlerTypes";

export const getTestScriptHandlers = async (): Promise<ScriptEventHandlers> => {
  const projectPath = `${__dirname}/data/projects/BlankProject/BlankProject.gbsproj`;
  return loadAllScriptEventHandlers(projectPath);
};
