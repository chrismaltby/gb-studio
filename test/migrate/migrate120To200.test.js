import { migrateFrom120To200Collisions, migrateFrom120To200Event } from "../../src/lib/project/migrateProject";

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
