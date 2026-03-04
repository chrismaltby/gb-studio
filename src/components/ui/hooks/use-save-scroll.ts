import { useEffect, useRef } from "react";
import { throttle } from "lodash";

export function useSaveScroll<T extends HTMLElement>(
  ref: React.RefObject<T>,
  onSave: (scrollTop: number) => void,
  throttleMs = 200,
) {
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const throttled = throttle(
      (scrollTop: number) => {
        onSaveRef.current(scrollTop);
      },
      throttleMs,
      { leading: true, trailing: true },
    );

    const handleScroll = () => {
      throttled(el.scrollTop);
    };

    el.addEventListener("scroll", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      throttled.cancel();
    };
  }, [ref, throttleMs]);
}
