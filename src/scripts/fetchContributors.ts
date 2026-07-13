/* eslint-disable camelcase */
import { Octokit } from "@octokit/rest";
import { writeJSON } from "fs-extra";

console.log("Fetching Github Contributors");

if (!process.env.CREDITS_GITHUB_ACCESS_TOKEN) {
  console.log("Env variable CREDITS_GITHUB_ACCESS_TOKEN is not set");
  process.exit();
}

const ACCESS_TOKEN = process.env.CREDITS_GITHUB_ACCESS_TOKEN;

const octokit = new Octokit({});

type Contributor = Awaited<
  ReturnType<typeof octokit.rest.repos.listContributors>
>["data"][number];

const hasLogin = (
  contributor: Contributor,
): contributor is Contributor & { login: string } => {
  return typeof contributor.login === "string";
};

const main = async () => {
  const contributors = (
    await octokit.paginate(octokit.rest.repos.listContributors, {
      owner: "chrismaltby",
      repo: "gb-studio",
      per_page: 100,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    })
  )
    .filter(hasLogin)
    .filter((contributor) => {
      // Filter out bots
      return !contributor.login.includes("[bot]");
    })
    .sort((a, b) => {
      // Sort highest contributions first
      return b.contributions - a.contributions;
    })
    .map((contributor) => {
      return {
        login: contributor.login,
        html_url: contributor.html_url,
        group: contributor.contributions >= 10 ? "gold" : "silver",
      };
    });

  await writeJSON("./contributors.json", contributors, {
    spaces: 2,
  });
};

main().then(() => console.log("Fetched Github Contributors!"));

export {};
