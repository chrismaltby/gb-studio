import React, { useState } from "react";
import useCachedScroll from "ui/hooks/use-cached-scroll";

interface CachedScrollProps {
  children: React.ReactNode;
  cacheKey: string;
}

const CachedScroll = ({ children, cacheKey }: CachedScrollProps) => {
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const { onScroll } = useCachedScroll(cacheKey, scrollEl);

  return (
    <div
      ref={setScrollEl}
      onScroll={onScroll}
      style={{ width: "100%", height: "100%", overflowY: "auto" }}
    >
      {children}
    </div>
  );
};

export default CachedScroll;
