const fs = require("fs");
const promisify = require("util").promisify;
const getPixels = promisify(require("get-pixels"));
const zeros = require("zeros");
const savePixels = require("save-pixels");

const TILE_SIZE = 8;
const MAX_TILEMAP_TILE_WIDTH = 16;
const MAX_TILEMAP_WIDTH = TILE_SIZE * MAX_TILEMAP_TILE_WIDTH;

function memoize(fn) {
  var cache = {};
  return function(x) {
    if (cache[x]) {
      return cache[x];
    }
    return (cache[x] = fn(x));
  };
}

const indexColour = (r, g, b, a) => {
  if (g < 65) {
    return 3;
  } else if (g < 130) {
    return 2;
  } else if (g < 205) {
    return 1;
  } else {
    return 0;
  }
};

const spriteIndexColour = (r, g, b, a) => {
  if (g < 65) {
    return 3;
  } else if (g < 130) {
    return 3;
  } else if (g < 205) {
    return 2;
  } else if ((g > 250 && b < 100) || a < 10) {
    return 0;
  } else {
    return 1;
  }
};

const bin2 = memoize(value => {
  return pad(value.toString(2), 2);
});

function colorFromIndex(index) {
  if (index === 0) {
    return 255;
  } else if (index === 1) {
    return 200;
  } else if (index === 2) {
    return 100;
  } else {
    return 0;
  }
}

function pad(n, width, z) {
  z = z || "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

const binHex = memoize(binary => {
  return "0x" + pad(parseInt(binary, 2).toString(16), 2).toUpperCase();
});

function decHex(dec) {
  return "0x" + pad(((256 + dec) % 256).toString(16), 2).toUpperCase();
}

function parseTileString(string) {
  return string.split(",").map(function(v) {
    return parseInt(v, 16);
  });
}

function tilePixelsToHexString(pixels, indexFn) {
  indexFn = indexFn || indexColour;
  var tile = "";
  for (var y = 0; y < 8; y++) {
    var row1 = "";
    var row2 = "";
    for (var x = 0; x < 8; x++) {
      var col = indexFn(
        pixels.get(x, y, 0), // Red
        pixels.get(x, y, 1), // Green
        pixels.get(x, y, 2), // Blue
        pixels.get(x, y, 3) // Alpha
      );
      var binary = bin2(col);
      row1 += binary[1];
      row2 += binary[0];
    }
    tile += binHex(row1) + "," + binHex(row2) + ",";
  }
  return tile;
}

function pixelsToTilesData(pixels) {
  const shape = pixels.shape.slice();

  const xTiles = Math.floor(shape[0] / TILE_SIZE);
  const yTiles = Math.floor(shape[1] / TILE_SIZE);

  var tiles = [];

  for (var tyi = 0; tyi < yTiles; tyi++) {
    for (var txi = 0; txi < xTiles; txi++) {
      var tilePixels = pixels
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

  var tiles = {};
  var tileIndex = 0;

  for (var tyi = 0; tyi < yTiles; tyi++) {
    for (var txi = 0; txi < xTiles; txi++) {
      var tilePixels = pixels
        .lo(txi * TILE_SIZE, tyi * TILE_SIZE)
        .hi(TILE_SIZE, TILE_SIZE);
      var tile = tilePixelsToHexString(tilePixels);
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

  var output = "";
  for (var txi = 0; txi < xTiles; txi++) {
    for (var tyi = 0; tyi < yTiles; tyi++) {
      var tilePixels = pixels
        .lo(txi * TILE_SIZE, tyi * TILE_SIZE)
        .hi(TILE_SIZE, TILE_SIZE);
      var tile = tilePixelsToHexString(tilePixels, spriteIndexColour);
      output += tile;
    }
  }

  return output.slice(0, -1);
}

function pixelsAndLookupToTilemap(pixels, lookup, offset) {
  offset = offset || 0;
  const shape = pixels.shape.slice();
  const xTiles = Math.floor(shape[0] / TILE_SIZE);
  const yTiles = Math.floor(shape[1] / TILE_SIZE);

  var output = [];

  for (var tyi = 0; tyi < yTiles; tyi++) {
    for (var txi = 0; txi < xTiles; txi++) {
      var tilePixels = pixels
        .lo(txi * TILE_SIZE, tyi * TILE_SIZE)
        .hi(TILE_SIZE, TILE_SIZE);
      var tile = tilePixelsToHexString(tilePixels);
      if (lookup[tile] === undefined) {
        throw new Error("Tile is missing from tileset: " + tile);
      }
      output.push(lookup[tile] + offset);
    }
  }

  return output;
}

function mergeTileLookups(lookups) {
  var tileIndex = 0;
  return lookups.reduce(function(memo, lookup) {
    var tiles = Object.keys(lookup);
    for (var i = 0; i < tiles.length; i++) {
      if (memo[tiles[i]] === undefined) {
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
  var tilesetLookup = getPixels(tilesetFilename).then(pixelsToTilesLookup);
  return Promise.all([getPixels(filename), tilesetLookup])
    .then(function(res) {
      return pixelsAndLookupToTilemap(res[0], res[1], offset);
    })
    .then(function(tilemap) {
      return tilemap.map(decHex).join(",");
    });
}

function imageAndTilesetToTilemapIntArray(filename, tilesetFilename, offset) {
  var tilesetLookup = getPixels(tilesetFilename).then(pixelsToTilesLookup);
  return Promise.all([getPixels(filename), tilesetLookup]).then(function(res) {
    return pixelsAndLookupToTilemap(res[0], res[1], offset);
  });
}

function imageToTilesetLookup(filename) {
  return getPixels(filename).then(pixelsToTilesLookup);
}

function imagesToTilesetLookups(filenames) {
  const lookups = filenames.reduce(function(memo, filename) {
    return memo.then(function(memo) {
      return imageToTilesetLookup(filename).then(function(lookup) {
        return [].concat(memo, lookup);
      });
    });
  }, Promise.resolve([]));
  return lookups.then(mergeTileLookups);
}

function imagesToTilesetImage(filenames, outfile) {
  return imagesToTilesetLookups.then(function(lookup) {
    return tileLookupToImage(lookup, outfile);
  });
  // const lookups = filenames.reduce(function(memo, filename) {
  //   return memo.then(function(memo) {
  //     return getPixels(filename)
  //       .then(pixelsToTilesLookup)
  //       .then(function(lookup) {
  //         return [].concat(memo, lookup);
  //       });
  //   });
  // }, Promise.resolve([]));

  // return lookups.then(mergeTileLookups).then(tileLookupToImage(outfile));
}

function tileLookupToImage(lookup, outFile) {
  var tiles = Object.keys(lookup);
  var imgWidth = Math.min(tiles.length * TILE_SIZE, MAX_TILEMAP_WIDTH);
  var imgHeight = TILE_SIZE * Math.ceil(tiles.length / MAX_TILEMAP_TILE_WIDTH);
  var img = zeros([imgWidth, imgHeight]);
  for (var t = 0; t < tiles.length; t++) {
    var tileOffsetX = TILE_SIZE * (t % MAX_TILEMAP_TILE_WIDTH);
    var tileOffsetY = TILE_SIZE * Math.floor(t / MAX_TILEMAP_TILE_WIDTH);
    var data = parseTileString(tiles[t]);
    for (var i = 0; i < 16; i += 2) {
      for (var j = 0; j < 8; j++) {
        var mask = Math.pow(2, j);
        var index = (data[i] & mask ? 1 : 0) + (data[i + 1] & mask ? 2 : 0);
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
  return new Promise(function(resolve, reject) {
    var imgStream = savePixels(pixels, "png");
    var bufs = [];
    imgStream.on("data", function(d) {
      bufs.push(d);
    });
    imgStream.on("end", function() {
      var buf = Buffer.concat(bufs);
      if (outFile) {
        fs.writeFile(outFile, buf, function(err) {
          if (err) {
            return reject(err);
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
