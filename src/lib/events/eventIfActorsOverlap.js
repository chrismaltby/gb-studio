import l10n from "../helpers/l10n";

export const id = "EVENT_IF_ACTORS_OVERLAP";

export const fields = [
  {
    key: "actorId1",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "actorId2",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "true",
    type: "events"
  },
  {
    key: "__collapseElse",
    label: l10n("FIELD_ELSE"),
    type: "collapsable",
    defaultValue: false,
    conditions: [
      {
        key: "__disableElse",
        ne: true
      }
    ]
  },
  {
    key: "false",
    conditions: [
      {
        key: "__collapseElse",
        ne: true
      },
      {
        key: "__disableElse",
        ne: true
      }
    ],
    type: "events"
  }
];

export const compile = (input, helpers) => {
  const { ifActorsOverlap } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifActorsOverlap(input.actorId1, input.actorId2, truePath, falsePath);
};
