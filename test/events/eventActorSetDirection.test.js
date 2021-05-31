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
      actorSetDirection: mockActorSetDirection,
    }
  );
  expect(mockactorSetActive).toBeCalledWith("player");
  expect(mockActorSetDirection).toBeCalledWith("up");
});

test("Should set actor direction", () => {
  const mockactorSetActive = jest.fn();
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
      actorSetActive: mockactorSetActive,
      actorSetDirection: mockActorSetDirection,
    }
  );
  expect(mockactorSetActive).toBeCalledWith("abc");
  expect(mockActorSetDirection).toBeCalledWith("right");
});

test("Should set frame of actor using static movement", () => {
  const mockactorSetActive = jest.fn();
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
      actorSetActive: mockactorSetActive,
      actorSetDirection: mockActorSetDirection,
    }
  );
  expect(mockactorSetActive).toBeCalledWith("abc");
  expect(mockActorSetDirection).toBeCalledWith("up");
});

test("Should set flip actor using static movement when facing left", () => {
  const mockactorSetActive = jest.fn();
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
      actorSetActive: mockactorSetActive,
      actorSetDirection: mockActorSetDirection,
    }
  );
  expect(mockactorSetActive).toBeCalledWith("abc");
  expect(mockActorSetDirection).toBeCalledWith("left");
});

test("Should not set frame if spritesheet has no frames", () => {
  const mockactorSetActive = jest.fn();
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
      actorSetActive: mockactorSetActive,
      actorSetDirection: mockActorSetDirection,
    }
  );

  expect(mockactorSetActive).lastCalledWith("abc");
  expect(mockActorSetDirection).lastCalledWith("left");

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
      actorSetActive: mockactorSetActive,
      actorSetDirection: mockActorSetDirection,
    }
  );

  expect(mockactorSetActive).lastCalledWith("abc");
  expect(mockActorSetDirection).lastCalledWith("right");
});
