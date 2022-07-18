/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dictionary } from "@reduxjs/toolkit";
import { EventHandler } from "lib/events";
import mapValues from "lodash/mapValues";
import uuid from "uuid/v4";
import {
  EVENT_CALL_CUSTOM_EVENT,
  EVENT_ENGINE_FIELD_SET,
  EVENT_ENGINE_FIELD_STORE,
} from "../compiler/eventTypes";

export interface EventLookup {
  eventsLookup: Dictionary<EventHandler>;
  engineFieldUpdateEventsLookup: Dictionary<EventHandler>;
  engineFieldStoreEventsLookup: Dictionary<EventHandler>;
}

const mapEvents = (events: any[] = [], callback: (e: any) => any) => {
  return events.map((event: any): any => {
    if (event && event.children) {
      const newEvent = callback(event);
      return {
        ...newEvent,
        children: mapValues(
          newEvent.children || event.children,
          (childEvents) => mapEvents(childEvents, callback)
        ),
      };
    }
    if (!event) {
      return event;
    }
    return callback(event);
  });
};

const mapSceneEvents = (scene: any, callback: any) => {
  return {
    ...scene,
    script: mapEvents(scene.script, callback),
    playerHit1Script: mapEvents(scene.playerHit1Script, callback),
    playerHit2Script: mapEvents(scene.playerHit2Script, callback),
    playerHit3Script: mapEvents(scene.playerHit3Script, callback),
    actors: scene.actors.map((actor: any) => {
      return {
        ...actor,
        script: mapEvents(actor.script, callback),
        startScript: mapEvents(actor.startScript, callback),
        updateScript: mapEvents(actor.updateScript, callback),
        hit1Script: mapEvents(actor.hit1Script, callback),
        hit2Script: mapEvents(actor.hit2Script, callback),
        hit3Script: mapEvents(actor.hit3Script, callback),
      };
    }),
    triggers: scene.triggers.map((trigger: any) => {
      return {
        ...trigger,
        script: mapEvents(trigger.script, callback),
        leaveScript: mapEvents(trigger.leaveScript, callback),
      };
    }),
  };
};

const mapScenesEvents = (scenes: any, callback: any) => {
  return scenes.map((scene: any) => {
    return mapSceneEvents(scene, callback);
  });
};

const walkEvents = (events: any = [], callback: any) => {
  for (let i = 0; i < events.length; i++) {
    callback(events[i]);
    if (events[i].children) {
      Object.keys(events[i].children).forEach((key) => {
        walkEvents(events[i].children[key], callback);
      });
    }
  }
};

const walkEventsDepthFirst = (events: any = [], callback: any) => {
  for (let i = 0; i < events.length; i++) {
    if (events[i].children) {
      Object.keys(events[i].children).forEach((key) => {
        walkEvents(events[i].children[key], callback);
      });
    }
    callback(events[i]);
  }
};

const walkSceneSpecificEvents = (scene: any, callback: any) => {
  walkEvents(scene.script, callback);
  walkEvents(scene.playerHit1Script, callback);
  walkEvents(scene.playerHit2Script, callback);
  walkEvents(scene.playerHit3Script, callback);
};

const walkActorEvents = (actor: any, callback: any) => {
  walkEvents(actor.script, callback);
  walkEvents(actor.startScript, callback);
  walkEvents(actor.updateScript, callback);
  walkEvents(actor.hit1Script, callback);
  walkEvents(actor.hit2Script, callback);
  walkEvents(actor.hit3Script, callback);
};

const walkTriggerEvents = (trigger: any, callback: any) => {
  walkEvents(trigger.script, callback);
  walkEvents(trigger.leaveScript, callback);
};

const walkSceneEvents = (scene: any, callback: any) => {
  walkSceneSpecificEvents(scene, callback);
  scene.actors.forEach((actor: any) => {
    walkActorEvents(actor, callback);
  });
  scene.triggers.forEach((trigger: any) => {
    walkEvents(trigger.script, callback);
  });
};

const walkScenesEvents = (scenes: any, callback: any) => {
  scenes.forEach((scene: any) => {
    walkSceneEvents(scene, callback);
  });
};

const normalizedWalkSceneEvents = (
  scene: any,
  actorsLookup: any,
  triggersLookup: any,
  callback: any
) => {
  walkEvents(scene.script, callback);
  walkEvents(scene.playerHit1Script, callback);
  walkEvents(scene.playerHit2Script, callback);
  walkEvents(scene.playerHit3Script, callback);

  scene.actors.forEach((actorId: any) => {
    const actor = actorsLookup[actorId];
    walkEvents(actor.script, callback);
    walkEvents(actor.startScript, callback);
    walkEvents(actor.updateScript, callback);
    walkEvents(actor.hit1Script, callback);
    walkEvents(actor.hit2Script, callback);
    walkEvents(actor.hit3Script, callback);
  });
  scene.triggers.forEach((triggerId: any) => {
    walkEvents(triggersLookup[triggerId].script, callback);
  });
};

const normalizedFindSceneEvent = (
  scene: any,
  actorsLookup: any,
  triggersLookup: any,
  callback: any
) => {
  let event = null;
  let fn = callback;
  if (typeof fn === "string") {
    const id = fn;
    fn = (walkEvent: any) => {
      return walkEvent.id === id;
    };
  }
  try {
    normalizedWalkSceneEvents(
      scene,
      actorsLookup,
      triggersLookup,
      (walkEvent: any) => {
        if (fn(walkEvent)) {
          event = walkEvent;
          throw new Error("FOUND_EVENT");
        }
      }
    );
  } catch (err) {
    if (event) {
      return event;
    }
    throw err;
  }
  return event;
};

const findSceneEvent = (scene: any, callback: any) => {
  let event = null;
  let fn = callback;
  if (typeof fn === "string") {
    const id = fn;
    fn = (walkEvent: any) => {
      return walkEvent.id === id;
    };
  }
  try {
    walkSceneEvents(scene, (walkEvent: any) => {
      if (fn(walkEvent)) {
        event = walkEvent;
        throw new Error("FOUND_EVENT");
      }
    });
  } catch (err) {
    if (event) {
      return event;
    }
    throw err;
  }
  return event;
};

const patchEvents = (data: any, id: any, patch: any) => {
  return data.reduce((memo: any, o: any) => {
    return [].concat(
      memo,
      Object.assign(
        {},
        o,
        o.children && {
          children: mapValues(o.children, (childEvents) =>
            patchEvents(childEvents, id, patch)
          ),
        },
        o.id === id && {
          args: {
            ...o.args,
            ...patch,
          },
        }
      )
    );
  }, []);
};

const prependEvent = (data: any, id: any, newData: any) => {
  return data.reduce((memo: any, o: any) => {
    return [].concat(
      memo,
      o.id === id ? newData : [],
      Object.assign(
        {},
        o,
        o.children && {
          children: mapValues(o.children, (childEvents) =>
            prependEvent(childEvents, id, newData)
          ),
        }
      )
    );
  }, []);
};

const appendEvent = (data: any, id: any, newData: any) => {
  return data.reduce((memo: any, o: any) => {
    return [].concat(
      memo,
      Object.assign(
        {},
        o,
        o.children && {
          children: mapValues(o.children, (childEvents) =>
            appendEvent(childEvents, id, newData)
          ),
        }
      ),
      o.id === id ? newData : []
    );
  }, []);
};

const removeEventIds = (event: any) => {
  return Object.assign(
    {},
    event,
    {
      id: undefined,
    },
    event.children && {
      children: mapValues(event.children, (childEvents) =>
        childEvents.map(removeEventIds)
      ),
    }
  );
};

const regenerateEventIds = (event: any) => {
  return Object.assign(
    {},
    event,
    {
      id: uuid(),
      __type: undefined,
      __customEvents: undefined,
    },
    event.children && {
      children: mapValues(event.children, (childEvents) =>
        childEvents.map(regenerateEventIds)
      ),
    }
  );
};

const replaceEventActorIds = (replacementIds: any, event: any) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const events = require("../events").default;
  const eventSchema = events[event.command];

  if (!eventSchema) {
    return event;
  }

  const patchArgs: any = {};
  eventSchema.fields.forEach((field: any) => {
    if (field.type === "actor") {
      if (replacementIds[event.args[field.key]]) {
        patchArgs[field.key] = replacementIds[event.args[field.key]];
      }
    }
  });

  return {
    ...event,
    args: {
      ...event.args,
      ...patchArgs,
    },
  };
};

const filterEvents = (data: any = [], fn: any) => {
  return data.reduce((memo: any, o: any) => {
    if (fn(o)) {
      memo.push({
        ...o,
        children:
          o.children &&
          mapValues(o.children, (childEvents) => filterEvents(childEvents, fn)),
      });
    }
    return memo;
  }, []);
};

const filterSceneEvents = (scene: any, callback: any) => {
  return {
    ...scene,
    script: filterEvents(scene.script, callback),
    playerHit1Script: filterEvents(scene.playerHit1Script, callback),
    playerHit2Script: filterEvents(scene.playerHit2Script, callback),
    playerHit3Script: filterEvents(scene.playerHit3Script, callback),
    actors: scene.actors.map((actor: any) => {
      return {
        ...actor,
        script: filterEvents(actor.script, callback),
        startScript: filterEvents(actor.startScript, callback),
        updateScript: filterEvents(actor.updateScript, callback),
        hit1Script: filterEvents(actor.hit1Script, callback),
        hit2Script: filterEvents(actor.hit2Script, callback),
        hit3Script: filterEvents(actor.hit3Script, callback),
      };
    }),
    triggers: scene.triggers.map((trigger: any) => {
      return {
        ...trigger,
        script: filterEvents(trigger.script, callback),
      };
    }),
  };
};

const filterScenesEvents = (scenes: any, callback: any) => {
  return scenes.map((scene: any) => {
    return filterSceneEvents(scene, callback);
  });
};

const findEvent = (data: any, id: any): any => {
  let r = null;
  for (let i = 0; i < data.length; i++) {
    const o = data[i];
    if (o.id === id) {
      return o;
    }
    if (o.children) {
      const childPaths = Object.keys(o.children);
      for (let c = 0; c < childPaths.length; c++) {
        r = findEvent(o.children[childPaths[c]], id);
        if (r) return r;
      }
    }
  }
  return r;
};

const eventHasArg = (event: any, argName: any) => {
  return (
    event.args && Object.prototype.hasOwnProperty.call(event.args, argName)
  );
};

const getField = (cmd: any, fieldName: any, args: any, lookup: EventLookup) => {
  const {
    eventsLookup: events,
    engineFieldUpdateEventsLookup,
    engineFieldStoreEventsLookup,
  } = lookup;

  let event = events[cmd];

  if (
    cmd === EVENT_ENGINE_FIELD_SET &&
    args.engineFieldKey &&
    engineFieldUpdateEventsLookup[args.engineFieldKey]
  ) {
    event = engineFieldUpdateEventsLookup[args.engineFieldKey];
  } else if (
    cmd === EVENT_ENGINE_FIELD_STORE &&
    args.engineFieldKey &&
    engineFieldStoreEventsLookup[args.engineFieldKey]
  ) {
    event = engineFieldStoreEventsLookup[args.engineFieldKey];
  }

  if (!event) return false;

  const findFieldRecursive = (fields: any): any => {
    for (const field of fields) {
      if (field.key === fieldName) {
        return field;
      }
      if (field.type === "group" && field.fields) {
        const childField = findFieldRecursive(field.fields);
        if (childField) {
          return childField;
        }
      }
    }
  };

  return findFieldRecursive(event.fields);
};

const isFieldVisible = (field: any, args: any) => {
  if (!field.conditions) {
    return true;
  }
  // Determine if field conditions are met
  return field.conditions.reduce((memo: any, condition: any) => {
    const keyValue = args[condition.key];
    return (
      memo &&
      (!condition.eq || keyValue === condition.eq) &&
      (!condition.ne || keyValue !== condition.ne) &&
      (!condition.gt || Number(keyValue) > Number(condition.gt)) &&
      (!condition.gte || Number(keyValue) >= Number(condition.gte)) &&
      (!condition.lt || Number(keyValue) > Number(condition.lt)) &&
      (!condition.lte || Number(keyValue) >= Number(condition.lte)) &&
      (!condition.in || condition.in.indexOf(keyValue) >= 0)
    );
  }, true);
};

const isVariableField = (
  cmd: any,
  fieldName: any,
  args: any,
  lookup: EventLookup
) => {
  if (fieldName.startsWith("$variable[")) {
    return true;
  }
  const field = getField(cmd, fieldName, args, lookup);
  return (
    field &&
    (field.type === "variable" ||
      (field.type === "union" &&
        args[fieldName] &&
        args[fieldName].type === "variable")) &&
    isFieldVisible(field, args)
  );
};

const isActorField = (
  cmd: any,
  fieldName: any,
  args: any,
  lookup: EventLookup
) => {
  const field = getField(cmd, fieldName, args, lookup);
  return field && field.type === "actor" && isFieldVisible(field, args);
};

const isPropertyField = (
  cmd: any,
  fieldName: any,
  args: any,
  lookup: EventLookup
) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const events = require("../events").default;
  const event = events[cmd];
  if (!event) return false;
  const field = getField(cmd, fieldName, args, lookup);
  const fieldValue = args[fieldName];
  return (
    field &&
    (field.type === "property" ||
      (field.type === "union" && fieldValue.type === "property")) &&
    isFieldVisible(field, args)
  );
};

const getCustomEventIdsInEvents = (events: any) => {
  const customEventIds: any = [];
  walkEvents(events, (event: any) => {
    if (event.command === EVENT_CALL_CUSTOM_EVENT) {
      customEventIds.push(event.args.customEventId);
    }
  });
  return customEventIds;
};

const getCustomEventIdsInScene = (scene: any) => {
  const customEventIds: any = [];
  walkSceneEvents(scene, (event: any) => {
    if (event.command === EVENT_CALL_CUSTOM_EVENT) {
      customEventIds.push(event.args.customEventId);
    }
  });
  return customEventIds;
};

const getCustomEventIdsInActor = (actor: any) => {
  const customEventIds: any = [];
  walkActorEvents(actor, (event: any) => {
    if (event.command === EVENT_CALL_CUSTOM_EVENT) {
      customEventIds.push(event.args.customEventId);
    }
  });
  return customEventIds;
};

export {
  mapEvents,
  mapScenesEvents,
  mapSceneEvents,
  walkEvents,
  walkEventsDepthFirst,
  walkScenesEvents,
  walkSceneEvents,
  walkSceneSpecificEvents,
  walkActorEvents,
  walkTriggerEvents,
  findSceneEvent,
  normalizedWalkSceneEvents,
  normalizedFindSceneEvent,
  patchEvents,
  prependEvent,
  appendEvent,
  regenerateEventIds,
  replaceEventActorIds,
  removeEventIds,
  filterEvents,
  filterScenesEvents,
  filterSceneEvents,
  findEvent,
  eventHasArg,
  getField,
  isVariableField,
  isActorField,
  isPropertyField,
  getCustomEventIdsInEvents,
  getCustomEventIdsInScene,
  getCustomEventIdsInActor,
};
