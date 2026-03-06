import { useEffect, useRef } from "react";
import { debounce } from "lodash";

export function useSaveScroll<T extends HTMLElement>(
  ref: React.RefObject<T>,
  onSave: (scrollTop: number) => void,
  delayMs = 200,
) {
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const debounced = debounce(
      (scrollTop: number) => {
        onSaveRef.current(scrollTop);
      },
      delayMs,
      { trailing: true },
    );

    const handleScroll = () => {
      debounced(el.scrollTop);
    };

    el.addEventListener("scroll", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      debounced.flush();
    };
  }, [ref, delayMs]);
}
