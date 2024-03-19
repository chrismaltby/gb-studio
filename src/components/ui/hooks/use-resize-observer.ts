import { useState, useEffect, useRef, RefObject } from "react";

interface Size {
  width: number | undefined;
  height: number | undefined;
}

const useResizeObserver = <T extends HTMLElement>(): [RefObject<T>, Size] => {
  const [size, setSize] = useState<Size>({
    width: undefined,
    height: undefined,
  });
  const ref = useRef<T>(null);

  useEffect(() => {
    if (ref.current && typeof ResizeObserver === "function") {
      const observer = new ResizeObserver((entries) => {
        window.requestAnimationFrame(() => {
          if (entries.length === 0) return;
          const { width, height } = entries[0].contentRect;
          setSize({ width, height });
        });
      });

      observer.observe(ref.current);

      return () => observer.disconnect();
    }
  }, []);

  return [ref, size];
};

export default useResizeObserver;
