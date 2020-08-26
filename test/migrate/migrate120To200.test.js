import { migrateFrom120To200Collisions, migrateFrom120To200Event, migrateFrom120To200Actors } from "../../src/lib/project/migrateProject";

test("should migrate collisions from 1.2.0 to 2.0.0", () => {
  const oldProject = {
    scenes: [
      {
        collisions: [255, 255, 255, 255],
        backgroundId: "1",
      },
    ],
    backgrounds: [
      {
        id: "1",
        width: 8,
        height: 4,
      },
    ],
  };

  const newProject = migrateFrom120To200Collisions(oldProject);

  // Now storing 1 tile per byte rather than 1 tile per bit, array will be 8 times bigger
  expect(newProject.scenes[0].collisions.length).toEqual(
    oldProject.scenes[0].collisions.length * 8
  );

  expect(newProject).toEqual({
    scenes: [
      {
        collisions: Array(8 * 4).fill(0xf),
        backgroundId: "1",
      },
    ],
    backgrounds: [
      {
        id: "1",
        width: 8,
        height: 4,
      },
    ],
  });
});

test("should migrate collisions from 1.2.0 to 2.0.0 expanding tile per bit data to tile per byte", () => {
  const oldProject = {
    scenes: [
      {
        collisions: [175, 240],
        backgroundId: "1",
      },
    ],
    backgrounds: [
      {
        id: "1",
        width: 8,
        height: 2,
      },
    ],
  };

  const newProject = migrateFrom120To200Collisions(oldProject);

  expect(newProject).toEqual({
    scenes: [
      {
        collisions: [
          // First byte
          0xf,
          0xf,
          0xf,
          0xf,
          0x0,
          0xf,
          0x0,
          0xf,
          // Second byte
          0x0,
          0x0,
          0x0,
          0x0,
          0xf,
          0xf,
          0xf,
          0xf,
        ],
        backgroundId: "1",
      },
    ],
    backgrounds: [
      {
        id: "1",
        width: 8,
        height: 2,
      },
    ],
  });
});

test("should empty collisions when migrating from 1.2.0 to 2.0.0 if old collisions in correct dimensions for background", () => {
  const oldProject = {
    scenes: [
      {
        collisions: [175, 240],
        backgroundId: "1",
      },
    ],
    backgrounds: [
      {
        id: "1",
        width: 8,
        height: 3,
      },
    ],
  };

  const newProject = migrateFrom120To200Collisions(oldProject);

  expect(newProject).toEqual({
    scenes: [
      {
        collisions: [],
        backgroundId: "1",
      },
    ],
    backgrounds: [
      {
        id: "1",
        width: 8,
        height: 3,
      },
    ],
  });
});

test("should migrate input scripts with persist=true to match old default", () => {
  const oldEvent = {
    id: "abc",
    command: "EVENT_SET_INPUT_SCRIPT",
    args: {
      input: "b",
      true: []
    }
  };
  expect(migrateFrom120To200Event(oldEvent)).toEqual({
    id: "abc",
    command: "EVENT_SET_INPUT_SCRIPT",
    args: {
      input: "b",
      persist: true,
      true: []
    }    
  })
})

test("should migrate text animation speed events with allowFastForward=true", () => {
  const oldEvent = {
    id: "abc",
    command: "EVENT_TEXT_SET_ANIMATION_SPEED",
    args: {
      speedIn: 1,
      speedOut: 1,
      textSpeed: 1,
    }
  };
  expect(migrateFrom120To200Event(oldEvent)).toEqual({
    id: "abc",
    command: "EVENT_TEXT_SET_ANIMATION_SPEED",
    args: {
      speedIn: 1,
      speedOut: 1,
      textSpeed: 1,
      allowFastForward: true
    }   
  })
});

test("should migrate move to using variables events to move to using union type", () => {
  const oldEvent = {
    id: "abc",
    command: "EVENT_ACTOR_MOVE_TO_VALUE",
    args: {
      actorId: "player",
      vectorX: "1",
      vectorY: "2",
    }
  };
  expect(migrateFrom120To200Event(oldEvent)).toEqual({
    id: "abc",
    command: "EVENT_ACTOR_MOVE_TO",
    args: {
      actorId: "player",
      x: {
        type: "variable",
        value: "1"
      },
      y: {
        type: "variable",
        value: "2"
      },
      useCollisions: false,
      verticalFirst: false,
    }   
  });
});

test("should keep comment state when migrating move to event", () => {
  const oldEvent = {
    id: "abc",
    command: "EVENT_ACTOR_MOVE_TO_VALUE",
    args: {
      actorId: "player",
      vectorX: "1",
      vectorY: "2",
      __comment: true
    }
  };
  expect(migrateFrom120To200Event(oldEvent)).toEqual({
    id: "abc",
    command: "EVENT_ACTOR_MOVE_TO",
    args: {
      actorId: "player",
      x: {
        type: "variable",
        value: "1"
      },
      y: {
        type: "variable",
        value: "2"
      },
      useCollisions: false,
      verticalFirst: false,
      __comment: true      
    }   
  });
});


test("should keep rename state when migrating move to event", () => {
  const oldEvent = {
    id: "abc",
    command: "EVENT_ACTOR_MOVE_TO_VALUE",
    args: {
      actorId: "player",
      vectorX: "1",
      vectorY: "2",
      __label: "Label"
    }
  };
  expect(migrateFrom120To200Event(oldEvent)).toEqual({
    id: "abc",
    command: "EVENT_ACTOR_MOVE_TO",
    args: {
      actorId: "player",
      x: {
        type: "variable",
        value: "1"
      },
      y: {
        type: "variable",
        value: "2"
      },
      useCollisions: false,
      verticalFirst: false,
      __label: "Label"
    }   
  });
});


test("should migrate actors with movementType=static and animate=false to have animSpeed none", () => {
  const oldProject = {
    scenes: [
      {
        actors: [{
          movementType: "static",
          animate: false,
          animSpeed: "3"
        }, {
          movementType: "static",
          animSpeed: "2"
        }]
      },
    ]
  };

  const newProject = migrateFrom120To200Actors(oldProject);

  expect(newProject).toEqual({
    scenes: [
      {
        actors: [{
          spriteType: "static",
          movementType: "static",
          animate: false,
          animSpeed: "",
          updateScript: undefined
        }, {
          spriteType: "static",
          movementType: "static",
          animSpeed: "",
          updateScript: undefined
        }]
      },
    ],
  });
});

test("should migrate actors with movementType=static and animate=true should keep original animSpeed", () => {
  const oldProject = {
    scenes: [
      {
        actors: [{
          movementType: "static",
          animate: true,
          animSpeed: "3"
        }, {
          movementType: "static",
          animate: true,
          animSpeed: "2"
        }]
      },
    ]
  };

  const newProject = migrateFrom120To200Actors(oldProject);

  expect(newProject).toEqual({
    scenes: [
      {
        actors: [{
          spriteType: "static",
          movementType: "static",
          animate: true,
          animSpeed: "3",
          updateScript: undefined
        }, {
          spriteType: "static",
          movementType: "static",
          animate: true,
          animSpeed: "2",
          updateScript: undefined
        }]
      },
    ],
  });
});

test("should migrate player set sprite with persist=true to match old default", () => {
  const oldEvent = {
    id: "abc",
    command: "EVENT_PLAYER_SET_SPRITE",
    args: {
      spriteSheetId: "def"
    }
  };
  expect(migrateFrom120To200Event(oldEvent)).toEqual({
    id: "abc",
    command: "EVENT_PLAYER_SET_SPRITE",
    args: {
      spriteSheetId: "def",
      persist: true,
    }    
  })
})