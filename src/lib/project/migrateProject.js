const migrateProject = project => {
  let data = { ...project };
  let version = project._version || "1";

  // Migrate from 1 to 1.1.0
  if (version === "1") {
    data = migrate_1_110_Actors(data);
    data = migrate_1_110_Collisions(data);
    version = "1.1.0";
  }

  data._version = version;
  return data;
};

/*
 * In version 1 Actors using sprites with 3 or 6 frames and movementType static
 * would use have a direction input but in 1.1.0 they now have a frame selector
 * to match other static sprites. This function migrates all static actors
 * to the new format
 */
const migrate_1_110_Actors = data => {
  return {
    ...data,
    scenes: data.scenes.map(scene => {
      return {
        ...scene,
        actors: scene.actors.map(actor => {
          if (
            actor.movementType === "static" ||
            actor.movementType === "Static"
          ) {
            const actorSprite = data.spriteSheets.find(
              sprite => sprite.id === actor.spriteSheetId
            );
            const isActor =
              actorSprite.numFrames === 3 || actorSprite.numFrames === 6;
            const framesPerDirection = actorSprite.numFrames === 6 ? 2 : 1;
            return {
              ...actor,
              direction: "down",
              movementType: "static",
              frame:
                actor.frame !== undefined
                  ? actor.frame
                  : isActor
                  ? actor.direction === "down"
                    ? 0
                    : actor.direction === "up"
                    ? framesPerDirection
                    : framesPerDirection * 2
                  : 0
            };
          }
          return actor;
        })
      };
    })
  };
};

/*
 * In version 1 scenes would store collisions for tiles outside of their boundaries
 * this function removes the excess data allowing collsions to work again on old scenes
 */
const migrate_1_110_Collisions = data => {
  const backgroundLookup = data.backgrounds.reduce((memo, background) => {
    memo[background.id] = background;
    return memo;
  }, {});

  return {
    ...data,
    scenes: data.scenes.map(scene => {
      const background = backgroundLookup[scene.backgroundId];
      let collisionsSize = background
        ? Math.ceil((background.width * background.height) / 8)
        : 0;
      const collisions = scene.collisions || [];
      if (!background || collisions.length != collisionsSize) {
        return {
          ...scene,
          collisions: collisions.slice(0, collisionsSize)
        };
      }
      return scene;
    })
  };
};

export default migrateProject;
