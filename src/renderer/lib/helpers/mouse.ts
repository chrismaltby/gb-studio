export const mousePosition = {
  x: 0,
  y: 0,
};

let initialized = false;

export const initMouseTracking = () => {
  if (initialized) return;
  initialized = true;

  window.addEventListener(
    "mousemove",
    (e) => {
      mousePosition.x = e.clientX;
      mousePosition.y = e.clientY;
    },
    { passive: true },
  );
};

export const isElementHovered = (el: HTMLElement | undefined | null) => {
  if (!el) return false;
  const underMouse = throttledGetElementUnderMouse();
  return !!underMouse && el.contains(underMouse);
};

let lastCheckTime = 0;
let cachedElement: Element | null = null;
const THROTTLE_MS = 100;

export const throttledGetElementUnderMouse = (): Element | null => {
  const now = performance.now();

  if (now - lastCheckTime > THROTTLE_MS) {
    lastCheckTime = now;
    cachedElement = document.elementFromPoint(mousePosition.x, mousePosition.y);
  }

  return cachedElement;
};
