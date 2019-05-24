const fs = require("fs");
const promisify = require("util").promisify;
const getPixels = promisify(require("get-pixels"));
const zeros = require("zeros");
const savePixels = require("save-pixels");

const TILE_SIZE = 8;
const MAX_TILEMAP_TILE_WIDTH = 16;
const MAX_TILEMAP_WIDTH = TILE_SIZE * MAX_TILEMAP_TILE_WIDTH;

const memoize = fn => {
  const cache = {};
  return x => {
    if (cache[x]) {
      return cache[x];
    }
    cache[x] = fn(x);
    return cache[x];
  };
};

const indexColour = (r, g, b, a) => {
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

const spriteIndexColour = (r, g, b, a) => {
  if (g < 65) {
    return 3;
  }
  if (g < 130) {
    return 3;
  }
  if (g < 205) {
    return 2;
  }
  if ((g > 250 && b < 100) || a < 10) {
    return 0;
  }
  return 1;
};

const bin2 = memoize(value => {
  return pad(value.toString(2), 2);
});

function colorFromIndex(index) {
  if (index === 0) {
    return 255;
  }
  if (index === 1) {
    return 200;
  }
  if (index === 2) {
    return 100;
  }
  return 0;
}

function pad(str, width, z = "0") {
  const n = String(str);
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

const binHex = memoize(binary => {
  return `0x${pad(parseInt(binary, 2).toString(16), 2).toUpperCase()}`;
});

function decHex(dec) {
  return `0x${pad(((256 + dec) % 256).toString(16), 2).toUpperCase()}`;
}

function parseTileString(string) {
  return string.split(",").map(v => {
    return parseInt(v, 16);
  });
}

function tilePixelsToHexString(pixels, indexFn = indexColour) {
  let tile = "";
  for (let y = 0; y < 8; y++) {
    let row1 = "";
    let row2 = "";
    for (let x = 0; x < 8; x++) {
      const col = indexFn(
        pixels.get(x, y, 0), // Red
        pixels.get(x, y, 1), // Green
        pixels.get(x, y, 2), // Blue
        pixels.get(x, y, 3) // Alpha
      );
      const binary = bin2(col);
      row1 += binary[1];
      row2 += binary[0];
    }
    tile += `${binHex(row1)},${binHex(row2)},`;
  }
  return tile;
}

function pixelsToTilesData(pixels) {
  const shape = pixels.shape.slice();

  const xTiles = Math.floor(shape[0] / TILE_SIZE);
  const yTiles = Math.floor(shape[1] / TILE_SIZE);

  const tiles = [];

  for (let tyi = 0; tyi < yTiles; tyi++) {
    for (let txi = 0; txi < xTiles; txi++) {
      const tilePixels = pixels
        .lo(txi * TILE_SIZE, tyi * TILE_SIZE)
        .hi(TILE_SIZE, TILE_SIZE);
      tiles.push(tilePixelsToHexString(tilePixels).slice(0, -1));
    }
  }
  return tiles.join(",");
}

function pixelsToTilesLookup(pixels) {
  const shape = pixels.shape.slice();

  const xTiles = Math.floor(shape[0] / TILE_SIZE);
  const yTiles = Math.floor(shape[1] / TILE_SIZE);

  const tiles = {};
  let tileIndex = 0;

  for (let tyi = 0; tyi < yTiles; tyi++) {
    for (let txi = 0; txi < xTiles; txi++) {
      const tilePixels = pixels
        .lo(txi * TILE_SIZE, tyi * TILE_SIZE)
        .hi(TILE_SIZE, TILE_SIZE);
      const tile = tilePixelsToHexString(tilePixels);
      if (tiles[tile] === undefined) {
        tiles[tile] = tileIndex;
        tileIndex++;
      }
    }
  }

  return tiles;
}

function pixelsToSpriteData(pixels) {
  const shape = pixels.shape.slice();
  const xTiles = Math.floor(shape[0] / TILE_SIZE);
  const yTiles = Math.floor(shape[1] / TILE_SIZE);

  let output = "";
  for (let txi = 0; txi < xTiles; txi++) {
    for (let tyi = 0; tyi < yTiles; tyi++) {
      const tilePixels = pixels
        .lo(txi * TILE_SIZE, tyi * TILE_SIZE)
        .hi(TILE_SIZE, TILE_SIZE);
      const tile = tilePixelsToHexString(tilePixels, spriteIndexColour);
      output += tile;
    }
  }

  return output.slice(0, -1);
}

function pixelsAndLookupToTilemap(pixels, lookup, offset = 0) {
  const shape = pixels.shape.slice();
  const xTiles = Math.floor(shape[0] / TILE_SIZE);
  const yTiles = Math.floor(shape[1] / TILE_SIZE);

  const output = [];

  for (let tyi = 0; tyi < yTiles; tyi++) {
    for (let txi = 0; txi < xTiles; txi++) {
      const tilePixels = pixels
        .lo(txi * TILE_SIZE, tyi * TILE_SIZE)
        .hi(TILE_SIZE, TILE_SIZE);
      const tile = tilePixelsToHexString(tilePixels);
      if (lookup[tile] === undefined) {
        throw new Error(`Tile is missing from tileset: ${tile}`);
      }
      output.push(lookup[tile] + offset);
    }
  }

  return output;
}

function mergeTileLookups(lookups) {
  let tileIndex = 0;
  return lookups.reduce((memo, lookup) => {
    const tiles = Object.keys(lookup);
    for (let i = 0; i < tiles.length; i++) {
      if (memo[tiles[i]] === undefined) {
        // eslint-disable-next-line no-param-reassign
        memo[tiles[i]] = tileIndex;
        tileIndex++;
      }
    }
    return memo;
  }, {});
}

function tilesLookupToTilesString(lookup) {
  return Object.keys(lookup)
    .join("")
    .slice(0, -1);
}

function tilesLookupToTilesIntArray(lookup) {
  return tilesLookupToTilesString(lookup)
    .split(",")
    .map(a => parseInt(a, 16));
}

// Dont collapse duplicate tiles just return raw data
// used for building ui/font tiles where duplicates shouldn't collapse
function imageToTilesDataString(filename) {
  return getPixels(filename).then(pixelsToTilesData);
}

function imageToTilesDataIntArray(filename) {
  return imageToTilesDataString(filename).then(s => {
    return s.split(",").map(a => parseInt(a, 16));
  });
}

function imageToTilesString(filename) {
  return getPixels(filename)
    .then(pixelsToTilesLookup)
    .then(tilesLookupToTilesString);
}

function imageToTilesIntArray(filename) {
  return imageToTilesString(filename).then(s => {
    return s.split(",").map(a => parseInt(a, 16));
  });
}

function imageToSpriteString(filename) {
  return getPixels(filename).then(pixelsToSpriteData);
}

function imageToSpriteIntArray(filename) {
  return imageToSpriteString(filename).then(s => {
    return s.split(",").map(a => parseInt(a, 16));
  });
}

function imageAndTilesetToTilemap(filename, tilesetFilename, offset) {
  const tilesetLookup = getPixels(tilesetFilename).then(pixelsToTilesLookup);
  return Promise.all([getPixels(filename), tilesetLookup])
    .then(res => {
      return pixelsAndLookupToTilemap(res[0], res[1], offset);
    })
    .then(tilemap => {
      return tilemap.map(decHex).join(",");
    });
}

function imageAndTilesetToTilemapIntArray(filename, tilesetFilename, offset) {
  const tilesetLookup = getPixels(tilesetFilename).then(pixelsToTilesLookup);
  return Promise.all([getPixels(filename), tilesetLookup]).then(res => {
    return pixelsAndLookupToTilemap(res[0], res[1], offset);
  });
}

function imageToTilesetLookup(filename) {
  return getPixels(filename).then(pixelsToTilesLookup);
}

function imagesToTilesetLookups(filenames) {
  const lookups = filenames.reduce((memo, filename) => {
    return memo.then(m => {
      return imageToTilesetLookup(filename).then(lookup => {
        return [].concat(m, lookup);
      });
    });
  }, Promise.resolve([]));
  return lookups.then(mergeTileLookups);
}

function imagesToTilesetImage(filenames, outfile) {
  return imagesToTilesetLookups.then(lookup => {
    return tileLookupToImage(lookup, outfile);
  });
}

function tileLookupToImage(lookup, outFile) {
  const tiles = Object.keys(lookup);
  const imgWidth = Math.min(tiles.length * TILE_SIZE, MAX_TILEMAP_WIDTH);
  const imgHeight =
    TILE_SIZE * Math.ceil(tiles.length / MAX_TILEMAP_TILE_WIDTH);
  const img = zeros([imgWidth, imgHeight]);
  for (let t = 0; t < tiles.length; t++) {
    const tileOffsetX = TILE_SIZE * (t % MAX_TILEMAP_TILE_WIDTH);
    const tileOffsetY = TILE_SIZE * Math.floor(t / MAX_TILEMAP_TILE_WIDTH);
    const data = parseTileString(tiles[t]);
    for (let i = 0; i < 16; i += 2) {
      for (let j = 0; j < 8; j++) {
        const mask = Math.pow(2, j);
        const index = (data[i] & mask ? 1 : 0) + (data[i + 1] & mask ? 2 : 0);
        img.set(
          tileOffsetX + 7 - j,
          tileOffsetY + i / 2,
          colorFromIndex(index)
        );
      }
    }
  }
  return writePixelsToFile(outFile, img);
}

function writePixelsToFile(outFile, pixels) {
  return new Promise((resolve, reject) => {
    const imgStream = savePixels(pixels, "png");
    const bufs = [];
    imgStream.on("data", d => {
      bufs.push(d);
    });
    imgStream.on("end", () => {
      const buf = Buffer.concat(bufs);
      if (outFile) {
        fs.writeFile(outFile, buf, err => {
          if (err) {
            reject(err);
            return;
          }
          resolve(buf);
        });
      } else {
        resolve(buf);
      }
    });
  });
}

module.exports = {
  decHex,
  mergeTileLookups,
  imageToTilesString,
  imageToTilesIntArray,
  imageToSpriteString,
  imageToSpriteIntArray,
  imagesToTilesetImage,
  imageAndTilesetToTilemap,
  imageAndTilesetToTilemapIntArray,
  imagesToTilesetLookups,
  tileLookupToImage,
  imageToTilesetLookup,
  tilesLookupToTilesString,
  tilesLookupToTilesIntArray,
  imageToTilesDataString,
  imageToTilesDataIntArray
};
