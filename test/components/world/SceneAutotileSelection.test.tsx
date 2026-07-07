/**
 * @jest-environment jsdom
 */

import React from "react";
import { render } from "../../react-utils";
import SceneAutotileSelection from "components/world/inspector/scenes/tilemap/SceneAutotileSelection";

test("highlights all autotile variants at their tileset positions", () => {
  const { container } = render(
    <SceneAutotileSelection tileIndex={3} tilesetWidth={10} type="2x2" />,
  );
  const variants = container.querySelectorAll("[data-autotile-mask]");

  expect(variants).toHaveLength(16);
  expect(variants[0].parentElement).toHaveStyle({ left: "24px", top: "0px" });
  expect(variants[0]).toHaveStyle({ left: "0px", top: "0px" });
  expect(variants[15]).toHaveStyle({ left: "24px", top: "24px" });
});

test("shows connectors for each active neighbour in the autotile mask", () => {
  const { container } = render(
    <SceneAutotileSelection tileIndex={0} tilesetWidth={8} type="2x2" />,
  );
  const isolated = container.querySelector('[data-autotile-mask="0"]');
  const connected = container.querySelector('[data-autotile-mask="15"]');

  expect(isolated?.children).toHaveLength(0);
  expect(connected?.children).toHaveLength(4);
});

test("highlights all nine 9-slice variants", () => {
  const { container } = render(
    <SceneAutotileSelection tileIndex={3} tilesetWidth={10} type="9slice" />,
  );

  const variants = container.querySelectorAll("[data-autotile-9slice-variant]");
  expect(variants).toHaveLength(9);
  expect(variants[0].parentElement).toHaveStyle({ left: "24px", top: "0px" });
  expect(variants[0]).toHaveStyle({ left: "0px", top: "0px" });
  expect(variants[8]).toHaveStyle({ left: "16px", top: "16px" });
});
