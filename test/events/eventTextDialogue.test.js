import { compile } from "../../src/lib/events/eventTextDialogue";

test("Should be able to display text", () => {
  const mockTextDialogue = jest.fn();

  compile(
    {
      text: "Hello World",
      avatarId: "1"
    },
    {
      textDialogue: mockTextDialogue
    }
  );
  expect(mockTextDialogue).toBeCalledWith("Hello World", "1");
});

test("Should be able to display multiple text boxes", () => {
  const mockTextDialogue = jest.fn();
  const mockTextSetOpenInstant = jest.fn();
  const mockTextSetCloseInstant = jest.fn();
  const mockTextRestoreOpenSpeed = jest.fn();
  const mockTextRestoreCloseSpeed = jest.fn();

  compile(
    {
      text: ["Hello World", "Goodbye World"],
      avatarId: "1"
    },
    {
      textDialogue: mockTextDialogue,
      textSetOpenInstant: mockTextSetOpenInstant,
      textSetCloseInstant: mockTextSetCloseInstant,
      textRestoreOpenSpeed: mockTextRestoreOpenSpeed,
      textRestoreCloseSpeed: mockTextRestoreCloseSpeed
    }
  );
  expect(mockTextSetCloseInstant).toHaveBeenCalledBefore(mockTextDialogue);
  expect(mockTextRestoreCloseSpeed).toHaveBeenCalledAfter(mockTextDialogue);
  expect(mockTextSetOpenInstant).toHaveBeenCalledAfter(mockTextDialogue);
  expect(mockTextRestoreOpenSpeed).toHaveBeenCalledAfter(mockTextDialogue);
  expect(mockTextDialogue.mock.calls.length).toBe(2);
  expect(mockTextDialogue).toBeCalledWith("Hello World", "1");
  expect(mockTextDialogue).toBeCalledWith("Goodbye World", "1");
});
