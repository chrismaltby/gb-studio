import { migrateFrom120To200CustomEvents, migrateFrom120To200Collisions, migrateFrom120To200Event, migrateFrom120To200Actors } from "../../src/lib/project/migrateProject";

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

test("should migrate custom events from 1.2.0 to 2.0.0", () => {
  const oldProject = {
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            id: "abc",
            command: "EVENT_CALL_CUSTOM_EVENT",
            args: {
              customEventId: "CE1",
              __name: "Custom Event 1",
              "$variable[0]$": "1",
              "$variable[1]$": "4",
              "$variable[2]$": "6",
              "$variable[3]$": "13",
              "$variable[4]$": "8",
              "$variable[5]$": "123",
              "$variable[6]$": "L1",
              "$variable[7]$": "123",
              "$variable[8]$": "L3",
              "$variable[9]$": "234",
              "$actor[0]$": "actor_1",
              "$actor[1]$": "actor_12",
              "$actor[2]$": "actor_21",
              "$actor[3]$": "actor_21",
              "$actor[4]$": "actor_24",
              "$actor[5]$": "actor_1",
              "$actor[6]$": "actor_22",
              "$actor[7]$": "$self$",
              "$actor[8]$": "actor_42",
              "$actor[9]$": "actor_12"
            },
            children: {
              script: [
                {
                  id: 1000
                }
              ]
            }
          },
        ]
      }
    ],
    customEvents: [
      {
        id: "CE1",
        variables: {
          "0": {
              id: "0",
              name: "Initial Time"
          },
          "1": {
              id: "1",
              name: "Frame Helper"
          }
        },
        actors: {
            "0": {
                id: "0",
                name: "Actor Tens"
            },
            "1": {
                id: "1",
                name: "Actor Unit"
            }
        },
        script: [
          {
            id: "S0",
            command: "command_0"
          },
          {
            id: "S1",
            command: "command_1",
            args: {
              foo: "bar",
              variable: "1"
            },
            children: {
              true: [
                {
                  args: {
                    vectorX: "2",
                    vectorY: "3"
                  }
                },
              ]
            }
          }
        ]
      }
    ]
  };
  const newProject = migrateFrom120To200CustomEvents(oldProject);
  expect(newProject).toEqual(
    {
      scenes: [
        {
          actors: [],
          triggers: [],
          collisions: [],
          playerHit1Script: [],
          playerHit2Script: [],
          playerHit3Script: [],
          script: [
            {
              id: "abc",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: {
                customEventId: "CE1",
                __name: "Custom Event 1",
                __parameter_A0: "actor_1",
                __parameter_A1: "actor_12",
                __parameter_A2: "actor_21",
                __parameter_A3: "actor_21",
                __parameter_A4: "actor_24",
                __parameter_A5: "actor_1",
                __parameter_A6: "actor_22",
                __parameter_A7: "$self$",
                __parameter_A8: "actor_42",
                __parameter_A9: "actor_12",
                __parameter_V0: "1",
                __parameter_V1: "4",
                __parameter_V2: "6",
                __parameter_V3: "13",
                __parameter_V4: "8",
                __parameter_V5: "123",
                __parameter_V6: "L1",
                __parameter_V7: "123",
                __parameter_V8: "L3",
                __parameter_V9: "234"
              },
              children: {}
            }
          ],
        }
      ],
      customEvents: [
        {
          id: "CE1",
          variables: {
            "0": {
                id: "0",
                name: "Initial Time"
            },
            "1": {
                id: "1",
                name: "Frame Helper"
            }
          },
          actors: {
              "0": {
                  id: "0",
                  name: "Actor Tens"
              },
              "1": {
                  id: "1",
                  name: "Actor Unit"
              }
          },
          script: [
            {
              id: "S0",
              command: "command_0"
            },
            {
              id: "S1",
              command: "command_1",
              args: {
                foo: "bar",
                variable: "V1"
              },
              children: {
                true: [
                  {
                    args: {
                      vectorX: "V2",
                      vectorY: "V3"
                    }
                  },
                ]
              }
            }
          ]
        }
      ]    
    }
  );
});

test("should migrate custom events from 1.2.0 to 2.0.0 even if the called custom event doesn't exist", () => {
  const oldProject = {
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            id: "abc",
            command: "EVENT_CALL_CUSTOM_EVENT",
            args: {
              customEventId: "CE1",
              __name: "Custom Event 1",
              "$variable[0]$": "1",
              "$variable[1]$": "4",
              "$variable[2]$": "6",
              "$variable[3]$": "13",
              "$variable[4]$": "8",
              "$variable[5]$": "123",
              "$variable[6]$": "L1",
              "$variable[7]$": "123",
              "$variable[8]$": "L3",
              "$variable[9]$": "234",
              "$actor[0]$": "actor_1",
              "$actor[1]$": "actor_12",
              "$actor[2]$": "actor_21",
              "$actor[3]$": "actor_21",
              "$actor[4]$": "actor_24",
              "$actor[5]$": "actor_1",
              "$actor[6]$": "actor_22",
              "$actor[7]$": "$self$",
              "$actor[8]$": "actor_42",
              "$actor[9]$": "actor_12"
            },
            children: {
              script: [
                {
                  id: 1000
                }
              ]
            }
          },
        ]
      }
    ],
    customEvents: []
  };
  const newProject = migrateFrom120To200CustomEvents(oldProject);
  expect(newProject).toEqual(
    {
      scenes: [
        {
          actors: [],
          triggers: [],
          collisions: [],
          playerHit1Script: [],
          playerHit2Script: [],
          playerHit3Script: [],
          script: [
            {
              id: "abc",
              command: "EVENT_GROUP",
              args: {
                __label: "Custom Event 1"
              },
              children: {
                true: [
                  {
                    command: "EVENT_COMMENT",
                    args: {
                      text: "This Event Group was created during the migration to 2.0.0. It contains the script of a Custom Event that doesn't exist in this project anymore.",
                      __collapse: true
                    },
                  },
                  {
                    id: 1000
                  }
                ]
              }  
            }
          ],
        }
      ],
      customEvents: []    
    }
  );
});
