import { compile } from "../../src/lib/events/eventTextSetAnimationSpeed";

test("Should be able to set text box animation speeds", () => {
  const mockTextSetAnimSpeed = jest.fn();

  compile(
    {
      speedIn: 2,
      speedOut: 3,
      speed: 4
    },
    {
      textSetAnimSpeed: mockTextSetAnimSpeed
    }
  );
  expect(mockTextSetAnimSpeed).toBeCalledWith(2, 3, 4);
});
