/**
 * @jest-environment jsdom
 */

import React from "react";
import { MathTextarea } from "ui/form/MathTextarea";
import { DialogueTextarea } from "ui/form/DialogueTextarea";
import { render, screen } from "../../../react-utils";

const variables = [
  {
    id: "1",
    code: "01",
    name: "Health",
    displayName: "Health",
    group: "Global",
  },
];

test("math mentions normalize numeric IDs and render missing variables as zero", () => {
  render(
    <MathTextarea
      value="$0001$ + $abcdef01-2345-6789-abcd-ef0123456789$"
      entityId="scene1"
      variables={variables}
      constants={[]}
      onChange={() => {}}
    />,
  );

  expect(screen.getByText("$Health")).toBeInTheDocument();
  expect(screen.getByText("0")).toBeInTheDocument();
});

test("dialogue mentions normalize numeric IDs and render missing variables as zero", () => {
  render(
    <DialogueTextarea
      value="$0001$ #abcdef01-2345-6789-abcd-ef0123456789#"
      entityId="scene1"
      variables={variables}
      fonts={[]}
      onChange={() => {}}
    />,
  );

  expect(screen.getByText("$Health")).toBeInTheDocument();
  expect(screen.getByText("0")).toBeInTheDocument();
});
