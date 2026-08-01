import { compile } from "../../src/lib/events/eventIfInput";

test("Should be able to conditionally execute if input is pressed", () => {
  const mockIfInput = jest.fn();
  const truePath = [{ command: "EVENT_END", id: "abc" }];
  const falsePath = [{ command: "EVENT_END", id: "def" }];
  compile(
    {
      input: ["a", "b"],
      true: truePath,
      false: falsePath,
    },
    {
      ifInput: mockIfInput,
    },
  );
  expect(mockIfInput).toHaveBeenCalledWith(["a", "b"], truePath, falsePath, 0);
});

test("Should be able to conditionally execute if input is pressed for controller 3", () => {
  const mockIfInput = jest.fn();
  const truePath = [{ command: "EVENT_END", id: "abc" }];
  const falsePath = [{ command: "EVENT_END", id: "def" }];
  compile(
    {
      input: ["a", "b"],
      true: truePath,
      false: falsePath,
      joypad: 2,
    },
    {
      ifInput: mockIfInput,
    },
  );
  expect(mockIfInput).toHaveBeenCalledWith(["a", "b"], truePath, falsePath, 2);
});
