import { compile } from "../../src/lib/events/eventChoice";

test("Should be able to display a multiple choice option", () => {
  const mockDisplayChoice = jest.fn();
  compile(
    {
      variable: "5",
      trueText: "Hello",
      falseText: "Goodbye"
    },
    {
      displayChoice: mockDisplayChoice
    }
  );
  expect(mockDisplayChoice).toBeCalledWith("5", {
    trueText: "Hello",
    falseText: "Goodbye"
  });
});
