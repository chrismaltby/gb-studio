import { useEffect, useState } from "react";
import type { RefObject } from "react";

const useHover = <T extends HTMLElement = HTMLElement>(
  elementRef: RefObject<T>
): boolean => {
  const [value, setValue] = useState<boolean>(false);

  const handleMouseEnter = () => {
    setValue(true);
  };
  const handleMouseLeave = () => {
    setValue(false);
  };

  useEffect(() => {
    const el = elementRef.current;
    el?.addEventListener("mouseenter", handleMouseEnter);
    el?.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el?.removeEventListener("mouseenter", handleMouseEnter);
      el?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [elementRef]);

  return value;
};

export default useHover;
