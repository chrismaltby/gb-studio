const gameId = "game1";
// const world = require(__dirname + "/worlds/" + gameId + "/world.json");
// const battle = require(__dirname + "/worlds/" + gameId + "/battle.json");
const ggbgfx = require("./ggbgfx");
const fs = require("fs-extra");
const compileImages = require("./compile-images");
const { CMD_LOOKUP, precompileEntityScript } = require("./precompile-script");
const { promisify } = require("util");
const { nameToCName, decHex, dirDec, moveDec, hi, lo } = require("./helpers");
const writeFile = promisify(fs.writeFile);

// Object.assign(world, battle);

const SCRIPT_MAX = 65535;

const DIR_LOOKUP = {
  down: 1,
  left: 2,
  right: 4,
  up: 8
};

const MOVEMENT_LOOKUP = {
  static: 1,
  playerInput: 2,
  randomFace: 3,
  faceInteraction: 4,
  randomWalk: 5
};

const mapBanks = [6, 7, 8, 9, 12, 13, 15];
const tileBanks = [5, 14];

const precompile = async world => {
  world._data = {};
  await precompileFlags(world);
  await precompileStrings(world);
  // await precompileNames(world);
  await precompileImages(world);
  await precompileSprites(world);
  // await precompileBattleSprites(world);
  // await precompileBattleFx(world);
  await precompileMaps(world);
  await precompileScript(world);
};

const precompileImages = async world => {
  world._data.images = world.images.filter(image => {
    return world.scenes.find(map => {
      return map.imageId === image.id;
    });
  });
  world._data.imageLookup = world._data.images.reduce((memo, image) => {
    memo[image.id] = image;
    return memo;
  }, {});
  world._data.imageData = await compileImages(
    world._data.images,
    world._projectPath
  );
};

const precompileSprites = async world => {
  world._data.spriteSheets = await Promise.all(
    world.spriteSheets
      .filter(spriteSheet => {
        return world.scenes.find(map => {
          return map.actors.find(actor => {
            return actor.spriteSheetId === spriteSheet.id;
          });
        });
      })
      .map(async spriteSheet => {
        const data = await ggbgfx.imageToSpriteString(
          world._projectPath + "/assets/sprites/" + spriteSheet.filename
        );

        return {
          ...spriteSheet,
          cName: nameToCName(spriteSheet.name),
          data,
          size: data.split(",").length
        };
      })
  );
};

/*
const precompileBattleSprites = async world => {
  world._data.battleSprites = await Promise.all(
    world.battleSprites
      // @todo filter to only sprites unsed in battles
      .map(async sprite => {
        const data = await ggbgfx.imageToSpriteString(
          __dirname + "/worlds/" + gameId + "/enemies/" + sprite.filename
          // __dirname + "/worlds/" + gameId + "/spriteSheets/cat.png"
        );

        return {
          ...sprite,
          cName: nameToCName(sprite.name),
          data,
          size: data.split(",").length
        };
      })
  );
};

const precompileBattleFx = async world => {
  world._data.battleFx = await Promise.all(
    world.battleFx.map(async sprite => {
      const data = await ggbgfx.imageToSpriteString(
        __dirname + "/worlds/" + gameId + "/battleFx/" + sprite.filename
      );

      return {
        ...sprite,
        cName: nameToCName(sprite.name),
        data,
        size: data.split(",").length
      };
    })
  );
};
*/

const precompileMaps = async world => {
  world._data.scenes = await Promise.all(
    world.scenes.map(async map => {
      return {
        ...map,
        cName: nameToCName(map.name),
        tilemap: world._data.imageData.tilemaps[map.imageId],
        tileset: world._data.imageData.tilemapsTileset[map.imageId],
        sprites: map.actors.reduce((memo, a) => {
          const spriteIndex = world._data.spriteSheets.findIndex(
            s => s.id === a.spriteSheetId
          );
          if (memo.indexOf(spriteIndex) === -1) {
            memo.push(spriteIndex);
          }
          return memo;
        }, [])
        // tileData: ggbgfx
      };
    })
  );
  // world._data.mapCNamesLookup = {};

  // world.scenes.forEach(map => {
  //   world._data.mapCNamesLookup[map.id] = nameToCName(map.name);
  // });
};

const precompileFlags = world => {
  world._data.flags = [];
  world.scenes.forEach(map => {
    map.actors.forEach(actor => {
      inOrderTraverseScript(actor.script || [], cmd => {
        if (cmd.args && cmd.args.flag) {
          if (world._data.flags.indexOf(cmd.args.flag) === -1) {
            world._data.flags.push(cmd.args.flag);
          }
        }
      });
    });
    map.triggers.forEach(trigger => {
      inOrderTraverseScript(trigger.script || [], cmd => {
        if (cmd.args && cmd.args.flag) {
          if (world._data.flags.indexOf(cmd.args.flag) === -1) {
            world._data.flags.push(cmd.args.flag);
          }
        }
      });
    });
  });
};

const precompileStrings = world => {
  world._data.strings = [];
  world.scenes.forEach(map => {
    map.actors.forEach(actor => {
      inOrderTraverseScript(actor.script || [], cmd => {
        if (cmd.args && cmd.args.text) {
          if (world._data.strings.indexOf(cmd.args.text) === -1) {
            world._data.strings.push(cmd.args.text);
          }
        }
      });
    });
    map.triggers.forEach(trigger => {
      inOrderTraverseScript(trigger.script || [], cmd => {
        if (cmd.args && cmd.args.text) {
          if (world._data.strings.indexOf(cmd.args.text) === -1) {
            world._data.strings.push(cmd.args.text);
          }
        }
      });
    });
  });
};

/*
const precompileNames = world => {
  world._data.names = [];
  world.enemies.forEach(enemy => {
    const name = enemy.name.toUpperCase().trim();
    if (world._data.names.indexOf(name) === -1) {
      world._data.names.push(name);
    }
  });
};
*/

const inOrderTraverseScript = (script, fn) => {
  script.forEach(cmd => {
    fn(cmd);
    if (cmd.true) {
      inOrderTraverseScript(cmd.true, fn);
    }
    if (cmd.false) {
      inOrderTraverseScript(cmd.false, fn);
    }
  });
};

const precompileScript = world => {
  world._data.scriptLookup = {};
  world._data.script = [CMD_LOOKUP["END"]];
  world.scenes.forEach(map => {
    world._data.scriptLookup[map.id] = { actors: {}, triggers: {} };
    map.actors.forEach((actor, i) => {
      if (actor.script && actor.script.length > 1) {
        // Had a script
        world._data.scriptLookup[map.id].actors[i] = world._data.script.length;
        world._data.script = precompileEntityScript(
          actor.script,
          world._data.script,
          world._data,
          map.id
        );
      } else {
        // No script
        world._data.scriptLookup[map.id].actors[i] = SCRIPT_MAX;
      }
    });
    map.triggers.forEach((trigger, i) => {
      if (trigger.script && trigger.script.length > 1) {
        // Had a script
        world._data.scriptLookup[map.id].triggers[i] =
          world._data.script.length;
        world._data.script = precompileEntityScript(
          trigger.script,
          world._data.script,
          world._data,
          map.id
        );
      } else {
        // No script
        world._data.scriptLookup[map.id].triggers[i] = SCRIPT_MAX;
      }
    });
  });
};

const compileCollisions = collisions =>
  collisions.map(v => (v ? "0x01" : "0x00")).join() || "0x00";

const compileMapPtrs = world => {
  return world._data.scenes.map(map => "&" + map.cName + "_tiles");
};

const compileMapTilesPtrs = world => {
  return world._data.scenes.map(map => "&tileset_" + map.tileset);
};

const compileMapCollisionPtrs = world => {
  return world._data.scenes.map(map => "&" + map.cName + "_col");
};

const compileMapBanks = world => {
  return world._data.scenes.map(
    (map, mapIndex) => mapBanks[mapIndex % mapBanks.length]
  );
};

const compileTileBanks = (world, tilesets) => {
  return world._data.scenes.map(
    (map, mapIndex) =>
      tileBanks[tilesets.indexOf(map.tileset) % tileBanks.length]
  );
};

const compileMapWidths = world => {
  return world.scenes.map(m => world._data.imageLookup[m.imageId].width);
};

const compileMapHeights = world => {
  return world.scenes.map(m => world._data.imageLookup[m.imageId].height);
};

const compileMapSpritesPtrs = world => {
  return world._data.scenes.map(map => "&" + map.cName + "_sprites");
};

const compileMapSpritesLength = world => {
  return world._data.scenes.map(m => m.sprites.length);
};

const compileMapActorsPtrs = world => {
  return world._data.scenes.map(map => "&" + map.cName + "_actors");
};

const compileMapActorsLength = world => {
  return world.scenes.map(m => m.actors.length);
};

const compileMapTriggersPtrs = world => {
  return world._data.scenes.map(map => "&" + map.cName + "_triggers");
};

const compileMapTriggersLength = world => {
  return world.scenes.map(m => m.triggers.length);
};

const compileFlags = world => {
  return `const unsigned char script_flags[${world._data.flags.length ||
    1}] = {\n  0\n};`;
};

const compileStrings = world => {
  return (
    world._data.strings
      .map(a => `  "${a.toUpperCase().replace(/\n/g, "\\n")}"`)
      .join(",\n") || '""'
  );
};

const compileNames = world => {
  return (
    world._data.names
      .map(a => `  "${a.toUpperCase().replace(/\n/g, "\\n")}"`)
      .join(",\n") || '""'
  );
};

const compileScript = world => {
  return world._data.script.map(decHex).join(",");
};

const compileMapTriggers = (triggers, scriptLookup) =>
  triggers
    .map((t, i) =>
      [
        t.x,
        t.y,
        t.width,
        t.height,
        t.trigger === "action" ? 1 : 0,
        hi(scriptLookup[i]),
        lo(scriptLookup[i])
      ].map(decHex)
    )
    .join(",\n") || "0x00";

const compileMapActors = (actors, spriteSheets, scriptLookup) => {
  let mapSpritesLookup = {};
  let mapSpritesIndex = 6;

  const getIndex = id => {
    if (mapSpritesLookup[id]) {
      return mapSpritesLookup[id];
    }
    const lookup = mapSpritesIndex;
    mapSpritesLookup[id] = lookup;
    const spriteSheet = spriteSheets.find(s => s.id === id);
    mapSpritesIndex += spriteSheet.size / 64;
    return lookup;
  };

  return (
    actors
      .map((a, i) =>
        [
          getIndex(a.spriteSheetId),
          spriteSheets.find(s => s.id === a.spriteSheetId).size / 64 === 6
            ? 1
            : 0,
          a.x,
          a.y,
          spriteSheets.find(s => s.id === a.spriteSheetId).type === "static"
            ? 1
            : dirDec(a.direction),
          moveDec(a.movementType),
          hi(scriptLookup[i]),
          lo(scriptLookup[i])
        ].map(decHex)
      )
      .join(",\n") || "0x00"
  );
};

const compileMapSprites = (actors, spriteSheets) => {
  return actors.reduce((memo, a) => {
    const spriteIndex = spriteSheets.findIndex(s => s.id === a.spriteSheetId);
    if (memo.indexOf(spriteIndex) === -1) {
      memo.push(spriteIndex);
    }
    return memo;
  }, []);
};

const compileSprite = async sprite => {
  return (
    "const unsigned char " +
    sprite.cName +
    "_sprite[] = {\n" +
    sprite.data +
    // (await ggbgfx.imageToSpriteString(
    //   __dirname + "/worlds/" + gameId + "/spriteSheets/" + file
    // )) +
    // collisions.map(v => (v ? "0x01" : "0x00")).join() +
    "\n};\n"
  );
};

const compileSpriteLookup = world => {
  return (
    world._data.spriteSheets
      .map(s => {
        return "  &" + s.cName + "_sprite";
      })
      .join(",\n") || 0
  );
};

const compileSpriteLength = world => {
  return (
    world._data.spriteSheets
      .map(s => {
        return s.size / 64;
      })
      .join(",") || 0
  );
};

/*
const compileBattleSpriteLookup = world => {
  return (
    world._data.battleSprites
      .map(s => {
        return "  &" + s.cName + "_sprite";
      })
      .join(",\n") || 0
  );
};

const compileBattleSpriteSize = world => {
  return (
    world._data.battleSprites
      .map(s => {
        return Math.sqrt(s.size) / 4;
      })
      .join(",") || 0
  );
};

const compileBattleEnemies = (enemies, sprites, names) => {
  return (
    enemies
      .map((e, i) =>
        [
          names.indexOf(e.name),
          sprites.findIndex(s => s.id === e.spriteId),
          hi(e.maxHp),
          lo(e.maxHp),
          hi(e.maxAp),
          lo(e.maxAp),
          e.str,
          e.def,
          e.wis,
          e.lck,
          e.spd,
          0,
          0,
          0,
          0,
          0 // Pad to 16 bytes per enemy
        ].map(decHex)
      )
      .join(",\n") || "0x00"
  );
};

const compileEncounterEnemies = (encounters, enemies) => {
  return (
    encounters
      .map(en => {
        let ids = [];
        for (let i = 0; i < 8; i++) {
          const enemyIndex = enemies.findIndex(e => e.id === en.enemies[i]);
          ids.push(enemyIndex > -1 ? enemyIndex : 255);
        }
        return ids.map(decHex);
      })
      .join(",\n") || "0x00"
  );
};
*/

const typedef = name => "const unsigned char " + name;

const compile = async (projectPath, buildPath) => {
  const world = await fs.readJson(projectPath + "/project.json");

  world._projectPath = projectPath;

  let outputData = {};

  const addFile = (file, defaults) => {
    outputData[file] = {
      ...defaults,
      data: []
    };
  };

  const addData = (file, type, value) => {
    outputData[file].data.push({
      type,
      value
    });
  };

  await precompile(world);

  // Compile Sprites
  addFile("sprite_data", { bank: 7 });
  world._data.spriteSheets.forEach(sprite => {
    addData("sprite_data", typedef(sprite.cName + "_sprite[]"), sprite.data);
  });

  // Compile maps
  addFile("map_data");
  addFile("bank5", { bank: 5 });
  addFile("bank6", { bank: 6 });
  addFile("bank7", { bank: 7 });
  addFile("bank8", { bank: 8 });
  addFile("bank9", { bank: 9 });
  addFile("bank12", { bank: 12 });
  addFile("bank13", { bank: 13 });
  addFile("bank14", { bank: 14 });
  addFile("bank15", { bank: 15 });

  addData("map_data", typedef("*sprite_ptrs[]"), compileSpriteLookup(world));
  addData("map_data", typedef("sprite_len[]"), compileSpriteLength(world));

  let includedTilesets = [];

  world._data.scenes.forEach((map, mapIndex) => {
    const mapBank = "bank" + mapBanks[mapIndex % mapBanks.length];

    if (includedTilesets.indexOf(map.tileset) === -1) {
      console.log(
        includedTilesets.length,
        tileBanks.length,
        includedTilesets.length % tileBanks.length
      );
      const tileBank =
        "bank" + tileBanks[includedTilesets.length % tileBanks.length];
      console.log("TILEBANK=", tileBank);

      addData(
        tileBank,
        typedef("tileset_" + map.tileset + "[]"),
        world._data.imageData.tilesets[map.tileset]
      );
      includedTilesets.push(map.tileset);
    }

    addData(mapBank, typedef(map.cName + "_tiles[]"), map.tilemap);

    addData(
      mapBank,
      typedef(map.cName + "_col[]"),
      compileCollisions(map.collisions)
    );

    addData(
      mapBank,
      typedef(map.cName + "_actors[]"),
      compileMapActors(
        map.actors,
        world._data.spriteSheets,
        world._data.scriptLookup[map.id].actors
      )
    );

    addData(
      mapBank,
      typedef(map.cName + "_sprites[]"),
      map.sprites.length > 0 ? map.sprites : "0x00"
      // compileMapSprites(map.actors, world._data.spriteSheets)
    );

    addData(
      mapBank,
      typedef(map.cName + "_triggers[]"),
      compileMapTriggers(
        map.triggers,
        world._data.scriptLookup[map.id].triggers
      )
    );
  });

  const startMapIndex = world.scenes.findIndex(m => m.id === world.startMapId);
  addData("map_data", typedef("game_start_map_index"), startMapIndex);
  addData("map_data", typedef("game_start_x"), world.startX);
  addData("map_data", typedef("game_start_y"), world.startY);
  addData("map_data", typedef("game_start_dir"), dirDec(world.startDirection));

  addData("map_data", typedef("*map_ptrs[]"), compileMapPtrs(world));
  addData("map_data", typedef("*map_tiles_ptrs[]"), compileMapTilesPtrs(world));
  addData(
    "map_data",
    typedef("*map_col_ptrs[]"),
    compileMapCollisionPtrs(world)
  );
  addData("map_data", typedef("map_banks[]"), compileMapBanks(world));
  addData(
    "map_data",
    typedef("tile_banks[]"),
    compileTileBanks(world, includedTilesets)
  );
  addData("map_data", typedef("map_widths[]"), compileMapWidths(world));
  addData("map_data", typedef("map_heights[]"), compileMapHeights(world));
  addData("map_data", typedef("*map_sprites[]"), compileMapSpritesPtrs(world));
  addData(
    "map_data",
    typedef("map_sprites_len[]"),
    compileMapSpritesLength(world)
  );
  addData("map_data", typedef("*map_actors[]"), compileMapActorsPtrs(world));
  addData(
    "map_data",
    typedef("map_actors_len[]"),
    compileMapActorsLength(world)
  );
  addData(
    "map_data",
    typedef("*map_triggers[]"),
    compileMapTriggersPtrs(world)
  );
  addData(
    "map_data",
    typedef("map_triggers_len[]"),
    compileMapTriggersLength(world)
  );

  // Battle --------------------------------------------------------------------

  // Compile Sprites
  // addFile("battle_sprite_data", { bank: 10 });
  // addFile("battle_enemies", { bank: 15 });
  // addFile("battle_data");

  // world._data.battleSprites.forEach(sprite => {
  //   addData(
  //     "battle_sprite_data",
  //     typedef(sprite.cName + "_sprite[]"),
  //     sprite.data
  //   );
  // });

  // Compile Fx
  // world._data.battleFx.forEach(sprite => {
  //   addData("battle_sprite_data", typedef(sprite.cName + "_fx[]"), sprite.data);
  // });

  // addData(
  //   "battle_data",
  //   typedef("*battle_sprite_ptrs[]"),
  //   compileBattleSpriteLookup(world)
  // );
  // addData(
  //   "battle_data",
  //   typedef("battle_sprite_size[]"),
  //   compileBattleSpriteSize(world)
  // );

  // addData(
  //   "battle_enemies",
  //   typedef("battle_enemies[]"),
  //   compileBattleEnemies(
  //     world.enemies,
  //     world._data.battleSprites,
  //     world._data.names
  //   )
  // );

  // addData(
  //   "battle_enemies",
  //   typedef("battle_encounter_enemies[]"),
  //   compileEncounterEnemies(world.encounters, world.enemies)
  // );

  // End of Battle -------------------------------------------------------------

  // Compile script
  addFile("script_data", { bank: 4 });
  addData(
    "script_data",
    `unsigned char script_flags[${world._data.flags.length || 1}]`,
    "0"
  );

  addData("script_data", typedef("script[]"), compileScript(world));

  // Compile strings
  addFile("strings_data", { bank: 2 });
  addData("strings_data", typedef("strings[][38]"), compileStrings(world));

  // Output data

  for (var filename in outputData) {
    const data = outputData[filename];
    console.log("WRITING: " + filename + ".c");
    const output =
      (data.bank ? "#pragma bank=" + data.bank + "\n" : "") +
      '#include "banks.h"\n\n' +
      data.data
        .map(d => {
          return d.type + " = {\n" + d.value + "\n};\n";
        })
        .join("\n");
    await writeFile(buildPath + "/" + filename + ".c", output);
  }

  // Output header

  const externDefs =
    "#ifndef BANKS_H\n#define BANKS_H\n\n" +
    Object.keys(outputData)
      .map(filename => {
        return (
          "// " +
          filename +
          "\n" +
          outputData[filename].data
            .map(d => "extern " + d.type + ";")
            .join("\n")
        );
      })
      .join("\n\n") +
    "\n\n#endif\n";
  await writeFile(buildPath + "/banks.h", externDefs);
};

export default compile;
