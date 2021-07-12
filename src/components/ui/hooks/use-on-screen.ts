import { useState, useEffect, useMemo } from "react";

const useOnScreen = (ref: React.MutableRefObject<Element | null>) => {
  const [isIntersecting, setIntersecting] = useState(false);
  const observer = useMemo(() => {
    return new IntersectionObserver(([entry]) =>
      setIntersecting(entry.isIntersecting)
    );
  }, []);

  useEffect(() => {
    if (ref.current) {
      observer.observe(ref.current);
    }
    // Remove the observer as soon as the component is unmounted
    return () => {
      observer.disconnect();
    };
  }, [observer, ref]);

  return isIntersecting;
};

export default useOnScreen;
