import { RefObject, useCallback, useEffect, useState } from "react";

export const useIMEIsComposing = (inputRef: RefObject<HTMLInputElement>) => {
  const [isComposing, setComposition] = useState(false);

  const onCompositionStart = useCallback(() => setComposition(true), []);
  const onCompositionEnd = useCallback(() => setComposition(false), []);

  useEffect(() => {
    const inputElement = inputRef.current;

    if (inputElement) {
      inputElement.addEventListener("compositionstart", onCompositionStart);
      inputElement.addEventListener("compositionend", onCompositionEnd);
    }

    return () => {
      if (inputElement) {
        inputElement.removeEventListener(
          "compositionstart",
          onCompositionStart
        );
        inputElement.removeEventListener("compositionend", onCompositionEnd);
      }
    };
  }, [inputRef, onCompositionStart, onCompositionEnd]);

  return isComposing;
};
