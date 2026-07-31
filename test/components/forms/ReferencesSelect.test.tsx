/**
 * @jest-environment jsdom
 */

import React from "react";
import type { UnknownAction, Store } from "@reduxjs/toolkit";
import { ReferencesSelect } from "components/forms/ReferencesSelect";
import type { RootState } from "store/storeTypes";
import { render, screen } from "../../react-utils";

jest.mock("components/forms/AddReferenceMenu", () => () => null);
jest.mock("store/features/clipboard/clipboardActions", () => ({
  __esModule: true,
  default: { copyText: jest.fn() },
}));
test("filters missing variable references out of the list", () => {
  const missingId = "abcdef01-2345-6789-abcd-ef0123456789";
  const state = {
    project: {
      present: {
        entities: {
          variables: { entities: {}, ids: [] },
        },
      },
    },
  };
  const store = {
    getState: () => state,
    dispatch: () => {},
    subscribe: () => {},
  } as unknown as Store<RootState, UnknownAction>;

  render(
    <ReferencesSelect
      value={[{ type: "variable", id: missingId }]}
      onChange={() => {}}
    />,
    store,
  );

  expect(screen.queryByText("FIELD_VARIABLES")).not.toBeInTheDocument();
  expect(screen.queryByText(new RegExp(missingId))).not.toBeInTheDocument();
});
