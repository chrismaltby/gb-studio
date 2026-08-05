/**
 * @jest-environment jsdom
 */

import React from "react";
import type { Store, UnknownAction } from "@reduxjs/toolkit";
import ScriptEventFormInput from "components/script/fields/ScriptEventFormInput";
import type { RootState } from "store/storeTypes";
import { fireEvent, render, screen } from "../../../react-utils";

jest.mock("components/rendering/MetaspriteCanvas", () => ({
  MetaspriteCanvas: () => null,
}));
jest.mock("components/rendering/AvatarCanvas", () => ({
  AvatarCanvas: () => null,
}));
jest.mock("components/rendering/EmoteCanvas", () => ({
  EmoteCanvas: () => null,
}));
jest.mock("components/rendering/AutoColorizedImage", () => ({
  AutoColorizedImage: () => null,
}));
jest.mock("components/rendering/ColorizedImage", () => ({
  ColorizedImage: () => null,
}));
jest.mock("components/rendering/SpriteSliceCanvas", () => ({
  SpriteSliceCanvas: () => null,
}));
jest.mock("components/rendering/TileCanvas", () => ({
  TileCanvas: () => null,
}));
jest.mock("store/features/clipboard/clipboardActions", () => ({
  __esModule: true,
  default: {},
}));
jest.mock("components/forms/ValueSelect", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("components/forms/ConstantValueSelect", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("ui/form/FlagField", () => ({
  FlagField: ({ variableId }: { variableId: string }) => (
    <div data-testid="flag-field" data-variable-id={variableId} />
  ),
}));
jest.mock("components/forms/FlagSelect", () => ({
  FlagSelect: ({ variableId }: { variableId: string }) => (
    <div data-testid="flag-select" data-variable-id={variableId} />
  ),
}));

jest.mock("components/forms/VariableElementSelect", () => ({
  VariableElementSelect: ({
    value,
    allowCustomEventParameters,
    onChange,
  }: {
    value: unknown;
    allowCustomEventParameters?: boolean;
    onChange: (value: unknown) => void;
  }) => (
    <button
      data-testid="variable-element-select"
      data-value={JSON.stringify(value)}
      data-allow-custom-event-parameters={String(allowCustomEventParameters)}
      onClick={() =>
        onChange({
          type: "variable",
          value: "array",
          index: { type: "number", value: 2 },
        })
      }
    />
  ),
}));

const state = {
  project: {
    present: {
      settings: {
        defaultBackgroundPaletteIds: [],
        defaultSpritePaletteIds: [],
      },
    },
  },
  engine: {
    lookup: {},
  },
};

const store = {
  getState: () => state,
  dispatch: () => {},
  subscribe: () => {},
} as unknown as Store<RootState, UnknownAction>;

test("renders invalid variableElement values as an empty selection", () => {
  const onChange = jest.fn();

  render(
    <ScriptEventFormInput
      id="variableSource"
      entityId=""
      type="variableElement"
      field={{
        key: "variableSource",
        type: "variableElement",
        allowCustomEventParameters: false,
      }}
      defaultValue={{ type: "variable", value: "LAST_VARIABLE" }}
      value="legacyVariable"
      args={{}}
      defaultVariableId="defaultVariable"
      onChange={onChange}
      onInsertEventAfter={() => {}}
    />,
    store,
  );

  const select = screen.getByTestId("variable-element-select");
  expect(select).not.toHaveAttribute("data-value");
  expect(select).toHaveAttribute("data-allow-custom-event-parameters", "false");

  fireEvent.click(select);
  expect(onChange).toHaveBeenCalledWith(
    {
      type: "variable",
      value: "array",
      index: { type: "number", value: 2 },
    },
    undefined,
  );
});

test.each([
  { type: "flag", testId: "flag-field" },
  { type: "selectFlags", testId: "flag-select" },
])("uses the base array variable for $type fields", ({ type, testId }) => {
  render(
    <ScriptEventFormInput
      id="flag"
      entityId=""
      type={type}
      field={{ key: "flag", type }}
      defaultValue={false}
      value={false}
      args={{
        variable: {
          type: "variable",
          value: "arrayVariable",
          index: { type: "number", value: 2 },
        },
      }}
      defaultVariableId="defaultVariable"
      onChange={() => {}}
      onInsertEventAfter={() => {}}
    />,
    store,
  );

  expect(screen.getByTestId(testId)).toHaveAttribute(
    "data-variable-id",
    "arrayVariable",
  );
});
