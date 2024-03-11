import loadAllScriptEventHandlers, {
  ScriptEventHandlers,
} from "lib/project/loadScriptEventHandlers";

export const getTestScriptHandlers = async (): Promise<ScriptEventHandlers> => {
  const projectPath = `${__dirname}/data/projects/BlankProject/BlankProject.gbsproj`;
  return loadAllScriptEventHandlers(projectPath);
};
