import l10n from "../helpers/l10n";

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
  const { actorSetActive, ifActorDirection } = helpers;
  actorSetActive(input.actorId);
  ifActorDirection(
    "up", 
    function() { 
        return input.direction = "up";
    }, 
    function() { 
      ifActorDirection(
        "down", 
        function() { 
            return input.direction = "down";
        }, 
        function() { 
          ifActorDirection(
            "left", 
            function() { 
                return input.direction = "left";
            }, 
            function() { 
              return input.direction = "right";
            }
          )
        }
      )
    }
  )
};
