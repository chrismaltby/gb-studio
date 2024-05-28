import React, { useRef, useEffect } from "react";

interface ScrollToProps {
  scrollMarginTop?: number;
}

export const ScrollTo = ({ scrollMarginTop }: ScrollToProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView();
    }
  }, []);
  return <div ref={ref} style={{ scrollMarginTop }} />;
};
