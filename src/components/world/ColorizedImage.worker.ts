const DMGPalette = [
  [233, 242, 228],
  [181, 214, 156],
  [91, 144, 116],
  [36, 50, 66],
];

const indexColour = (g: number) => {
  if (g < 65) {
    return 3;
  }
  if (g < 130) {
    return 2;
  }
  if (g < 205) {
    return 1;
  }
  return 0;
};

onmessage = async (evt) => {
  const canvas:OffscreenCanvas = evt.data.canvas;
  const src:string = evt.data.src;
  const tiles = evt.data.tiles;
  const palettes = evt.data.palettes;

  const ctx = canvas.getContext("2d");

  if(!ctx) {
    return;
  }

  const width = canvas.width;
  const tileWidth = Math.floor(canvas.width / 8);
  const tileHeight = Math.floor(canvas.width / 8);
  const tilesLength = tileWidth * tileHeight;

  const imgblob = await fetch(src).then((r) => r.blob());
  const img = await createImageBitmap(imgblob);

  ctx.fillRect(10,10,50,20);

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let t = 0; t < tilesLength; t++) {
    const tX = t % tileWidth;
    const tY = Math.floor(t / tileWidth);
    const palette = palettes[tiles[t]] || DMGPalette;
    const p1X = tX * 8;
    const p2X = p1X + 8;
    const p1Y = tY * 8;
    const p2Y = p1Y + 8;
    for (let pX = p1X; pX < p2X; pX++) {
      for (let pY = p1Y; pY < p2Y; pY++) {
        const index = (pX + pY * width) * 4;
        const colorIndex = indexColour(data[index + 1]);
        const color = palette[colorIndex];
        data[index] = color[0];
        data[index + 1] = color[1];
        data[index + 2] = color[2];
        data[index + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  ctx.fillStyle="red";
  ctx.fillRect(50,70,30,10);

};
