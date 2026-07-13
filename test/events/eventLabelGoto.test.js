import { compile } from "../../src/lib/events/eventLabelGoto";

test("Should be able to jump to an event label", () => {
  const mockLabelGoto = jest.fn();

  compile(
    { label: "my_label" },
    {
      labelGoto: mockLabelGoto,
    },
  );

  expect(mockLabelGoto).toHaveBeenCalledWith("my_label");
});
