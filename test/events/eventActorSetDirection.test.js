import { compile } from "../../src/lib/events/eventActorSetDirection";

test("Should set player direction", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetDirection = jest.fn();

  compile(
    {
      actorId: "player",
      direction: "up"
    },
    {
      scene: { actors: [] },
      actorSetActive: mockactorSetActive,
      actorSetDirection: mockActorSetDirection
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
      direction: "right"
    },
    {
      scene: {
        actors: [
          {
            id: "abc"
          }
        ]
      },
      actorSetActive: mockactorSetActive,
      actorSetDirection: mockActorSetDirection
    }
  );
  expect(mockactorSetActive).toBeCalledWith("abc");
  expect(mockActorSetDirection).toBeCalledWith("right");
});

test("Should set frame of actor using static movement", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetDirection = jest.fn();
  const mockActorSetFrame = jest.fn();
  const mockActorSetFlip = jest.fn();

  compile(
    {
      actorId: "abc",
      direction: "up"
    },
    {
      scene: {
        actors: [
          {
            id: "abc",
            movementType: "static",
            spriteSheetId: "def"
          }
        ]
      },
      sprites: [
        {
          id: "def",
          numFrames: 6
        }
      ],
      actorSetActive: mockactorSetActive,
      actorSetDirection: mockActorSetDirection,
      actorSetFrame: mockActorSetFrame,
      actorSetFlip: mockActorSetFlip
    }
  );
  expect(mockactorSetActive).toBeCalledWith("abc");
  expect(mockActorSetDirection).toBeCalledWith("up");
  expect(mockActorSetFrame).toBeCalledWith(2);
  expect(mockActorSetFlip).toBeCalledWith(false);
});

test("Should set flip actor using static movement when facing left", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetDirection = jest.fn();
  const mockActorSetFrame = jest.fn();
  const mockActorSetFlip = jest.fn();

  compile(
    {
      actorId: "abc",
      direction: "left"
    },
    {
      scene: {
        actors: [
          {
            id: "abc",
            movementType: "static",
            spriteSheetId: "def"
          }
        ]
      },
      sprites: [
        {
          id: "def",
          numFrames: 6
        }
      ],
      actorSetActive: mockactorSetActive,
      actorSetDirection: mockActorSetDirection,
      actorSetFrame: mockActorSetFrame,
      actorSetFlip: mockActorSetFlip
    }
  );
  expect(mockactorSetActive).toBeCalledWith("abc");
  expect(mockActorSetDirection).toBeCalledWith("left");
  expect(mockActorSetFrame).toBeCalledWith(4);
  expect(mockActorSetFlip).toBeCalledWith(true);
});

test("Should not set frame if spritesheet has no frames", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetDirection = jest.fn();
  const mockActorSetFrame = jest.fn();
  const mockActorSetFlip = jest.fn();

  compile(
    {
      actorId: "abc",
      direction: "left"
    },
    {
      scene: {
        actors: [
          {
            id: "abc",
            movementType: "static",
            spriteSheetId: "def"
          }
        ]
      },
      sprites: [
        {
          id: "def"
        }
      ],
      actorSetActive: mockactorSetActive,
      actorSetDirection: mockActorSetDirection,
      actorSetFrame: mockActorSetFrame,
      actorSetFlip: mockActorSetFlip
    }
  );

  expect(mockactorSetActive).lastCalledWith("abc");
  expect(mockActorSetDirection).lastCalledWith("left");
  expect(mockActorSetFrame).not.toHaveBeenCalled();
  expect(mockActorSetFlip).not.toHaveBeenCalled();

  compile(
    {
      actorId: "abc",
      direction: "right"
    },
    {
      scene: {
        actors: [
          {
            id: "abc",
            movementType: "static",
            spriteSheetId: "def"
          }
        ]
      },
      sprites: [],
      actorSetActive: mockactorSetActive,
      actorSetDirection: mockActorSetDirection,
      actorSetFrame: mockActorSetFrame,
      actorSetFlip: mockActorSetFlip
    }
  );

  expect(mockactorSetActive).lastCalledWith("abc");
  expect(mockActorSetDirection).lastCalledWith("right");
  expect(mockActorSetFrame).not.toHaveBeenCalled();
  expect(mockActorSetFlip).not.toHaveBeenCalled();
});
