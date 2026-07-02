/**
 * @jest-environment jsdom
 */

import React from "react";
import { render } from "../../react-utils";
import SceneAutotileSelection from "components/world/inspector/scenes/tilemap/SceneAutotileSelection";

test("highlights all autotile variants at their tileset positions", () => {
  const { container } = render(
    <SceneAutotileSelection tileIndex={3} tilesetWidth={10} />,
  );
  const variants = container.querySelectorAll("[data-autotile-mask]");

  expect(variants).toHaveLength(16);
  expect(variants[0]).toHaveStyle({ left: "24px", top: "0px" });
  expect(variants[15]).toHaveStyle({ left: "48px", top: "24px" });
});

test("shows connectors for each active neighbour in the autotile mask", () => {
  const { container } = render(
    <SceneAutotileSelection tileIndex={0} tilesetWidth={8} />,
  );
  const isolated = container.querySelector('[data-autotile-mask="0"]');
  const connected = container.querySelector('[data-autotile-mask="15"]');

  expect(isolated?.children).toHaveLength(0);
  expect(connected?.children).toHaveLength(4);
});
