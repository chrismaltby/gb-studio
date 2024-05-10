/* eslint-disable camelcase */
import Octokit from "@octokit/rest";
import { writeJSON } from "fs-extra";

const octokit = new Octokit({});

const main = async () => {
  const contributors = await octokit.paginate(
    "GET /repos/chrismaltby/gb-studio/contributors",
    {
      owner: "octocat",
      repo: "gb-studio",
      per_page: 100,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
  writeJSON("./contributors.json", contributors, {
    spaces: 2,
  });
};

main();
