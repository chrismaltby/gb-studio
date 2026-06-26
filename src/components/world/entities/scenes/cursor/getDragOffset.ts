export const getDragOffset = (
  element: HTMLElement,
  clientX: number,
  clientY: number,
) => {
  const rect = element.getBoundingClientRect();
  const scaleX = element.offsetWidth ? rect.width / element.offsetWidth : 1;
  const scaleY = element.offsetHeight ? rect.height / element.offsetHeight : 1;

  return {
    x: Math.max(0, Math.floor((clientX - rect.left) / scaleX)),
    y: Math.max(0, Math.floor((clientY - rect.top) / scaleY)),
  };
};

export const applyDragOffset = (
  pointerX: number,
  pointerY: number,
  offsetX: number,
  offsetY: number,
  unitSize: number,
) => ({
  x: pointerX - Math.floor(offsetX / unitSize),
  y: pointerY - Math.floor(offsetY / unitSize),
});
