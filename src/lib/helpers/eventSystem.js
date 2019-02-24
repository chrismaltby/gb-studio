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

const walkScenesEvents = (scenes, callback) => {
  scenes.forEach(scene => {
    scene.actors.forEach(actor => {
      walkEvents(actor.script, callback);
    });
    scene.triggers.forEach(trigger => {
      walkEvents(trigger.script, callback);
    });
  });
};

const patchEvents = (data, id, patch) => {
  return data.reduce((memo, o) => {
    if (o.true) {
      o = {
        ...o,
        true: patchEvents(o.true, id, patch)
      };
    }
    if (o.false) {
      o = {
        ...o,
        false: patchEvents(o.false, id, patch)
      };
    }
    if (o.id === id) {
      memo.push({
        ...o,
        args: {
          ...o.args,
          ...patch
        }
      });
    } else {
      memo.push(o);
    }
    return memo;
  }, []);
};

const prependEvent = (data, id, newData) => {
  return data.reduce((memo, o) => {
    if (o.true) {
      o = {
        ...o,
        true: prependEvent(o.true, id, newData)
      };
    }
    if (o.false) {
      o = {
        ...o,
        false: prependEvent(o.false, id, newData)
      };
    }
    if (o.id === id) {
      memo.push(newData);
    }
    memo.push(o);
    return memo;
  }, []);
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
    let o = data[i];
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
  walkScenesEvents,
  patchEvents,
  prependEvent,
  filterEvents,
  findEvent
};
