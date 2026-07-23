/**
 * @jest-environment jsdom
 */

import React from "react";
import { PaletteSelectButton } from "components/forms/PaletteSelectButton";
import { Palette } from "shared/lib/resources/types";
import { dummyPalette } from "../../dummydata";
import { fireEvent, render, screen } from "../../react-utils";

const palette: Palette = {
  ...dummyPalette,
  id: "palette1",
  name: "Test Palette",
};

jest.mock("store/hooks", () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => palette,
}));

jest.mock("components/forms/PaletteBlock", () => () => null);

jest.mock("ui/layout/RelativePortal", () => ({
  RelativePortal: ({ children }: React.PropsWithChildren) => children,
}));

jest.mock("components/forms/PaletteSelect", () => ({
  PaletteSelect: ({
    onChange,
    onCreate,
  }: {
    onChange?: (value: string) => void;
    onCreate?: (value: string) => void;
  }) => (
    <>
      <button onClick={() => onCreate?.("newPalette")}>Create palette</button>
      <button onClick={() => onChange?.("palette1")}>Select palette</button>
    </>
  ),
}));

test("keeps the picker mounted after creating a palette", () => {
  const onChange = jest.fn();
  render(
    <PaletteSelectButton
      name="palette"
      value="palette1"
      onChange={onChange}
    />,
  );

  fireEvent.click(screen.getByTitle("Test Palette"));
  fireEvent.click(screen.getByRole("button", { name: "Create palette" }));

  expect(onChange).toHaveBeenCalledWith("newPalette");
  expect(
    screen.getByRole("button", { name: "Create palette" }),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Select palette" }));
  expect(
    screen.queryByRole("button", { name: "Create palette" }),
  ).not.toBeInTheDocument();
});
