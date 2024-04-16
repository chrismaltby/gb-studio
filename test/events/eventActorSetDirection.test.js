import { compile } from "../../src/lib/events/eventActorSetDirection";

test("Should set player direction", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetDirection = jest.fn();

  compile(
    {
      actorId: "player",
      direction: {
        type: "direction",
        value: "up",
      },
    },
    {
      scene: { actors: [] },
      actorSetActive: mockactorSetActive,
      actorSetDirectionToScriptValue: mockActorSetDirection,
    }
  );
  expect(mockActorSetDirection).toBeCalledWith("player", {
    type: "direction",
    value: "up",
  });
  expect(mockactorSetActive).not.toBeCalled();
});

test("Should set actor direction", () => {
  const mockActorSetDirection = jest.fn();

  compile(
    {
      actorId: "abc",
      direction: {
        type: "direction",
        value: "right",
      },
    },
    {
      scene: {
        actors: [
          {
            id: "abc",
          },
        ],
      },
      actorSetDirectionToScriptValue: mockActorSetDirection,
    }
  );
  expect(mockActorSetDirection).toBeCalledWith("abc", {
    type: "direction",
    value: "right",
  });
});

test("Should set frame of actor using static movement", () => {
  const mockActorSetDirection = jest.fn();

  compile(
    {
      actorId: "abc",
      direction: {
        type: "direction",
        value: "up",
      },
    },
    {
      scene: {
        actors: [
          {
            id: "abc",
            spriteType: "static",
            spriteSheetId: "def",
          },
        ],
      },
      sprites: [
        {
          id: "def",
          numFrames: 6,
        },
      ],
      actorSetDirectionToScriptValue: mockActorSetDirection,
    }
  );
  expect(mockActorSetDirection).toBeCalledWith("abc", {
    type: "direction",
    value: "up",
  });
});

test("Should set flip actor using static movement when facing left", () => {
  const mockActorSetDirection = jest.fn();

  compile(
    {
      actorId: "abc",
      direction: {
        type: "direction",
        value: "left",
      },
    },
    {
      scene: {
        actors: [
          {
            id: "abc",
            spriteType: "static",
            spriteSheetId: "def",
          },
        ],
      },
      sprites: [
        {
          id: "def",
          numFrames: 6,
        },
      ],
      actorSetDirectionToScriptValue: mockActorSetDirection,
    }
  );
  expect(mockActorSetDirection).toBeCalledWith("abc", {
    type: "direction",
    value: "left",
  });
});

test("Should not set frame if spritesheet has no frames", () => {
  const mockActorSetDirection = jest.fn();

  compile(
    {
      actorId: "abc",
      direction: {
        type: "direction",
        value: "left",
      },
    },
    {
      scene: {
        actors: [
          {
            id: "abc",
            spriteType: "static",
            spriteSheetId: "def",
          },
        ],
      },
      sprites: [
        {
          id: "def",
        },
      ],
      actorSetDirectionToScriptValue: mockActorSetDirection,
    }
  );

  expect(mockActorSetDirection).lastCalledWith("abc", {
    type: "direction",
    value: "left",
  });

  compile(
    {
      actorId: "abc",
      direction: {
        type: "direction",
        value: "right",
      },
    },
    {
      scene: {
        actors: [
          {
            id: "abc",
            spriteType: "static",
            spriteSheetId: "def",
          },
        ],
      },
      sprites: [],
      actorSetDirectionToScriptValue: mockActorSetDirection,
    }
  );

  expect(mockActorSetDirection).lastCalledWith("abc", {
    type: "direction",
    value: "right",
  });
});
