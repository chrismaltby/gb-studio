import { useRef, useEffect } from "react";

// Use to determine why a component rerendered
// By supplying an object of prop/state values to track
// e.g. useTraceUpdate({id, name, children})

export const useTraceUpdate = (
  props: Record<string, unknown>,
  prefix?: string,
) => {
  const prev = useRef(props);

  useEffect(() => {
    const changedProps = Object.entries(props).reduce(
      (acc, [key, value]) => {
        if (prev.current[key] !== value) {
          acc[key] = [prev.current[key], value];
        }
        return acc;
      },
      {} as Record<string, unknown>,
    );

    if (Object.keys(changedProps).length > 0) {
      console.log((prefix ?? "") + "Changed props:", changedProps);
    }

    prev.current = props;
  });
};
