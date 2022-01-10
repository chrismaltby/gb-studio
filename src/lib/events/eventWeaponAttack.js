const l10n = require("../helpers/l10n").default;

const id = "EVENT_WEAPON_ATTACK";
const groups = ["EVENT_GROUP_ACTOR"];

const fields = [
  {
    key: "spriteSheetId",
    type: "sprite",
    label: l10n("FIELD_SPRITE_SHEET"),
    defaultValue: "LAST_SPRITE",
  },
  {
    key: "actorId",
    type: "actor",
    label: l10n("FIELD_SOURCE"),
    defaultValue: "$self$",
    width: "50%",
  },
  {
    key: "offset",
    type: "number",
    label: l10n("FIELD_OFFSET"),
    defaultValue: 10,
    min: 0,
    max: 64,
    width: "50%",
  },
  {
    key: "collisionGroup",
    label: l10n("FIELD_COLLISION_GROUP"),
    type: "collisionMask",
    width: "50%",
    includePlayer: false,
    defaultValue: "3",
  },
  {
    key: "collisionMask",
    label: l10n("FIELD_COLLIDE_WITH"),
    type: "collisionMask",
    width: "50%",
    includePlayer: true,
    defaultValue: ["1"],
  },
];

const compile = (input, helpers) => {
  const { weaponAttack, actorSetActive } = helpers;
  const offset =
    input.offset === "" || input.offset === undefined || input.offset === null
      ? 10
      : input.offset;
  actorSetActive(input.actorId);
  weaponAttack(
    input.spriteSheetId,
    offset,
    input.collisionGroup,
    input.collisionMask
  );
};

module.exports = {
  id,
  deprecated: true,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
