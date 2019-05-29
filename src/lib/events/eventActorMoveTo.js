import { getActorIndex } from "./helpers";
import l10n from "../helpers/l10n";
import {
  commandIndex as cmd,
  ACTOR_SET_ACTIVE,
  ACTOR_MOVE_TO
} from "./scriptCommands";

export const key = "EVENT_ACTOR_MOVE_TO";

export const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "x",
    label: l10n("FIELD_X"),
    type: "number",
    min: 0,
    max: 32,
    width: "50%",
    defaultValue: 0
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    type: "number",
    min: 0,
    max: 32,
    width: "50%",
    defaultValue: 0
  }
];

export const compile = (input, output, options) => {
  const { scene } = options;
  const actorIndex = getActorIndex(input.args.actorId, scene);
  const x = input.args.x || 0;
  const y = input.args.y || 0;

  output.push(cmd(ACTOR_SET_ACTIVE));
  output.push(actorIndex);
  output.push(cmd(ACTOR_MOVE_TO));
  output.push(x);
  output.push(y);
};
