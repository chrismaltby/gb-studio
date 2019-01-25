import fs from "fs-extra";

const loadProject = async path => {
  const data = await fs.readFile(path + "/project.json", "utf8");
  const json = JSON.parse(data);
  return json;
};

export default loadProject;
