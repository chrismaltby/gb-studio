import { useLayoutEffect, useRef } from "react";

const MAX_WAIT = 500;

interface UseRestoreScrollOptions {
  behavior?: ScrollBehavior;
}

export function useRestoreScroll<T extends HTMLElement>(
  ref: React.RefObject<T>,
  target: number | null | undefined,
  options?: UseRestoreScrollOptions,
) {
  const { behavior = "auto" } = options ?? {};

  const hasRestoredRef = useRef(false);
  const targetRef = useRef<number | null>(target ?? 0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || hasRestoredRef.current) return;

    const scrollTarget = targetRef.current ?? 0;

    let mounted = true;
    let raf: number;
    const start = performance.now();

    const check = () => {
      if (!mounted) return;

      const maxScrollable = el.scrollHeight - el.clientHeight;

      if (maxScrollable >= scrollTarget) {
        hasRestoredRef.current = true;

        const previousBehavior = el.style.scrollBehavior;
        el.style.scrollBehavior = behavior;
        el.scrollTop = scrollTarget;
        el.style.scrollBehavior = previousBehavior;

        return;
      }

      if (performance.now() - start > MAX_WAIT) {
        return;
      }

      raf = requestAnimationFrame(check);
    };

    raf = requestAnimationFrame(check);

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, [behavior, ref]);
}
