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
      walkEvents(actor.events, callback);
    });
    scene.triggers.forEach(trigger => {
      walkEvents(trigger.events, callback);
    });
  });
};

const patchEvents = (data, id, patch) => {
  var r = data.reduce((memo, o) => {
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
  return r;
};

export { walkEvents, walkScenesEvents, patchEvents };
