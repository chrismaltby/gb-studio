import {
  migrateFrom1To110Scenes,
  migrateFrom1To110Collisions,
  migrateFrom1To110Actors,
} from "../../src/lib/project/migrateProject";

test("should migrate 1 to 1.1.0 to add scene width & height values", () => {
  const input = {
    scenes: [
      {
        id: "s1",
        backgroundId: "b1",
        actors: [],
      },
      {
        id: "s2",
        actors: [],
      },
      {
        id: "s3",
        backgroundId: "b2",
        actors: [],
      },
    ],
    backgrounds: [
      {
        id: "b1",
        width: 256,
        height: 160,
      },
      {
        id: "b2",
        width: 176,
        height: 256,
      },
    ],
  };

  const output = migrateFrom1To110Scenes(input);
  expect(output).toMatchObject({
    ...input,
    scenes: [
      {
        id: "s1",
        backgroundId: "b1",
        actors: [],
        width: 256,
        height: 160,
      },
      {
        id: "s2",
        actors: [],
      },
      {
        id: "s3",
        backgroundId: "b2",
        actors: [],
        width: 176,
        height: 256,
      },
    ],
    backgrounds: [
      {
        id: "b1",
        width: 256,
        height: 160,
      },
      {
        id: "b2",
        width: 176,
        height: 256,
      },
    ],
  });
});

test("should migrate 1 to 1.1.0 to fix collisions arrays", () => {
  const input = {
    scenes: [
      {
        id: "s1",
        backgroundId: "b1",
        actors: [],
        collisions: [1, 2, 3, 4, 5, 6, 7, 8, 10], // Too large
      },
      {
        id: "s2",
        actors: [],
        // Missing collisions
      },
      {
        id: "s3",
        backgroundId: "b2",
        actors: [],
        collisions: [1, 2, 3, 4, 5, 6], // Just right
      },
    ],
    backgrounds: [
      {
        id: "b1",
        width: 16,
        height: 16,
      },
      {
        id: "b2",
        width: 24,
        height: 16,
      },
    ],
  };

  const output = migrateFrom1To110Collisions(input);
  expect(output).toMatchObject({
    ...input,
    scenes: [
      {
        id: "s1",
        collisions: [1, 2, 3, 4],
      },
      {
        id: "s2",
        collisions: [],
      },
      {
        id: "s3",
        collisions: [1, 2, 3, 4, 5, 6],
      },
    ],
  });
});

test("should migrate 1 to 1.1.0 actor format", () => {
  const input = {
    scenes: [
      {
        id: "s1",
        actors: [
          {
            id: "a1",
            spriteSheetId: "sp1",
            movementType: "static",
            direction: "down",
          },
          {
            id: "a2",
            spriteSheetId: "sp2",
            direction: "down",
          },
        ],
      },
      {
        id: "s2",
        actors: [
          {
            id: "a3",
            spriteSheetId: "sp2",
            movementType: "Static",
            direction: "down",
          },
          {
            id: "a4",
            spriteSheetId: "sp2",
            movementType: "static",
            direction: "down",
            frame: 5,
          },
          {
            id: "a5",
            spriteSheetId: "sp3",
            movementType: "static",
            direction: "down",
          },
          {
            id: "a6",
            spriteSheetId: "sp2",
            movementType: "Static",
            direction: "up",
          },
          {
            id: "a7",
            spriteSheetId: "sp2",
            movementType: "Static",
            direction: "left",
          },
        ],
      },
    ],
    spriteSheets: [
      {
        id: "sp1",
        numFrames: 3,
      },
      {
        id: "sp2",
        numFrames: 6,
      },
      {
        id: "sp3",
        numFrames: 1,
      },
    ],
  };

  const output = migrateFrom1To110Actors(input);
  expect(output.scenes[0].actors[1].frame).toBeUndefined();
  expect(output).toMatchObject({
    ...input,
    scenes: [
      {
        id: "s1",
        actors: [
          {
            id: "a1",
            spriteSheetId: "sp1",
            movementType: "static",
            direction: "down",
            frame: 0,
          },
          {
            id: "a2",
            spriteSheetId: "sp2",
          },
        ],
      },
      {
        id: "s2",
        actors: [
          {
            id: "a3",
            spriteSheetId: "sp2",
            movementType: "static",
            direction: "down",
            frame: 0,
          },
          {
            id: "a4",
            spriteSheetId: "sp2",
            movementType: "static",
            frame: 5,
          },
          {
            id: "a5",
            spriteSheetId: "sp3",
            frame: 0,
          },
          {
            id: "a6",
            spriteSheetId: "sp2",
            frame: 2,
          },
          {
            id: "a7",
            spriteSheetId: "sp2",
            frame: 4,
          },
        ],
      },
    ],
  });
});
