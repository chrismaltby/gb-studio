import compile, {
  precompileBackgrounds,
  precompileScenes,
} from "../../../src/lib/compiler/compileData";
import {
  EVENT_TEXT,
  EVENT_IF_TRUE,
  EVENT_SET_TRUE,
} from "../../../src/lib/compiler/eventTypes";

test("should compile simple project into files object", async () => {
  const project = {
    startSceneId: "1",
    startX: 5,
    startY: 6,
    startDirection: "down",
    settings: {
      playerSpriteSheetId: "SPRITE_1",
      defaultPlayerSprites: {},
    },
    scenes: [
      {
        id: "1",
        name: "first_scene",
        symbol: "scene_1",
        backgroundId: "2",
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
            symbol: "actor_9",
            spriteSheetId: "SPRITE_1",
            script: [
              {
                command: EVENT_TEXT,
                args: {
                  text: 'HELLO "WORLD',
                },
              },
              {
                command: EVENT_TEXT,
                args: {
                  text: "LOREM IPSUM",
                },
              },
            ],
          },
          {
            id: "12",
            symbol: "actor_12",
            spriteSheetId: "SPRITE_2",
            script: [
              {
                command: EVENT_TEXT,
                args: {
                  text: 'HELLO "WORLD',
                },
              },
            ],
          },
        ],
        triggers: [
          {
            id: "92",
            symbol: "trigger_92",
            x: 1,
            y: 2,
            width: 5,
            height: 1,
            trigger: "walk",
            script: [
              {
                command: EVENT_TEXT,
                args: {
                  text: "TRIGGER TEST",
                },
              },
            ],
            leaveScript: [],
          },
        ],
        script: [],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
      {
        id: "5",
        name: "second_scene",
        symbol: "scene_2",
        backgroundId: "3",
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
            symbol: "actor_10",
            spriteSheetId: "SPRITE_1",
            script: [
              {
                command: EVENT_IF_TRUE,
                args: {
                  variable: "1",
                },
                children: {
                  true: [
                    {
                      command: EVENT_TEXT,
                      args: {
                        text: "LOREM IPSUM",
                      },
                    },
                  ],
                  false: [
                    {
                      command: EVENT_TEXT,
                      args: {
                        text: "NOT YET",
                      },
                    },
                    {
                      command: EVENT_SET_TRUE,
                      args: {
                        variable: "1",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
        triggers: [],
        script: [],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
      {
        id: "6",
        name: "third_scene",
        symbol: "scene_3",
        backgroundId: "4",
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
            script: [],
          },
        ],
        triggers: [],
        script: [],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
      {
        id: "9",
        name: "fourth_scene",
        symbol: "scene_4",
        backgroundId: "7",
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
        triggers: [],
        script: [],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
      {
        id: "10",
        name: "fifth_scene",
        symbol: "scene_5",
        backgroundId: "8",
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
            symbol: "trigger_91",
            x: 1,
            y: 2,
            width: 5,
            height: 1,
            trigger: "walk",
            script: [
              {
                command: EVENT_TEXT,
                args: {
                  text: "TRIGGER TEST",
                },
              },
            ],
            leaveScript: [],
          },
        ],
        script: [],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
    ],
    backgrounds: [
      {
        id: "2",
        symbol: "bg_1",
        width: 20,
        height: 32,
        imageWidth: 160,
        imageHeight: 256,
        filename: "forest_clearing.png",
      },
      {
        id: "3",
        symbol: "bg_2",
        width: 20,
        height: 18,
        imageWidth: 160,
        imageHeight: 256,
        filename: "mabe_house.png",
      },
      {
        id: "4",
        symbol: "bg_3",
        width: 32,
        height: 32,
        imageWidth: 256,
        imageHeight: 256,
        filename: "village_street_night.png",
      },
      {
        id: "7",
        symbol: "bg_4",
        width: 20,
        height: 18,
        imageWidth: 160,
        imageHeight: 256,
        filename: "home_bedroom_night.png",
      },
      {
        id: "8",
        symbol: "bg_5",
        width: 20,
        height: 18,
        imageWidth: 160,
        imageHeight: 256,
        filename: "boss.png",
      },
    ],
    spriteSheets: [
      {
        id: "SPRITE_1",
        symbol: "sprite_1",
        filename: "sprite_1.png",
        states: [
          {
            id: "SPRITE_STATE_1",
            name: "",
            animations: [
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
            ],
          },
        ],
      },
      {
        id: "SPRITE_2",
        symbol: "sprite_2",
        filename: "sprite_2.png",
        states: [
          {
            id: "SPRITE_STATE_2",
            name: "",
            animations: [
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
            ],
          },
        ],
      },
      {
        id: "SPRITE_3",
        symbol: "sprite_3",
        filename: "sprite_3.png",
        states: [
          {
            id: "SPRITE_STATE_3",
            name: "",
            animations: [
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
            ],
          },
        ],
      },
    ],
    music: [],
    fonts: [
      {
        id: "font1",
        symbol: "font_1",
        filename: "gbs-mono.png",
      },
    ],
    palettes: [],
    avatars: [],
    emotes: [],
  };
  const compiled = await compile(project, {
    projectRoot: `${__dirname}/_files`,
    // eventEmitter: {
    //   emit: (a, b) => console.log(a, ":", b)
    // }
  });
  expect(compiled).toBeInstanceOf(Object);
});

test("should precompile image data", async () => {
  const backgrounds = [
    {
      id: "2b",
      name: "test_img",
      width: 20,
      height: 18,
      imageWidth: 160,
      imageHeight: 144,
      filename: "test_img.png",
    },
    {
      id: "3b",
      name: "test_img2",
      width: 20,
      height: 18,
      imageWidth: 160,
      imageHeight: 144,
      filename: "test_img2.png",
    },
  ];
  const scenes = [
    {
      id: "1",
      name: "first_scene",
      backgroundId: "2b",
      actors: [],
      triggers: [],
    },
  ];
  const { usedBackgrounds, backgroundLookup } = await precompileBackgrounds(
    backgrounds,
    scenes,
    {},
    `${__dirname}/_files`,
    `${__dirname}/_tmp`
  );
  expect(usedBackgrounds).toHaveLength(1);
  expect(backgroundLookup["2b"]).toBe(backgrounds[0]);
  expect(backgroundLookup["3b"]).toBeUndefined();
});

test("should precompile scenes", async () => {
  const scenes = [
    {
      id: "1",
      backgroundId: "3",
      type: "TOPDOWN",
      actors: [
        {
          spriteSheetId: "5",
        },
      ],
      triggers: [],
    },
    {
      id: "2",
      backgroundId: "4",
      type: "TOPDOWN",
      actors: [
        {
          spriteSheetId: "5",
        },
        {
          spriteSheetId: "6",
        },
      ],
      triggers: [],
    },
  ];
  const usedBackgrounds = [
    {
      id: "3",
    },
    {
      id: "4",
    },
  ];
  const spriteData = [
    {
      id: "5",
    },
    {
      id: "6",
    },
  ];
  const defaultPlayerSprites = {
    TOPDOWN: "5",
  };
  const sceneData = precompileScenes(
    scenes,
    {},
    defaultPlayerSprites,
    usedBackgrounds,
    spriteData
  );

  expect(sceneData).toHaveLength(scenes.length);
  expect(sceneData[0].sprites).toHaveLength(1);
  expect(sceneData[1].sprites).toHaveLength(2);
});

test("should precompile script", async () => {});
