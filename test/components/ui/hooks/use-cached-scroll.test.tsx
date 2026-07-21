/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, renderHook } from "@testing-library/react";
import useCachedScroll from "../../../../src/components/ui/hooks/use-cached-scroll";

afterEach(() => {
  jest.restoreAllMocks();
});

test("stops retrying when the cached position is unreachable", () => {
  const cacheKey = "unreachable-scroll-test";
  const seedElement = document.createElement("div");
  seedElement.scrollTop = 120;
  const seed = renderHook(() => useCachedScroll(cacheKey, null));

  act(() => {
    seed.result.current.onScroll({
      currentTarget: seedElement,
    } as React.UIEvent<HTMLDivElement>);
  });
  seed.unmount();

  let scrollTop = 0;
  const scrollElement = document.createElement("div");
  Object.defineProperties(scrollElement, {
    clientHeight: { value: 100 },
    scrollHeight: { value: 200 },
    scrollTop: {
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = Math.min(value, 100);
      },
    },
  });

  const animationFrames: FrameRequestCallback[] = [];
  let animationFrameId = 0;
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    animationFrames.push(callback);
    animationFrameId += 1;
    return animationFrameId;
  });

  const restored = renderHook(() => useCachedScroll(cacheKey, scrollElement));

  let completedFrames = 0;
  while (animationFrames.length > 0) {
    const callback = animationFrames.shift();
    act(() => callback?.(completedFrames));
    completedFrames += 1;
  }

  expect(scrollTop).toBe(100);
  expect(completedFrames).toBe(60);
  expect(animationFrames).toHaveLength(0);

  restored.unmount();
});
