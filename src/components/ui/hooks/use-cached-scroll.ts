import React, { useCallback, useEffect, useRef } from "react";

const scrollCache: Record<string, number> = {};
const MAX_SCROLL_RESTORE_FRAMES = 600;

export const getCachedScrollPosition = (cacheKey: string | undefined) =>
  cacheKey ? scrollCache[cacheKey] : undefined;

const useCachedScroll = (
  cacheKey: string | undefined,
  scrollElement: HTMLDivElement | null,
  restoreScroll = true,
) => {
  const programmaticScrollPosition = useRef<number | null>(null);
  const isUserScrolling = useRef(false);

  const onScroll = useCallback<React.UIEventHandler<HTMLDivElement>>(
    (e) => {
      if (!cacheKey) {
        return;
      }

      if (e.currentTarget.scrollTop === programmaticScrollPosition.current) {
        programmaticScrollPosition.current = null;
        return;
      }

      programmaticScrollPosition.current = null;
      scrollCache[cacheKey] = e.currentTarget.scrollTop;
      isUserScrolling.current = true;
    },
    [cacheKey],
  );

  useEffect(() => {
    if (!cacheKey || !scrollElement || !restoreScroll) {
      return;
    }

    let animationFrameId: number | undefined;
    let restoreFrames = 0;

    const checkScroll = () => {
      const savedPosition = scrollCache[cacheKey] ?? 0;

      if (isUserScrolling.current) {
        return;
      }

      const maxScrollTop = Math.max(
        0,
        scrollElement.scrollHeight - scrollElement.clientHeight,
      );
      const targetScrollTop = Math.min(savedPosition, maxScrollTop);

      if (scrollElement.scrollTop !== targetScrollTop) {
        scrollElement.scrollTop = targetScrollTop;
        programmaticScrollPosition.current = scrollElement.scrollTop;
      }

      if (
        scrollElement.scrollTop < savedPosition &&
        restoreFrames < MAX_SCROLL_RESTORE_FRAMES
      ) {
        restoreFrames += 1;
        animationFrameId = requestAnimationFrame(checkScroll);
      }
    };

    const savedPosition = scrollCache[cacheKey] ?? 0;
    isUserScrolling.current = false;

    if (savedPosition > 0) {
      checkScroll();
    }

    return () => {
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [cacheKey, restoreScroll, scrollElement]);

  return { onScroll } as const;
};

export default useCachedScroll;
