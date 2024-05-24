import { writeJSON } from "fs-extra";
import currentPatrons from "../../patrons.json";

if (!process.env.PATREON_ACCESS_TOKEN) {
  console.log("Env variable PATREON_ACCESS_TOKEN is not set");
  process.exit();
}

if (!process.env.PATREON_CAMPAIGN_ID) {
  console.log("Env variable PATREON_CAMPAIGN_ID is not set");
  process.exit();
}

const ACCESS_TOKEN = process.env.PATREON_ACCESS_TOKEN;
const CAMPAIGN_ID = process.env.PATREON_CAMPAIGN_ID;

const SILVER_TIER_ID = "22845707";
const GOLD_TIER_ID = "22845730";

const BASE_URL = "https://www.patreon.com/api/oauth2/v2";

interface PatreonMember {
  id: string;
  relationships: {
    currently_entitled_tiers: {
      data: { id: string }[];
    };
    user: {
      data: { id: string };
    };
  };
}

interface PatreonUser {
  type: "user";
  id: string;
  attributes: {
    vanity: string;
    full_name: string;
  };
}

interface PatreonTier {
  type: "tier";
  id: string;
  attributes: {
    title: string;
  };
}

interface LatestPatrons {
  goldTier: string[];
  silverTier: string[];
}

interface Patrons {
  goldTier: string[];
  silverTier: string[];
  pastPatrons: string[];
}

interface PatreonMembersAPIResponse {
  data: PatreonMember[];
  included: Array<PatreonUser | PatreonTier>;
  links?: {
    next?: string;
  };
}

const caseInsensitiveSort = (a: string, b: string) =>
  a.toLowerCase().localeCompare(b.toLowerCase());

const fetchPatreonAPI = async (url: string) => {
  const headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Error from Patreon API: ${response.statusText}`);
  }
  return response.json();
};

const onlyUnique = <T>(value: T, index: number, array: T[]): boolean =>
  array.indexOf(value) === index;

const fetchPatrons = async (): Promise<LatestPatrons> => {
  const usersLookup: Record<string, PatreonUser> = {};
  const tiersLookup: Record<string, PatreonTier> = {};

  const goldTierUserIds = new Set<string>();
  const silverTierUserIds = new Set<string>();

  const initialEndpoint = `${BASE_URL}/campaigns/${CAMPAIGN_ID}/members?include=user,currently_entitled_tiers&fields%5Buser%5D=full_name,vanity&fields%5Btier%5D=title`;

  const fetchPage = async (url: string) => {
    console.log("Fetching: " + url);
    const res = (await fetchPatreonAPI(url)) as PatreonMembersAPIResponse;
    res.data.forEach((member) => {
      if (
        member.relationships.currently_entitled_tiers.data.some(
          (tier) => tier.id === GOLD_TIER_ID
        )
      ) {
        console.log("GOLD TIER: " + member.relationships.user.data.id);
        goldTierUserIds.add(member.relationships.user.data.id);
      } else if (
        member.relationships.currently_entitled_tiers.data.some(
          (tier) => tier.id === SILVER_TIER_ID
        )
      ) {
        console.log("SILVER TIER: " + member.relationships.user.data.id);
        silverTierUserIds.add(member.relationships.user.data.id);
      }
    });

    res.included.forEach((entry) => {
      if (entry.type === "user") {
        usersLookup[entry.id] = entry;
      } else if (entry.type === "tier") {
        tiersLookup[entry.id] = entry;
      }
    });

    if (res.links?.next) {
      await fetchPage(res.links.next);
    }
  };

  const toUserName = (id: string): string => {
    const user = usersLookup[id];
    return user.attributes.full_name;
  };

  await fetchPage(initialEndpoint);

  return {
    goldTier: Array.from(goldTierUserIds)
      .map(toUserName)
      .filter(onlyUnique)
      .sort(caseInsensitiveSort),
    silverTier: Array.from(silverTierUserIds)
      .map(toUserName)
      .filter(onlyUnique)
      .sort(caseInsensitiveSort),
  };
};

const mergePatrons = (
  newPatrons: LatestPatrons,
  prevPatrons: Patrons
): Patrons => {
  const currentAllTierPatrons = [
    ...newPatrons.goldTier,
    ...newPatrons.silverTier,
  ];
  return {
    goldTier: newPatrons.goldTier,
    silverTier: newPatrons.silverTier,
    pastPatrons: [
      ...prevPatrons.goldTier,
      ...prevPatrons.silverTier,
      ...prevPatrons.pastPatrons,
    ]
      .filter((value) => !currentAllTierPatrons.includes(value))
      .filter(onlyUnique)
      .sort(caseInsensitiveSort),
  };
};

const main = async () => {
  const newPatrons = await fetchPatrons();
  const mergedPatrons = mergePatrons(newPatrons, currentPatrons);
  writeJSON("./patrons.json", mergedPatrons, {
    spaces: 2,
  });
};

main();

export {};
