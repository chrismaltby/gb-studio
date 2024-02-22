export const MIN_SIDEBAR_WIDTH = 280;
export const MIN_SIDEBAR_GAP = 70;

export const clampSidebarWidth = (width: number) => {
  return Math.min(
    window.innerWidth - MIN_SIDEBAR_GAP,
    Math.max(MIN_SIDEBAR_WIDTH, width)
  );
};
