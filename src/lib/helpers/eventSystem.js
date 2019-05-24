import uuid from "uuid/v4";

const walkEvents = (events = [], callback) => {
  for (let i = 0; i < events.length; i++) {
    callback(events[i]);
    if (events[i].true) {
      walkEvents(events[i].true, callback);
    }
    if (events[i].false) {
      walkEvents(events[i].false, callback);
    }
  }
};

const walkEventsDepthFirst = (events = [], callback) => {
  for (let i = 0; i < events.length; i++) {
    if (events[i].true) {
      walkEvents(events[i].true, callback);
    }
    if (events[i].false) {
      walkEvents(events[i].false, callback);
    }
    callback(events[i]);
  }
};

const walkScenesEvents = (scenes, callback) => {
  scenes.forEach(scene => {
    walkSceneEvents(scene, callback);
  });
};

const walkSceneEvents = (scene, callback) => {
  walkEvents(scene.script, callback);
  scene.actors.forEach(actor => {
    walkEvents(actor.script, callback);
  });
  scene.triggers.forEach(trigger => {
    walkEvents(trigger.script, callback);
  });
};

const findSceneEvent = (scene, callback) => {
  let event = null;
  let fn = callback;
  if (typeof fn === "string") {
    const id = fn;
    fn = walkEvent => {
      return walkEvent.id === id;
    };
  }
  try {
    walkSceneEvents(scene, walkEvent => {
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

const patchEvents = (data, id, patch) => {
  return data.reduce((memo, o) => {
    return [].concat(
      memo,
      Object.assign(
        {},
        o,
        o.true && {
          true: patchEvents(o.true, id, patch)
        },
        o.false && {
          false: patchEvents(o.false, id, patch)
        },
        o.id === id && {
          args: {
            ...o.args,
            ...patch
          }
        }
      )
    );
  }, []);
};

const prependEvent = (data, id, newData) => {
  return data.reduce((memo, o) => {
    return [].concat(
      memo,
      o.id === id ? newData : [],
      Object.assign(
        {},
        o,
        o.true && {
          true: prependEvent(o.true, id, newData)
        },
        o.false && {
          false: prependEvent(o.false, id, newData)
        }
      )
    );
  }, []);
};

const appendEvent = (data, id, newData) => {
  return data.reduce((memo, o) => {
    return [].concat(
      memo,
      Object.assign(
        {},
        o,
        o.true && {
          true: appendEvent(o.true, id, newData)
        },
        o.false && {
          false: appendEvent(o.false, id, newData)
        }
      ),
      o.id === id ? newData : []
    );
  }, []);
};

const regenerateEventIds = event => {
  return Object.assign(
    {},
    event,
    {
      id: uuid()
    },
    event.true && {
      true: event.true.map(regenerateEventIds)
    },
    event.false && {
      false: event.false.map(regenerateEventIds)
    }
  );
};

const filterEvents = (data, id) => {
  return data.reduce((memo, o) => {
    if (o.id !== id) {
      memo.push({
        ...o,
        true: o.true && filterEvents(o.true, id),
        false: o.false && filterEvents(o.false, id)
      });
    }
    return memo;
  }, []);
};

const findEvent = (data, id) => {
  let r = null;
  for (let i = 0; i < data.length; i++) {
    const o = data[i];
    if (o.id === id) {
      return o;
    }
    if (o.true) {
      r = findEvent(o.true, id);
      if (r) return r;
    }
    if (o.false) {
      r = findEvent(o.false, id);
      if (r) return r;
    }
  }
  return r;
};

export {
  walkEvents,
  walkEventsDepthFirst,
  walkScenesEvents,
  walkSceneEvents,
  findSceneEvent,
  patchEvents,
  prependEvent,
  appendEvent,
  regenerateEventIds,
  filterEvents,
  findEvent
};
