/** @jest-environment jsdom */

import { findSelectOption, Option } from "ui/form/Select";

describe("findSelectOption", () => {
  test("returns the original option instance from grouped options", () => {
    const selectedOption = { value: "selected", label: "Selected" };
    const options = [
      {
        label: "Group",
        options: [{ value: "first", label: "First" }, selectedOption],
      },
    ];

    expect(findSelectOption<Option>(options, "selected")).toBe(selectedOption);
  });

  test("returns the original option instance from flat options", () => {
    const selectedOption = { value: "selected", label: "Selected" };
    const options = [{ value: "first", label: "First" }, selectedOption];

    expect(findSelectOption(options, "selected")).toBe(selectedOption);
  });
});
