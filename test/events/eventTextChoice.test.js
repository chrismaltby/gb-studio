import { compile } from "../../src/lib/events/eventTextChoice";

test("Should be able to display a multiple choice option", () => {
  const mockTextChoice = jest.fn();
  compile(
    {
      variable: "5",
      trueText: "Hello",
      falseText: "Goodbye"
    },
    {
      textChoice: mockTextChoice
    }
  );
  expect(mockTextChoice).toBeCalledWith("5", {
    trueText: "Hello",
    falseText: "Goodbye"
  });
});
