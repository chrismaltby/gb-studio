import { readFile } from "fs-extra";
import { PNG } from "pngjs";
import uniqBy from "lodash/uniqBy";
import RgbQuant from "rgbquant";

const SNES_SCREEN_WIDTH = 256;
const SNES_SCREEN_HEIGHT = 224;
const SNES_TILE_WIDTH = 32;
const SNES_TILE_HEIGHT = 28;
const TILE_SIZE = 8;
const N_SGB_PALETTES = 4;
const SGB_PALETTE_SIZE = 16;
const USE_SGB_PAL = 0x10;
const FLIP_X = 0x40;
const FLIP_Y = 0x80;
const BLANK_TILE = Array.from(Array(TILE_SIZE * TILE_SIZE)).fill(0);
const TRANSPARENT_TILE = Array.from(Array(TILE_SIZE * TILE_SIZE)).fill(-1);

const toIndex = (x, y) => (x + y * SNES_SCREEN_WIDTH) * 4;
const toTileIndex = (x, y) => x + y * TILE_SIZE;

const decHex = (value) => {
  return `0x${parseInt(value, 10).toString(16).padStart(2, 0).toUpperCase()}`;
};

function chunk(arr, len) {
  const chunks = [];
  let i = 0;
  const n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }

  return chunks;
}

const rgbTo15BitColor = (r, g, b) => {
  const c = (r << 16) + (g << 8) + b;
  const r2 = (c & 0xf80000) >> 19;
  const g2 = (c & 0x00f800) >> 6;
  const b2 = (c & 0x0000f8) << 7;
  return b2 | g2 | r2;
};

const color15BitToRGB = (color) => {
  const r = (color % 32) * 8;
  const g = ((color / 32) % 32) * 8;
  const b = ((color / 1024) % 32) * 8;
  return [r, g, b];
};

function rgb2lab(rgb) {
  let r = rgb[0] / 255;
  let g = rgb[1] / 255;
  let b = rgb[2] / 255;
  let x;
  let y;
  let z;
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function deltaE(rgbA, rgbB) {
  const labA = rgb2lab(rgbA);
  const labB = rgb2lab(rgbB);
  const deltaL = labA[0] - labB[0];
  const deltaA = labA[1] - labB[1];
  const deltaB = labA[2] - labB[2];
  const c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
  const c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
  const deltaC = c1 - c2;
  let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
  const sc = 1.0 + 0.045 * c1;
  const sh = 1.0 + 0.015 * c1;
  const deltaLKlsl = deltaL / 1.0;
  const deltaCkcsc = deltaC / sc;
  const deltaHkhsh = deltaH / sh;
  const i =
    deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
  return i < 0 ? 0 : Math.sqrt(i);
}

const distance15Bit = (colorA, colorB) => {
  return deltaE(
    rgb2lab(color15BitToRGB(colorA)),
    rgb2lab(color15BitToRGB(colorB))
  );
};

const bin2 = (value) => {
  return value.toString(2).padStart(4, 0);
};

const flipTileX = (inData) => {
  const data = [];
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const i = toTileIndex(TILE_SIZE - x - 1, y);
      data.push(inData[i]);
    }
  }
  return data;
};

const flipTileY = (inData) => {
  const data = [];
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const i = toTileIndex(x, TILE_SIZE - y - 1);
      data.push(inData[i]);
    }
  }
  return data;
};

const isTileEqual = (dataA, dataB) => {
  for (let i = 0; i < dataA.length; i++) {
    if (dataA[i] !== dataB[i]) {
      return false;
    }
  }
  return true;
};

const closestPalette = (colors, palettes) => {
  const matches = palettes.map((palette) => {
    let numMatches = 0;
    for (let i = 0; i < colors.length; i++) {
      if (palette.indexOf(colors[i]) > -1) {
        numMatches++;
      }
    }
    return numMatches;
  });
  const maxMatch = Math.max.apply(null, matches);
  const closestIndex = matches.findIndex((match) => match === maxMatch);
  return closestIndex;
};

const toPaletteColorIndex = (color, palette) => {
  if (color === -1) {
    return 0;
  }
  const index = palette.indexOf(color);
  if (index > -1) {
    return index;
  }
  const distances = palette.map((pColor, pIndex) =>
    pIndex > 1 ? distance15Bit(color, pColor) : Infinity
  );
  const minDistance = Math.min.apply(null, distances);
  const closestIndex = distances.findIndex(
    (distance) => distance === minDistance
  );

  return closestIndex;
};

const toTileData = (tile, palettes) => {
  const paletteIndex = closestPalette(tile, palettes);
  const palette = palettes[paletteIndex];
  const data = tile.map((color) => toPaletteColorIndex(color, palette));
  return {
    data,
    paletteIndex,
  };
};

const pixelsToSGBData = (pixels, width, height) => {
  if (width !== SNES_SCREEN_WIDTH) {
    throw new Error(`SGB Image width must be ${SNES_SCREEN_WIDTH}px`);
  }
  if (height !== SNES_SCREEN_HEIGHT) {
    throw new Error(`SGB Image height must be ${SNES_SCREEN_HEIGHT}px`);
  }
  const tilePalettes = [];
  const tiles = [];

  const parseTile = (tx, ty) => {
    const colors = [];
    const tile = [];
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const i = toIndex(x + tx * TILE_SIZE, y + ty * TILE_SIZE);
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const c = rgbTo15BitColor(r, g, b);
        let cIndex = colors.indexOf(c);
        if (cIndex === -1) {
          cIndex = colors.length;
          colors.push(c);
        }
        tile.push(c);
      }
    }
    return [tile, colors];
  };

  const createEmptyTile = () => {
    const colors = [-1];
    return [TRANSPARENT_TILE, colors];
  };

  // Split image into tiles and palettes
  for (let ty = 0; ty < SNES_TILE_HEIGHT; ty++) {
    for (let tx = 0; tx < SNES_TILE_WIDTH; tx++) {
      if (tx > 5 && tx < 26 && ty > 4 && ty < 23) {
        const [tile, colors] = createEmptyTile();
        tiles.push(tile);
        tilePalettes.push(colors);
      } else {
        const [tile, colors] = parseTile(tx, ty);
        tiles.push(tile);
        tilePalettes.push(colors);
      }
    }
  }

  const toPalettes = (tilePalettes) => {
    const palettes = [[-1], [-1], [-1], [-1]];
    let writePalette = 0;

    for (const tilePalette of tilePalettes) {
      let maxMatches = 0;
      for (let p = 0; p < N_SGB_PALETTES; p++) {
        let numMatches = 0;
        for (let c = 0; c < tilePalette.length; c++) {
          const color = tilePalette[c];
          if (palettes[p].indexOf(color) > -1) {
            numMatches++;
          }
        }
        if (numMatches > maxMatches) {
          maxMatches = numMatches;
          writePalette = p;
        }
      }

      // If can write to write palette
      const writesNeeded = tilePalette.length - maxMatches;

      if (palettes[writePalette].length + writesNeeded <= SGB_PALETTE_SIZE) {
        for (let c = 0; c < tilePalette.length; c++) {
          const color = tilePalette[c];
          if (palettes[writePalette].indexOf(color) === -1) {
            palettes[writePalette].push(color);
          }
        }
      } else {
        writePalette = 0;
        let minSize = Infinity;
        // Find smallest empty palette
        for (let p = 0; p < N_SGB_PALETTES; p++) {
          if (palettes[p].length < minSize) {
            writePalette = p;
            minSize = palettes[p].length;
          }
        }
        for (let c = 0; c < tilePalette.length; c++) {
          const color = tilePalette[c];
          if (palettes[writePalette].indexOf(color) === -1) {
            palettes[writePalette].push(color);
          }
        }
      }
    }

    return palettes.map((palette) => palette.slice(0, SGB_PALETTE_SIZE));
  };

  // Combine palettes
  const uniquePalettes = uniqBy(tilePalettes, (palette) => palette.join(","));
  const palettes = toPalettes(uniquePalettes);

  const uniqueTiles = [BLANK_TILE];
  const tileIndexes = [];
  const tileAttrs = [];

  // Build unique tiles + map & attrs
  for (let t = 0; t < tiles.length; t++) {
    const tile = tiles[t];
    const { data, paletteIndex } = toTileData(tile, palettes);

    const tileAttr = USE_SGB_PAL + ((paletteIndex & 0x3) << 2);

    let match = false;
    for (let i = 0; i < uniqueTiles.length; i++) {
      const existingTile = uniqueTiles[i];
      const dataFX = flipTileX(data);
      const dataFY = flipTileY(data);
      const dataFXY = flipTileY(dataFX);

      if (isTileEqual(existingTile, data)) {
        tileIndexes.push(i);
        tileAttrs.push(tileAttr);
        match = true;
        break;
      } else if (isTileEqual(existingTile, dataFX)) {
        tileIndexes.push(i);
        tileAttrs.push(tileAttr + FLIP_X);
        match = true;
        break;
      } else if (isTileEqual(existingTile, dataFY)) {
        tileIndexes.push(i);
        tileAttrs.push(tileAttr + FLIP_Y);
        match = true;
        break;
      } else if (isTileEqual(existingTile, dataFXY)) {
        tileIndexes.push(i);
        tileAttrs.push(tileAttr + FLIP_X + FLIP_Y);
        match = true;
        break;
      }
    }

    if (!match) {
      if (uniqueTiles.length < 255) {
        tileIndexes.push(uniqueTiles.length);
        uniqueTiles.push(data);
        tileAttrs.push(tileAttr);
      } else {
        // No space left, find closest match
        let closestMatch = 0;
        let closestTile = 1;
        for (let i = 0; i < uniqueTiles.length; i++) {
          let numMatches = 0;
          for (let p = 0; p < uniqueTiles[i].length; p++) {
            if (uniqueTiles[i][p] === data[p]) {
              numMatches++;
            }
          }
          if (numMatches > closestMatch) {
            closestTile = i;
            closestMatch = numMatches;
          }
        }
        tileIndexes.push(closestTile);
        tileAttrs.push(tileAttr);
      }
    }
  }

  const map = [];
  for (let i = 0; i < tileIndexes.length; i++) {
    map.push(tileIndexes[i]);
    map.push(tileAttrs[i]);
  }

  const palettesData = [];
  for (let i = 0; i < N_SGB_PALETTES; i++) {
    if (palettes[i].length > 0) {
      for (let c = 0; c < SGB_PALETTE_SIZE; c++) {
        const color = Math.max(0, palettes[i][c] || 0);
        palettesData.push(color & 0xff);
        palettesData.push(color >> 8);
      }
    }
  }

  return {
    tiles: uniqueTiles,
    map,
    palettes: palettesData,
  };
};

const tileTo4BPP = (tileData) => {
  const tile = [];
  for (let y = 0; y < 8; y++) {
    let row1 = "";
    let row2 = "";
    for (let x = 0; x < 8; x++) {
      const i = y * 8 + x;
      const col = tileData[i];
      const binary = bin2(col);
      row1 += binary[3];
      row2 += binary[2];
    }
    tile.push(parseInt(row1, 2));
    tile.push(parseInt(row2, 2));
  }
  for (let y = 0; y < 8; y++) {
    let row1 = "";
    let row2 = "";
    for (let x = 0; x < 8; x++) {
      const i = y * 8 + x;
      const col = tileData[i];
      const binary = bin2(col);
      row1 += binary[1];
      row2 += binary[0];
    }
    tile.push(parseInt(row1, 2));
    tile.push(parseInt(row2, 2));
  }
  return tile;
};

const toSGBCData = (tiles, map, palettes) => {
  return `#pragma bank 255

#include "gbs_types.h"

BANKREF(SGB_border_chr)
BANKREF(SGB_border_map)
BANKREF(SGB_border_pal)

const unsigned char SGB_border_chr[]={
${tiles
  .map(tileTo4BPP)
  .map((tile) => `    ${tile.map(decHex)}`)
  .join(",\n")}
};

const unsigned char SGB_border_map[]={
${chunk(map.map(decHex), 16)
  .map((row) => `    ${row.join(",")}`)
  .join(",\n")}
};

const unsigned char SGB_border_pal[]={
    ${palettes.map(decHex)}
};

SIZEREF(SGB_border_chr)
SIZEREF(SGB_border_map)
SIZEREF(SGB_border_pal)
`;
};

const compileSGBImage = async (filename) => {
  const fileData = await readFile(filename);
  return new Promise((resolve, reject) => {
    new PNG().parse(fileData, (err, data) => {
      if (err) {
        return reject(err);
      }
      const width = data.width;
      const height = data.height;
      const pixels = data.data;

      // Quanitize image down to 60 colors maximum
      const q = new RgbQuant({
        colors: 60,
        dithDelta: 0.03,
        dithKern: "FloydSteinberg",
        dithSerp: true,
      });
      q.sample(pixels);
      const out = q.reduce(pixels);

      const sgb = pixelsToSGBData(out, width, height);
      return resolve(toSGBCData(sgb.tiles, sgb.map, sgb.palettes));
    });
  });
};

export default compileSGBImage;
