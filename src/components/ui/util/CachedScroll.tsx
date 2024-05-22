import React, { useCallback, useEffect, useRef } from "react";

const scrollCache: Record<string, number> = {};

interface CachedScrollProps {
  children: React.ReactNode;
  cacheKey: string;
}

const CachedScroll = ({ children, cacheKey }: CachedScrollProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const isUserScrolling = useRef(false);

  const onScroll = useCallback(() => {
    if (isProgrammaticScroll.current) {
      isProgrammaticScroll.current = false;
      return;
    }
    if (scrollRef.current) {
      // Was user scroll so update cached scroll pos and cancel auto scrolling
      scrollCache[cacheKey] = scrollRef.current.scrollTop;
      isUserScrolling.current = true;
    }
  }, [cacheKey]);

  useEffect(() => {
    const checkScroll = () => {
      const savedScrollPosition = scrollCache[cacheKey];
      const savedPosition = savedScrollPosition ?? 0;

      if (scrollRef.current) {
        // If not reached saved pos yet
        if (
          !isUserScrolling.current &&
          scrollRef.current.scrollTop < savedPosition
        ) {
          // Only scroll if there is more scroll height available
          // to prevent clash with user initiated scroll events
          if (
            scrollRef.current.scrollTop <
            scrollRef.current.scrollHeight - scrollRef.current.clientHeight
          ) {
            isProgrammaticScroll.current = true;
            scrollRef.current.scrollTop = savedPosition;
            console.log(
              "SCROLL TO",
              savedPosition,
              scrollRef.current.scrollTop
            );
          }

          requestAnimationFrame(checkScroll);
        }
      }
    };

    const savedScrollPosition = scrollCache[cacheKey];
    const savedPosition = savedScrollPosition ?? 0;

    if (savedPosition > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = savedPosition;
      requestAnimationFrame(checkScroll);
    }
  }, [cacheKey]);

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      style={{ width: "100%", height: "100%", overflowY: "auto" }}
    >
      {children}
    </div>
  );
};

export default CachedScroll;
