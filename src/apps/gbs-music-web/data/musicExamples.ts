interface MusicExample {
  filename: string;
  displayName: string;
  artistName: string;
  url: string;
}

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
export const musicExamples: MusicExample[] = [
  {
    filename: "Rulz_BattleTheme.uge",
    displayName: "Battle Theme",
    artistName: "Rulz",
    url: require("../../../../appData/templates/gbs2/assets/music/Rulz_BattleTheme.uge") as string,
  },
  {
    filename: "Rulz_FastPaceSpeedRace.uge",
    displayName: "Fast Pace Speed Race",
    artistName: "Rulz",
    url: require("../../../../appData/templates/gbs2/assets/music/Rulz_FastPaceSpeedRace.uge") as string,
  },
  {
    filename: "Rulz_GonaSpace.uge",
    displayName: "Gona Space",
    artistName: "Rulz",
    url: require("../../../../appData/templates/gbs2/assets/music/Rulz_GonaSpace.uge") as string,
  },
  {
    filename: "Rulz_Into the woods.uge",
    displayName: "Into The Woods",
    artistName: "Rulz",
    url: require("../../../../appData/templates/gbs2/assets/music/Rulz_Into the woods.uge") as string,
  },
  {
    filename: "Rulz_Intro.uge",
    displayName: "Intro",
    artistName: "Rulz",
    url: require("../../../../appData/templates/gbs2/assets/music/Rulz_Intro.uge") as string,
  },
  {
    filename: "Rulz_LightMood.uge",
    displayName: "Light Mood",
    artistName: "Rulz",
    url: require("../../../../appData/templates/gbs2/assets/music/Rulz_LightMood.uge") as string,
  },
  {
    filename: "Rulz_Outside.uge",
    displayName: "Outside",
    artistName: "Rulz",
    url: require("../../../../appData/templates/gbs2/assets/music/Rulz_Outside.uge") as string,
  },
  {
    filename: "Rulz_Pause_Underground.uge",
    displayName: "Pause / Underground",
    artistName: "Rulz",
    url: require("../../../../appData/templates/gbs2/assets/music/Rulz_Pause_Underground.uge") as string,
  },
  {
    filename: "Rulz_SpaceEmergency.uge",
    displayName: "Space Emergency",
    artistName: "Rulz",
    url: require("../../../../appData/templates/gbs2/assets/music/Rulz_SpaceEmergency.uge") as string,
  },
  {
    filename: "Rulz_UndergroundCave.uge",
    displayName: "Underground Cave",
    artistName: "Rulz",
    url: require("../../../../appData/templates/gbs2/assets/music/Rulz_UndergroundCave.uge") as string,
  },
  {
    filename: "Tronimal_DrumsExample.uge",
    displayName: "Drums Example",
    artistName: "Tronimal",
    url: require("../../../../appData/templates/gbs2/assets/music/Tronimal_DrumsExample.uge") as string,
  },
  {
    filename: "Tronimal_EchoExample.uge",
    displayName: "Echo Example",
    artistName: "Tronimal",
    url: require("../../../../appData/templates/gbs2/assets/music/Tronimal_EchoExample.uge") as string,
  },
];
/* eslint-enable @typescript-eslint/no-var-requires */
