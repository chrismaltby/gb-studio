const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_FACE_PLAYER";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$"
  },
  {
    key: "faceDirection",
    label: l10n("FIELD_DIRECTION"),
    width: "50%",
    type: "select",
    options: [
      ["all", "✥ " + l10n("FIELD_ALL_DIRECTIONS")],
      ["horizontal", "↔ " + l10n("FIELD_HORIZONTAL_ONLY")],
      ["vertical", "↕ " + l10n("FIELD_VERTICAL_ONLY")]
    ],
    defaultValue: "all"
  },
  {
    key: "invertDirection",
    label: l10n("FIELD_INVERT"),
    width: "50%",
    alignCheckbox: true,
    type: "checkbox",
    defaultValue: false
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorFacePlayer, actorFacePlayerHorizontal, actorFacePlayerVertical } = helpers;
  actorSetActive(input.actorId);
  let invert = input.invertDirection ? 1 : 0;
  switch(input.faceDirection) {
    case "all":
      actorFacePlayer(invert);
      break;
    case "horizontal":
      actorFacePlayerHorizontal(invert);
      break;
    case "vertical":
      actorFacePlayerVertical(invert);
      break;
    default:
      actorFacePlayer(invert);
  }
};

module.exports = {
  id,
  fields,
  compile
};

