import { useState } from "react";

const useDelayedState = <T>(initialState: T) => {
  const [value, setValue] = useState(initialState);
  let timer: number | undefined;
  return [
    value,
    (newValue: T, waitTime?: number) => {
      clearTimeout(timer);
      if (waitTime) {
        timer = setTimeout(() => {
          setValue(newValue);
        }, waitTime);
      } else {
        setValue(newValue);
      }
    },
  ] as const;
};

export default useDelayedState;
