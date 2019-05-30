import { compile } from "../../src/lib/events/eventDisplayText";

test("Should be able to display text", () => {
  const mockDisplayText = jest.fn();

  compile(
    {
      text: "Hello World"
    },
    {
      displayText: mockDisplayText
    }
  );
  expect(mockDisplayText).toBeCalledWith("Hello World");
});

test("Should be able to display multiple text boxes", () => {
  const mockDisplayText = jest.fn();
  const mockTextSetOpenInstant = jest.fn();
  const mockTextSetCloseInstant = jest.fn();
  const mockTextRestoreOpenSpeed = jest.fn();
  const mockTextRestoreCloseSpeed = jest.fn();

  compile(
    {
      text: ["Hello World", "Goodbye World"]
    },
    {
      displayText: mockDisplayText,
      textSetOpenInstant: mockTextSetOpenInstant,
      textSetCloseInstant: mockTextSetCloseInstant,
      textRestoreOpenSpeed: mockTextRestoreOpenSpeed,
      textRestoreCloseSpeed: mockTextRestoreCloseSpeed
    }
  );
  expect(mockTextSetCloseInstant).toHaveBeenCalledBefore(mockDisplayText);
  expect(mockTextRestoreCloseSpeed).toHaveBeenCalledAfter(mockDisplayText);
  expect(mockTextSetOpenInstant).toHaveBeenCalledAfter(mockDisplayText);
  expect(mockTextRestoreOpenSpeed).toHaveBeenCalledAfter(mockDisplayText);
  expect(mockDisplayText.mock.calls.length).toBe(2);
  expect(mockDisplayText).toBeCalledWith("Hello World");
  expect(mockDisplayText).toBeCalledWith("Goodbye World");
});
