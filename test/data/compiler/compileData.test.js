import compile, {
  precompileFlags,
  precompileStrings,
  precompileImages,
  precompileSprites,
  precompileScenes
} from "../../../src/lib/data/compiler/compileData";
import {
  EVENT_TEXT,
  EVENT_IF_FLAG,
  EVENT_SET_FLAG
} from "../../../src/lib/data/compiler/eventTypes";

test("should compile simple project into files object", async () => {
  const project = {
    startSceneId: "1",
    startX: 5,
    startY: 6,
    startDirection: "down",
    scenes: [
      {
        id: "1",
        name: "first_scene",
        imageId: "2",
        width: 20,
        height: 18,
        // prettier-ignore
        collisions: [
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0
        ],
        actors: [
          {
            id: "9",
            spriteSheetId: "SPRITE_1",
            events: [
              {
                command: EVENT_TEXT,
                args: {
                  text: 'HELLO "WORLD'
                }
              },
              {
                command: EVENT_TEXT,
                args: {
                  text: "LOREM IPSUM"
                }
              }
            ]
          },
          {
            id: "12",
            spriteSheetId: "SPRITE_2",
            events: [
              {
                command: EVENT_TEXT,
                args: {
                  text: 'HELLO "WORLD'
                }
              }
            ]
          }
        ],
        triggers: [
          {
            id: "92",
            x: 1,
            y: 2,
            width: 5,
            height: 1,
            trigger: "walk",
            events: [
              {
                command: EVENT_TEXT,
                args: {
                  text: "TRIGGER TEST"
                }
              }
            ]
          }
        ]
      },
      {
        id: "5",
        name: "second_scene",
        imageId: "3",
        width: 32,
        height: 32,
        // prettier-ignore
        collisions: [
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0
        ],
        actors: [
          {
            id: "10",
            events: [
              {
                command: EVENT_IF_FLAG,
                args: {
                  flag: "1"
                },
                true: [
                  {
                    command: EVENT_TEXT,
                    args: {
                      text: "LOREM IPSUM"
                    }
                  }
                ],
                false: [
                  {
                    command: EVENT_TEXT,
                    args: {
                      text: "NOT YET"
                    }
                  },
                  {
                    command: EVENT_SET_FLAG,
                    args: {
                      flag: "1"
                    }
                  }
                ]
              }
            ]
          }
        ],
        triggers: []
      },
      {
        id: "6",
        name: "third_scene",
        imageId: "4",
        width: 20,
        height: 18,
        // prettier-ignore
        collisions: [
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0
        ],
        actors: [
          {
            id: "99",
            spriteSheetId: "SPRITE_1",
            events: []
          }
        ],
        triggers: []
      },
      {
        id: "9",
        name: "fourth_scene",
        imageId: "7",
        width: 20,
        height: 18,
        // prettier-ignore
        collisions: [
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0
        ],
        actors: [],
        triggers: []
      },
      {
        id: "10",
        name: "fifth_scene",
        imageId: "8",
        width: 20,
        height: 18,
        // prettier-ignore
        collisions: [
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0
        ],
        actors: [],
        triggers: [
          {
            id: "91",
            x: 1,
            y: 2,
            width: 5,
            height: 1,
            trigger: "walk",
            events: [
              {
                command: EVENT_TEXT,
                args: {
                  text: "TRIGGER TEST"
                }
              }
            ]
          }
        ]
      }
    ],
    images: [
      {
        id: "2",
        width: 20,
        height: 32,
        filename: "forest_clearing.png"
      },
      {
        id: "3",
        width: 20,
        height: 18,
        filename: "mabe_house.png"
      },
      {
        id: "4",
        width: 32,
        height: 32,
        filename: "village_street_night.png"
      },
      {
        id: "7",
        width: 20,
        height: 18,
        filename: "home_bedroom_night.png"
      },
      {
        id: "8",
        width: 20,
        height: 18,
        filename: "boss.png"
      }
    ],
    spriteSheets: [
      {
        id: "SPRITE_1",
        filename: "sprite_1.png"
      },
      {
        id: "SPRITE_2",
        filename: "sprite_2.png"
      },
      {
        id: "SPRITE_3",
        filename: "sprite_3.png"
      }
    ]
  };
  const compiled = await compile(project, {
    projectRoot: `${__dirname}/_files`
    // eventEmitter: {
    //   emit: (a, b) => console.log(a, ":", b)
    // }
  });
  expect(compiled).toBeInstanceOf(Object);
});

test("should walk all scene events to build list of used flags", () => {
  const scenes = [
    {
      id: "1",
      actors: [
        {
          id: "2",
          events: [
            {
              id: "3",
              command: "IF_FLAG",
              args: { flag: "9" },
              true: [
                {
                  id: "4",
                  command: "TEXT",
                  args: { text: "LINE 2" }
                },
                {
                  id: "5",
                  command: "END"
                }
              ],
              false: [
                {
                  id: "6",
                  command: "SET_FLAG",
                  args: { flag: "9" }
                },
                {
                  id: "7",
                  command: "TEXT",
                  args: { text: "LINE 1" }
                },
                {
                  id: "8",
                  command: "END"
                }
              ]
            },
            {
              id: "9",
              command: "END"
            }
          ]
        }
      ],
      triggers: [
        {
          id: "10",
          events: [
            {
              id: "11",
              command: "SET_FLAG",
              args: { flag: "10" }
            },
            {
              id: "12",
              command: "SET_FLAG",
              args: { flag: "9" }
            },
            {
              id: "13",
              command: "END"
            }
          ]
        }
      ]
    }
  ];
  const precompiledFlags = precompileFlags(scenes);
  expect(precompiledFlags).toEqual(["9", "10"]);
});

test("should walk all scene events to build list of strings", () => {
  const scenes = [
    {
      id: "1",
      actors: [
        {
          id: "2",
          events: [
            {
              id: "3",
              command: "IF_FLAG",
              args: { flag: "9" },
              true: [
                {
                  id: "4",
                  command: "TEXT",
                  args: { text: "LINE 2" }
                },
                {
                  id: "5",
                  command: "END"
                }
              ],
              false: [
                {
                  id: "6",
                  command: "SET_FLAG",
                  args: { flag: "9" }
                },
                {
                  id: "7",
                  command: "TEXT",
                  args: { text: "LINE 1" }
                },
                {
                  id: "8",
                  command: "END"
                }
              ]
            },
            {
              id: "9",
              command: "END"
            }
          ]
        }
      ],
      triggers: [
        {
          id: "10",
          events: [
            {
              id: "11",
              command: "TEXT",
              args: { text: "LINE 2" }
            },
            {
              id: "12",
              command: "TEXT",
              args: { text: "LINE 3" }
            }
          ]
        }
      ]
    }
  ];
  const precompiledStrings = precompileStrings(scenes);
  expect(precompiledStrings).toEqual(["LINE 2", "LINE 1", "LINE 3"]);
});

test("should precompile image data", async () => {
  const images = [
    {
      id: "2",
      name: "test_img",
      width: 20,
      height: 18,
      filename: "test_img.png"
    },
    {
      id: "3",
      name: "test_img2",
      width: 20,
      height: 18,
      filename: "test_img2.png"
    }
  ];
  const scenes = [
    {
      id: "1",
      name: "first_scene",
      imageId: "2",
      actors: [],
      triggers: []
    }
  ];
  const { usedImages, imageLookup, imageData } = await precompileImages(
    images,
    scenes,
    `${__dirname}/_files`
  );
  expect(usedImages).toHaveLength(1);
  expect(imageLookup["2"]).toBe(images[0]);
  expect(imageLookup["3"]).toBeUndefined();
});

test.todo("should precompile sprites");

test("should precompile scenes", async () => {
  const scenes = [
    {
      id: "1",
      imageId: "3",
      actors: [
        {
          spriteSheetId: "5"
        }
      ]
    },
    {
      id: "2",
      imageId: "4",
      actors: [
        {
          spriteSheetId: "5"
        },
        {
          spriteSheetId: "6"
        }
      ]
    }
  ];
  const usedImages = [
    {
      id: "3"
    }
  ];
  const spriteData = [
    {
      id: "5"
    },
    {
      id: "6"
    }
  ];
  const sceneData = precompileScenes(scenes, usedImages, spriteData);

  expect(sceneData).toHaveLength(scenes.length);

  // expect(sceneData[0].tilemap).toBe(imageData.tilemaps["3"]);
  // expect(sceneData[0].tileset).toBe(imageData.tilemapsTileset["3"]);
  expect(sceneData[0].sprites).toHaveLength(1);
  expect(sceneData[1].sprites).toHaveLength(2);
});

test("should precompile script", async () => {});
