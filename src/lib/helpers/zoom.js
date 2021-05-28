export const zoomLevels = [25, 50, 100, 200, 400, 800];

export const zoomIn = (currentZoom) => {
  for (let i = 0; i < zoomLevels.length; i++) {
    if (zoomLevels[i] > currentZoom) {
      return zoomLevels[i];
    }
  }
  return zoomLevels[zoomLevels.length - 1];
};

export const zoomOut = (currentZoom) => {
  for (let i = zoomLevels.length - 1; i >= 0; i--) {
    if (zoomLevels[i] < currentZoom) {
      return zoomLevels[i];
    }
  }
  return zoomLevels[0];
};
