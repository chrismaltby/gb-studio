import { compile } from "../../src/lib/events/eventTextDialogue";

test("Should be able to display text", () => {
  const mockTextDialogue = jest.fn();

  compile(
    {
      text: "Hello World",
      avatarId: "1",
    },
    {
      textDialogue: mockTextDialogue,
    }
  );
  expect(mockTextDialogue).toBeCalledWith("Hello World", "1");
});

test("Should be able to display multiple text boxes", () => {
  const mockTextDialogue = jest.fn();

  compile(
    {
      text: ["Hello World", "Goodbye World"],
      avatarId: "1",
    },
    {
      textDialogue: mockTextDialogue,
    }
  );
  expect(mockTextDialogue.mock.calls.length).toBe(1);
  expect(mockTextDialogue).toBeCalledWith(
    ["Hello World", "Goodbye World"],
    "1"
  );
});
