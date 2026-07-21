/**
 * @jest-environment jsdom
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react";
import CachedScroll from "../../../../src/components/ui/util/CachedScroll";

beforeAll(() => {
  Object.defineProperties(HTMLElement.prototype, {
    clientHeight: { configurable: true, get: () => 100 },
    scrollHeight: { configurable: true, get: () => 500 },
  });
});

test("restores its cached scroll position when remounted", () => {
  const firstRender = render(
    <CachedScroll cacheKey="cached-scroll-remount-test">
      <div />
    </CachedScroll>,
  );
  const firstScroller = firstRender.container.firstElementChild as HTMLElement;

  firstScroller.scrollTop = 120;
  fireEvent.scroll(firstScroller);
  firstRender.unmount();

  const secondRender = render(
    <CachedScroll cacheKey="cached-scroll-remount-test">
      <div />
    </CachedScroll>,
  );

  expect(secondRender.container.firstElementChild?.scrollTop).toBe(120);
});
