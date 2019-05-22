import indexById from "../helpers/indexById";

const migrateProject = project => {
  let data = { ...project };
  let version = project._version || "1";

  // Migrate from 1 to 1.1.0
  if (version === "1") {
    data = migrateFrom1To110Scenes(data);
    data = migrateFrom1To110Actors(data);
    data = migrateFrom1To110Collisions(data);
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
const migrateFrom1To110Actors = data => {
  const actorDefaultFrame = actor => {
    const actorSprite = data.spriteSheets.find(
      sprite => sprite.id === actor.spriteSheetId
    );
    const isActor = actorSprite.numFrames === 3 || actorSprite.numFrames === 6;
    const framesPerDirection = actorSprite.numFrames === 6 ? 2 : 1;

    if (actor.frame !== undefined) {
      return actor.frame;
    }
    if (isActor) {
      if (actor.direction === "down") {
        return 0;
      }
      if (actor.direction === "up") {
        return framesPerDirection;
      }
      return framesPerDirection * 2;
    }
    return 0;
  };

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
            return {
              ...actor,
              direction: "down",
              movementType: "static",
              frame: actorDefaultFrame(actor)
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
const migrateFrom1To110Collisions = data => {
  const backgroundLookup = indexById(data.backgrounds);

  return {
    ...data,
    scenes: data.scenes.map(scene => {
      const background = backgroundLookup[scene.backgroundId];
      const collisionsSize = background
        ? Math.ceil((background.width * background.height) / 8)
        : 0;
      const collisions = scene.collisions || [];
      if (!background || collisions.length !== collisionsSize) {
        return {
          ...scene,
          collisions: collisions.slice(0, collisionsSize)
        };
      }
      return scene;
    })
  };
};

/*
 * In version 1 scenes would not contain their widths and heights. To get the width or height
 * of a scene you needed to manually find the background image of the scene and get the
 * dimensions of that instead. This function reads the current background images set in a
 * scene and stores the correct widths and heights
 */
const migrateFrom1To110Scenes = data => {
  const backgroundLookup = indexById(data.backgrounds);

  return {
    ...data,
    scenes: data.scenes.map(scene => {
      const background = backgroundLookup[scene.backgroundId];
      if (background) {
        return {
          ...scene,
          width: background.width,
          height: background.height
        };
      }
      return scene;
    })
  };
};

export default migrateProject;
