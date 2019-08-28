import l10n from "../helpers/l10n";
import { DIR_LOOKUP } from "../compiler/helpers.js";

export const id = "EVENT_ACTOR_GET_DIRECTION";

export const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "direction",
    type: "variable",
    //label: l10n("FIELD_X"),
    defaultValue: "LAST_VARIABLE"
  }
];

export const compile = (input, helpers) => {
  const { actorSetActive, ifActorDirection, variableSetToValue } = helpers;
  actorSetActive(input.actorId);
  ifActorDirection(
    "down", 
    function() { 
      variableSetToValue(input.direction, 1);
      return;
    }, 
    function() { 
      ifActorDirection(
        "left", 
        function() { 
          variableSetToValue(input.direction, 2);
          return;
        }, 
        function() { 
          ifActorDirection(
            "right", 
            function() { 
              variableSetToValue(input.direction, 4);
              return;
            }, 
            function() { 
              variableSetToValue(input.direction, 8);
              return;
            }
          )
        }
      )
    }
  )
};
