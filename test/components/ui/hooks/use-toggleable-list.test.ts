/**
 * @jest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react";
import useToggleableList from "../../../../src/components/ui/hooks/use-toggleable-list";

test("restores cached values when remounted", () => {
  const firstRender = renderHook(() =>
    useToggleableList<string>([], "toggleable-list-remount-test"),
  );

  act(() => firstRender.result.current.set("folder"));
  firstRender.unmount();

  const secondRender = renderHook(() =>
    useToggleableList<string>([], "toggleable-list-remount-test"),
  );

  expect(secondRender.result.current.values).toEqual(["folder"]);
});
