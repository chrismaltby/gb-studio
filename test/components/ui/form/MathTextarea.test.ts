/**
 * @jest-environment jsdom
 */
import { operatorRegex, operatorSymbols } from "ui/form/MathTextarea";

describe("MathTextarea", () => {
  test("operatorRegex should match every operator symbol literally", () => {
    for (const operator of operatorSymbols) {
      const match = operator.id.match(operatorRegex);

      expect(match?.[0]).toBe(operator.id);
    }
  });
});
