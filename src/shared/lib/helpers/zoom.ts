const zoomLevels = [25, 50, 100, 200, 400, 800, 1600];

export const zoomIn = (currentZoom: number) => {
  for (let i = 0; i < zoomLevels.length; i++) {
    if (zoomLevels[i] > currentZoom) {
      return zoomLevels[i];
    }
  }
  return zoomLevels[zoomLevels.length - 1];
};

export const zoomOut = (currentZoom: number) => {
  for (let i = zoomLevels.length - 1; i >= 0; i--) {
    if (zoomLevels[i] < currentZoom) {
      return zoomLevels[i];
    }
  }
  return zoomLevels[0];
};
