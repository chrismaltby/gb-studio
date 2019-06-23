import initialState from "./initialState";

// const sortFilename = (a, b) => {
//   if (a.filename > b.filename) return 1;
//   if (a.filename < b.filename) return -1;
//   return 0;
// };

// const sortRecent = (a, b) => {
//   if (a._v > b._v) return -1;
//   if (a._v < b._v) return 1;
//   return 0;
// };

// const matchAsset = assetA => assetB => {
//   return assetA.filename === assetB.filename && assetA.plugin === assetB.plugin;
// };

// const notMatchAsset = assetA => assetB => {
//   return assetA.filename !== assetB.filename || assetA.plugin !== assetB.plugin;
// };

/*
const sceneClearCollisionsIfDimensionsChanged = backgrounds => {
  const backgroundLookup = backgrounds.reduce((memo, background) => {
    return {
      ...memo,
      [background.id]: background
    };
  }, {});
  return scene => {
    // Determine how large the collisions array should be based on the size of the
    // image, if image size has changed then clear the collisions array in scene
    const background = backgroundLookup[scene.backgroundId];
    const collisionsSize = background
      ? Math.ceil((background.width * background.height) / 8)
      : 0;
    if (
      !background ||
      !scene.collisions ||
      scene.collisions.length !== collisionsSize
    ) {
      return {
        ...scene,
        collisions: []
      };
    }
    return scene;
  };
};
*/

export default function project(state = initialState.project, action) {
  switch (action.type) {
    // case PROJECT_LOAD_SUCCESS: {
    //   const newState = deepmerge(state, action.data);
    //   return {
    //     ...newState,
    //     scenes: newState.scenes.map(
    //       sceneClearCollisionsIfDimensionsChanged(newState.backgrounds)
    //     )
    //   };
    // }
    // case SPRITE_REMOVE:
    //   return {
    //     ...state,
    //     spriteSheets: state.spriteSheets.filter(notMatchAsset(action.data))
    //   };
    // case SPRITE_LOAD_SUCCESS: {
    //   const currentSprite = state.spriteSheets.find(matchAsset(action.data));
    //   return {
    //     ...state,
    //     spriteSheets: []
    //       .concat(state.spriteSheets.filter(notMatchAsset(action.data)), {
    //         ...action.data,
    //         id: currentSprite ? currentSprite.id : action.data.id
    //       })
    //       .sort(sortFilename)
    //   };
    // }
    // case BACKGROUND_REMOVE:
    //   return {
    //     ...state,
    //     backgrounds: state.backgrounds.filter(notMatchAsset(action.data))
    //   };
    // case BACKGROUND_LOAD_SUCCESS: {
    //   const currentBackground = state.backgrounds.find(matchAsset(action.data));
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(
    //       sceneClearCollisionsIfDimensionsChanged(state.backgrounds)
    //     ),
    //     backgrounds: []
    //       .concat(state.backgrounds.filter(notMatchAsset(action.data)), {
    //         ...action.data,
    //         id: currentBackground ? currentBackground.id : action.data.id
    //       })
    //       .sort(sortFilename)
    //   };
    // }
    // case MUSIC_REMOVE:
    //   return {
    //     ...state,
    //     music: state.music.filter(notMatchAsset(action.data))
    //   };
    // case MUSIC_LOAD_SUCCESS: {
    //   const currentMusic = state.music.find(matchAsset(action.data));
    //   return {
    //     ...state,
    //     music: []
    //       .concat(state.music.filter(notMatchAsset(action.data)), {
    //         ...action.data,
    //         id: currentMusic ? currentMusic.id : action.data.id
    //       })
    //       .sort(sortFilename)
    //   };
    // }
    // case ADD_SCENE: {
    //   const script =
    //     action.defaults &&
    //     action.defaults.script &&
    //     action.defaults.script.map(regenerateEventIds);
    //   const defaultBackground =
    //     state.backgrounds &&
    //     state.backgrounds[0] &&
    //     state.backgrounds.slice().sort(sortRecent)[0];
    //   const newScene = Object.assign(
    //     {
    //       name: `Scene ${state.scenes.length + 1}`,
    //       backgroundId: defaultBackground && defaultBackground.id,
    //       width: defaultBackground ? defaultBackground.width : 32,
    //       height: defaultBackground ? defaultBackground.height : 32,
    //       actors: [],
    //       triggers: [],
    //       collisions: []
    //     },
    //     action.defaults || {},
    //     script && {
    //       script
    //     },
    //     {
    //       id: action.id,
    //       x: Math.max(MIN_SCENE_X, action.x),
    //       y: Math.max(MIN_SCENE_Y, action.y)
    //     }
    //   );
    //   return {
    //     ...state,
    //     scenes: [].concat(state.scenes, newScene)
    //   };
    // }
    // case MOVE_SCENE:
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }
    //       return {
    //         ...scene,
    //         x: Math.max(MIN_SCENE_X, scene.x + action.moveX),
    //         y: Math.max(MIN_SCENE_Y, scene.y + action.moveY)
    //       };
    //     })
    //   };
    // case EDIT_SCENE:
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }

    //       // If switched background use collisions from another
    //       // scene using the background already if available
    //       // otherwise make empty collisions array of
    //       // the correct size
    //       let newCollisions;
    //       let newActors;
    //       let newTriggers;
    //       let newBackground;

    //       if (action.values.backgroundId) {
    //         const otherScene = state.scenes.find(s => {
    //           return s.backgroundId === action.values.backgroundId;
    //         });
    //         const background = state.backgrounds.find(
    //           b => b.id === action.values.backgroundId
    //         );

    //         if (otherScene) {
    //           newCollisions = otherScene.collisions;
    //         } else {
    //           const collisionsSize = Math.ceil(
    //             (background.width * background.height) / 8
    //           );
    //           newCollisions = [];
    //           for (let i = 0; i < collisionsSize; i++) {
    //             newCollisions[i] = 0;
    //           }
    //         }

    //         newActors = scene.actors.map(actor => {
    //           return {
    //             ...actor,
    //             x: Math.min(actor.x, background.width - 2),
    //             y: Math.min(actor.y, background.height - 1)
    //           };
    //         });

    //         newTriggers = scene.triggers.map(trigger => {
    //           const x = Math.min(trigger.x, background.width - 1);
    //           const y = Math.min(trigger.y, background.height - 1);
    //           return {
    //             ...trigger,
    //             x,
    //             y,
    //             width: Math.min(trigger.width, background.width - x),
    //             height: Math.min(trigger.height, background.height - y)
    //           };
    //         });

    //         newBackground = background;
    //       }

    //       return Object.assign(
    //         {},
    //         scene,
    //         action.values,
    //         action.values.backgroundId && {
    //           collisions: newCollisions || [],
    //           actors: newActors,
    //           triggers: newTriggers,
    //           width: newBackground.width,
    //           height: newBackground.height
    //         }
    //       );
    //     })
    //   };
    // case PASTE_SCENE:
    //   return {
    //     ...state,
    //     scenes: [].concat(state.scenes, {
    //       ...action.scene,
    //       id: action.id,
    //       x: MIN_SCENE_X,
    //       y: MIN_SCENE_Y,
    //       actors: action.scene.actors.map(actor => {
    //         return {
    //           ...actor,
    //           id: uuid(),
    //           script: actor.script && actor.script.map(regenerateEventIds)
    //         };
    //       }),
    //       triggers: action.scene.triggers.map(trigger => {
    //         return {
    //           ...trigger,
    //           id: uuid(),
    //           script: trigger.script && trigger.script.map(regenerateEventIds)
    //         };
    //       })
    //     })
    //   };
    // case REMOVE_SCENE:
    //   return {
    //     ...state,
    //     scenes: state.scenes.filter(scene => {
    //       return scene.id !== action.sceneId;
    //     })
    //   };
    // case ADD_ACTOR: {
    //   const script =
    //     action.defaults &&
    //     action.defaults.script &&
    //     action.defaults.script.map(regenerateEventIds);
    //   const newActor = Object.assign(
    //     {
    //       spriteSheetId: state.spriteSheets[0] && state.spriteSheets[0].id,
    //       movementType: "static",
    //       direction: "down",
    //       moveSpeed: "1",
    //       animSpeed: "3"
    //     },
    //     action.defaults || {},
    //     script && {
    //       script
    //     },
    //     {
    //       id: action.id,
    //       x: action.x,
    //       y: action.y
    //     }
    //   );
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }
    //       return {
    //         ...scene,
    //         actors: [].concat(newActor, scene.actors).slice(-MAX_ACTORS)
    //       };
    //     })
    //   };
    // }
    // case MOVE_ACTOR: {
    //   const moveScene = state.scenes.find(s => s.id === action.newSceneId);
    //   const sceneImage = state.backgrounds.find(
    //     background => background.id === moveScene.backgroundId
    //   );
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId && scene.id !== action.newSceneId) {
    //         return scene;
    //       }
    //       // Remove from previous scene if changed
    //       if (
    //         scene.id === action.sceneId &&
    //         action.sceneId !== action.newSceneId
    //       ) {
    //         return {
    //           ...scene,
    //           actors: scene.actors.filter(actor => {
    //             return actor.id !== action.id;
    //           })
    //         };
    //       }
    //       // Add to new scene if changed
    //       if (
    //         scene.id === action.newSceneId &&
    //         action.sceneId !== action.newSceneId
    //       ) {
    //         const oldScene = state.scenes.find(s => s.id === action.sceneId);
    //         const oldActor =
    //           oldScene && oldScene.actors.find(a => a.id === action.id);
    //         if (!oldActor) {
    //           return scene;
    //         }
    //         return {
    //           ...scene,
    //           actors: [].concat(scene.actors, {
    //             ...oldActor,
    //             x: clamp(action.x, 0, sceneImage.width - 2),
    //             y: clamp(action.y, 0, sceneImage.height - 1)
    //           })
    //         };
    //       }
    //       // If moving within current scene just map old actors
    //       // to new actors
    //       return {
    //         ...scene,
    //         actors: scene.actors.map(actor => {
    //           if (actor.id !== action.id) {
    //             return actor;
    //           }
    //           return {
    //             ...actor,
    //             x: clamp(action.x, 0, sceneImage.width - 2),
    //             y: clamp(action.y, 0, sceneImage.height - 1)
    //           };
    //         })
    //       };
    //     })
    //   };
    // }
    // case EDIT_ACTOR:
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }
    //       return {
    //         ...scene,
    //         actors: scene.actors.map(actor => {
    //           if (actor.id !== action.id) {
    //             return actor;
    //           }
    //           const patch = { ...action.values };

    //           if (patch.spriteSheetId) {
    //             const newSprite = state.spriteSheets.find(
    //               s => s.id === patch.spriteSheetId
    //             );
    //             // If new sprite not an actor then reset movement type back to static
    //             if (newSprite.numFrames !== 3 && newSprite.numFrames !== 6) {
    //               patch.movementType = "static";
    //             }
    //             const oldSprite = state.spriteSheets.find(
    //               s => s.id === actor.spriteSheetId
    //             );
    //             // If new sprite is an actor and old one wasn't reset movement type to face interaction
    //             if (
    //               oldSprite &&
    //               newSprite &&
    //               oldSprite.id !== newSprite.id &&
    //               (oldSprite.numFrames !== 3 && oldSprite.numFrames !== 6) &&
    //               (newSprite.numFrames === 3 || newSprite.numFrames === 6)
    //             ) {
    //               patch.movementType = "faceInteraction";
    //             }

    //             if (newSprite && newSprite.numFrames <= actor.frame) {
    //               patch.frame = 0;
    //             }
    //           }
    //           // If static and cycling frames start from frame 1 (facing downwards)
    //           if (
    //             (patch.animate && actor.movementType === "static") ||
    //             patch.movementType === "static"
    //           ) {
    //             patch.direction = "down";
    //           }

    //           return {
    //             ...actor,
    //             ...patch
    //           };
    //         })
    //       };
    //     })
    // //   };
    // case PASTE_ACTOR:
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }
    //       return {
    //         ...scene,
    //         actors: []
    //           .concat(scene.actors, {
    //             ...action.actor,
    //             id: action.id,
    //             x: 1,
    //             y: 1,
    //             script:
    //               action.actor.script &&
    //               action.actor.script.map(regenerateEventIds)
    //           })
    //           .slice(0, MAX_ACTORS)
    //       };
    //     })
    //   };
    // case REMOVE_ACTOR:
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }
    //       return {
    //         ...scene,
    //         actors: scene.actors.filter(actor => {
    //           return action.id !== actor.id;
    //         })
    //       };
    //     })
    //   };
    // case REMOVE_ACTOR_AT:
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }
    //       return {
    //         ...scene,
    //         actors: scene.actors.filter(actor => {
    //           return !(
    //             (actor.x === action.x || actor.x === action.x - 1) &&
    //             (actor.y === action.y || actor.y === action.y + 1)
    //           );
    //         })
    //       };
    //     })
    //   };
    // case ADD_COLLISION_TILE: {
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }

    //       const background =
    //         scene.backgroundId &&
    //         state.backgrounds.find(b => b.id === scene.backgroundId);
    //       if (!background) {
    //         return scene;
    //       }

    //       const collisionsSize = Math.ceil(
    //         (background.width * background.height) / 8
    //       );
    //       const collisions = scene.collisions.slice(0, collisionsSize);

    //       if (collisions.length < collisionsSize) {
    //         for (let i = collisions.length; i < collisionsSize; i++) {
    //           collisions[i] = 0;
    //         }
    //       }

    //       const collisionIndex = background.width * action.y + action.x;
    //       const collisionByteIndex = collisionIndex >> 3;
    //       const collisionByteOffset = collisionIndex & 7;
    //       const collisionByteMask = 1 << collisionByteOffset;
    //       collisions[collisionByteIndex] |= collisionByteMask;

    //       return {
    //         ...scene,
    //         collisions
    //       };
    //     })
    //   };
    // }
    // case REMOVE_COLLISION_TILE: {
    // return {
    //   ...state,
    //   scenes: state.scenes.map(scene => {
    //     if (scene.id !== action.sceneId) {
    //       return scene;
    //     }

    //     const background =
    //       scene.backgroundId &&
    //       state.backgrounds.find(b => b.id === scene.backgroundId);
    //     if (!background) {
    //       return scene;
    //     }

    //     const collisionsSize = Math.ceil(
    //       (background.width * background.height) / 8
    //     );
    //     const collisions = scene.collisions.slice(0, collisionsSize);

    //     if (collisions.length < collisionsSize) {
    //       for (let i = collisions.length; i < collisionsSize; i++) {
    //         collisions[i] = 0;
    //       }
    //     }

    //     const collisionIndex = background.width * action.y + action.x;
    //     const collisionByteIndex = collisionIndex >> 3;
    //     const collisionByteOffset = collisionIndex & 7;
    //     const collisionByteMask = 1 << collisionByteOffset;
    //     collisions[collisionByteIndex] &= ~collisionByteMask;

    //     return {
    //       ...scene,
    //       collisions
    //     };
    //   })
    // };
    // }
    // case ADD_TRIGGER: {
    //   const script =
    //     action.defaults &&
    //     action.defaults.script &&
    //     action.defaults.script.map(regenerateEventIds);
    //   const newTrigger = Object.assign(
    //     {
    //       trigger: "walk"
    //     },
    //     action.defaults || {},
    //     script && {
    //       script
    //     },
    //     {
    //       id: action.id,
    //       x: action.x,
    //       y: action.y,
    //       width: 1,
    //       height: 1
    //     }
    //   );
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }
    //       return {
    //         ...scene,
    //         triggers: [].concat(newTrigger, scene.triggers).slice(-MAX_TRIGGERS)
    //       };
    //     })
    //   };
    // }
    // case REMOVE_TRIGGER:
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }
    //       return {
    //         ...scene,
    //         triggers: scene.triggers.filter(trigger => {
    //           return action.id !== trigger.id;
    //         })
    //       };
    //     })
    //   };
    // case REMOVE_TRIGGER_AT: {
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }
    //       return {
    //         ...scene,
    //         triggers: scene.triggers.filter(trigger => {
    //           return (
    //             action.x < trigger.x ||
    //             action.x >= trigger.x + trigger.width ||
    //             action.y < trigger.y ||
    //             action.y >= trigger.y + trigger.height
    //           );
    //         })
    //       };
    //     })
    //   };
    // }
    // case RESIZE_TRIGGER:
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }
    //       return {
    //         ...scene,
    //         triggers: scene.triggers.map(trigger => {
    //           if (trigger.id !== action.id) {
    //             return trigger;
    //           }
    //           return {
    //             ...trigger,
    //             x: Math.min(action.x, action.startX),
    //             y: Math.min(action.y, action.startY),
    //             width: Math.abs(action.x - action.startX) + 1,
    //             height: Math.abs(action.y - action.startY) + 1
    //           };
    //         })
    //       };
    //     })
    //   };
    // case EDIT_TRIGGER:
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }
    //       return {
    //         ...scene,
    //         triggers: scene.triggers.map(trigger => {
    //           if (trigger.id !== action.id) {
    //             return trigger;
    //           }
    //           return {
    //             ...trigger,
    //             ...action.values
    //           };
    //         })
    //       };
    //     })
    //   };
    // case PASTE_TRIGGER:
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }
    //       return {
    //         ...scene,
    //         triggers: []
    //           .concat(scene.triggers, {
    //             ...action.trigger,
    //             id: action.id,
    //             x: 1,
    //             y: 1,
    //             script:
    //               action.trigger.script &&
    //               action.trigger.script.map(regenerateEventIds)
    //           })
    //           .slice(0, MAX_TRIGGERS)
    //       };
    //     })
    //   };
    // case MOVE_TRIGGER: {
    //   const moveScene = state.scenes.find(s => s.id === action.newSceneId);
    //   const sceneImage = state.backgrounds.find(
    //     background => background.id === moveScene.backgroundId
    //   );
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId && scene.id !== action.newSceneId) {
    //         return scene;
    //       }
    //       // Remove from previous scene if changed
    //       if (
    //         scene.id === action.sceneId &&
    //         action.sceneId !== action.newSceneId
    //       ) {
    //         return {
    //           ...scene,
    //           triggers: scene.triggers.filter(trigger => {
    //             return trigger.id !== action.id;
    //           })
    //         };
    //       }
    //       // Add to new scene if changed
    //       if (
    //         scene.id === action.newSceneId &&
    //         action.sceneId !== action.newSceneId
    //       ) {
    //         const oldScene = state.scenes.find(s => s.id === action.sceneId);
    //         const oldTrigger =
    //           oldScene && oldScene.triggers.find(a => a.id === action.id);
    //         if (!oldTrigger) {
    //           return scene;
    //         }
    //         return {
    //           ...scene,
    //           triggers: [].concat(scene.triggers, {
    //             ...oldTrigger,
    //             x: clamp(action.x, 0, sceneImage.width - oldTrigger.width),
    //             y: clamp(action.y, 0, sceneImage.height - oldTrigger.height)
    //           })
    //         };
    //       }
    //       // If moving within current scene just map old triggers
    //       // to new triggers
    //       return {
    //         ...scene,
    //         triggers: scene.triggers.map(trigger => {
    //           if (trigger.id !== action.id) {
    //             return trigger;
    //           }
    //           return {
    //             ...trigger,
    //             x: clamp(action.x, 0, sceneImage.width - trigger.width),
    //             y: clamp(action.y, 0, sceneImage.height - trigger.height)
    //           };
    //         })
    //       };
    //     })
    //   };
    // }
    // case RENAME_VARIABLE: {
    //   return {
    //     ...state,
    //     variables: [].concat(
    //       state.variables.filter(variable => {
    //         return variable.id !== action.variableId;
    //       }),
    //       action.name
    //         ? {
    //             id: action.variableId,
    //             name: action.name
    //           }
    //         : []
    //     )
    //   };
    // }
    // case EDIT_PROJECT:
    //   return {
    //     ...state,
    //     ...action.values
    //   };
    // case EDIT_PROJECT_SETTINGS:
    //   return {
    //     ...state,
    //     settings: {
    //       ...state.settings,
    //       ...action.values
    //     }
    //   };
    // case SIDEBAR_RESIZE: {
    //   return {
    //     ...state,
    //     settings: {
    //       ...state.settings,
    //       sidebarWidth: Math.min(740, Math.max(200, action.width))
    //     }
    //   };
    // }
    // case EDIT_PLAYER_START_AT:
    //   return {
    //     ...state,
    //     settings: {
    //       ...state.settings,
    //       startSceneId: action.sceneId,
    //       startX: action.x,
    //       startY: action.y
    //     }
    //   };
    // case EDIT_SCENE_EVENT_DESTINATION_POSITION: {
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }
    //       return {
    //         ...scene,
    //         script: patchEvents(scene.script, action.eventId, {
    //           sceneId: action.destSceneId,
    //           x: action.x,
    //           y: action.y
    //         })
    //       };
    //     })
    //   };
    // }
    // case EDIT_ACTOR_EVENT_DESTINATION_POSITION: {
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }
    //       return {
    //         ...scene,
    //         actors: scene.actors.map(actor => {
    //           if (actor.id !== action.id) {
    //             return actor;
    //           }
    //           return {
    //             ...actor,
    //             script: patchEvents(actor.script, action.eventId, {
    //               sceneId: action.destSceneId,
    //               x: action.x,
    //               y: action.y
    //             })
    //           };
    //         })
    //       };
    //     })
    //   };
    // }
    // case EDIT_TRIGGER_EVENT_DESTINATION_POSITION: {
    //   return {
    //     ...state,
    //     scenes: state.scenes.map(scene => {
    //       if (scene.id !== action.sceneId) {
    //         return scene;
    //       }
    //       return {
    //         ...scene,
    //         triggers: scene.triggers.map(trigger => {
    //           if (trigger.id !== action.id) {
    //             return trigger;
    //           }
    //           return {
    //             ...trigger,
    //             script: patchEvents(trigger.script, action.eventId, {
    //               sceneId: action.destSceneId,
    //               x: action.x,
    //               y: action.y
    //             })
    //           };
    //         })
    //       };
    //     })
    //   };
    // }
    default:
      return state;
  }
}
