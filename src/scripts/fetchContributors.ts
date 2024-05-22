/* eslint-disable camelcase */
import Octokit from "@octokit/rest";
import { writeJSON } from "fs-extra";

if (!process.env.CREDITS_GITHUB_ACCESS_TOKEN) {
  console.log("Env variable CREDITS_GITHUB_ACCESS_TOKEN is not set");
  process.exit();
}

const ACCESS_TOKEN = process.env.CREDITS_GITHUB_ACCESS_TOKEN;

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
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    }
  );
  writeJSON("./contributors.json", contributors, {
    spaces: 2,
  });
};

main();
