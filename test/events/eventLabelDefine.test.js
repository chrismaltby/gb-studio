import { compile } from "../../src/lib/events/eventLabelDefine";

test("Should be able to define an event label", () => {
  const mockLabelDefine = jest.fn();

  compile(
    { label: "my_label" },
    {
      labelDefine: mockLabelDefine
    }
  );

  expect(mockLabelDefine).toBeCalledWith("my_label");
});
