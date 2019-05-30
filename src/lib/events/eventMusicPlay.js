import l10n from "../helpers/l10n";

export const id = "EVENT_MUSIC_PLAY";

export const fields = [
  {
    key: "musicId",
    type: "music",
    defaultValue: "LAST_MUSIC"
  },
  {
    key: "loop",
    label: l10n("FIELD_LOOP"),
    type: "checkbox",
    defaultValue: true
  }
];

export const compile = (input, helpers) => {
  const { playMusic } = helpers;
  playMusic(input.musicId, input.loop);
};
