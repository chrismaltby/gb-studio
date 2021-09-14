import { useRef, useEffect } from "react";

export const useIsMounted = () => {
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  return () => isMountedRef.current;
};
