import {
  compress8bitNumberArray,
  compressNumberArray,
  compressProjectResources,
  decompress8bitNumberString,
  decompressNumberString,
  decompressProjectResources,
} from "shared/lib/resources/compression";
import { encodeSceneTileRef } from "shared/lib/tiles/sceneTilemapData";
import { ProjectResources } from "shared/lib/resources/types";
import {
  dummyBackgroundResource,
  dummyCompressedBackgroundResource,
  dummyCompressedSceneResource,
  dummyProjectResources,
  dummySceneResource,
} from "../dummydata";

describe("compression.ts", () => {
  describe("scene tile reference compression", () => {
    it("round trips values larger than one byte", () => {
      const autotile = encodeSceneTileRef(2, 100);
      const values = [0, 0, 65537, 65537, 196700, autotile, autotile, 0];
      expect(decompressNumberString(compressNumberArray(values))).toEqual(
        values,
      );
    });

    it("compresses and decompresses painted scene layers", () => {
      const resources: ProjectResources = {
        ...dummyProjectResources,
        scenes: [
          {
            ...dummyCompressedSceneResource,
            collisions: [],
            tilemap: {
              tilesets: [{ id: "tiles", width: 3, height: 1 }],
              tileColors: [0, 2, 2],
              layers: [
                {
                  id: "layer",
                  name: "Layer",
                  visible: true,
                  tiles: [0, 1, 1],
                  autotiles: [0, 1, 1],
                },
              ],
            },
          },
        ],
      };
      const decompressed = decompressProjectResources(
        compressProjectResources(resources),
      );
      expect(decompressed.scenes[0]?.tilemap).toEqual(
        resources.scenes[0]?.tilemap,
      );
    });

    it("prunes scene tilemaps without an external tileset lookup", () => {
      const resources: ProjectResources = {
        ...dummyProjectResources,
        scenes: [
          {
            ...dummyCompressedSceneResource,
            collisions: [],
            tilemap: {
              tilesets: [
                { id: "unused", width: 256, height: 256 },
                { id: "used", width: 4, height: 1 },
                { id: "also-unused", width: 4, height: 1 },
              ],
              tileColors: [0, 2],
              layers: [
                {
                  id: "layer",
                  name: "Layer",
                  visible: true,
                  tiles: [65537, 65539],
                },
              ],
            },
          },
        ],
      };
      const decompressed = decompressProjectResources(
        compressProjectResources(resources),
      );
      expect(decompressed.scenes[0]?.tilemap).toEqual({
        tilesets: [{ id: "used", width: 4, height: 1 }],
        tileColors: [0, 2],
        layers: [
          {
            id: "layer",
            name: "Layer",
            visible: true,
            tiles: [1, 3],
          },
        ],
      });
    });
  });
  describe("compress8bitNumberArray", () => {
    it("should compress an array of numbers correctly", () => {
      const arr = [0, 0, 42, 42, 42, 16, 16, 16, 16];
      const compressed = compress8bitNumberArray(arr);
      expect(compressed).toEqual("002+2a3+104+");
    });

    it("should return an empty string for undefined input", () => {
      const compressed = compress8bitNumberArray(undefined);
      expect(compressed).toEqual("");
    });

    it("should handle single occurrences correctly", () => {
      const arr = [0, 1, 2];
      const compressed = compress8bitNumberArray(arr);
      expect(compressed).toEqual("00!01!02!");
    });

    it("should be reversible", () => {
      const arr = [0, 0, 42, 42, 42, 16, 16, 16, 16];
      const compressed = compress8bitNumberArray(arr);
      expect(decompress8bitNumberString(compressed)).toEqual(arr);
    });
  });

  describe("decompress8bitNumberString", () => {
    it("should decompress a string to an array of numbers correctly", () => {
      const str = "002+2a3+104+";
      const decompressed = decompress8bitNumberString(str);
      expect(decompressed).toEqual([0, 0, 42, 42, 42, 16, 16, 16, 16]);
    });

    it("should handle single occurrences correctly", () => {
      const str = "00!01!02!";
      const decompressed = decompress8bitNumberString(str);
      expect(decompressed).toEqual([0, 1, 2]);
    });

    it("should be reversible", () => {
      const str = "00!2a2+0410+004+05!";
      const decompressed = decompress8bitNumberString(str);
      expect(compress8bitNumberArray(decompressed)).toEqual(str);
    });

    it("should return empty array for invalid input", () => {
      const str = "00!2a+0410+004+"; // Missing count for 2a
      const decompressed = decompress8bitNumberString(str);
      expect(decompressed).toEqual([]);
      expect(decompressed).toHaveLength(0);

      const str2 = "00!2a"; // String ends before count for 2a
      const decompressed2 = decompress8bitNumberString(str2);
      expect(decompressed2).toEqual([]);
      expect(decompressed2).toHaveLength(0);

      const str3 = "00!2a2"; // String doesn't contain + to mark end of count for 2a
      const decompressed3 = decompress8bitNumberString(str3);
      expect(decompressed3).toEqual([]);
      expect(decompressed3).toHaveLength(0);
    });
  });

  describe("compressNumberArray", () => {
    it("should compress an array of numbers correctly", () => {
      const arr = [0, 0, 42, 42, 42, 16, 16, 16, 16];
      const compressed = compressNumberArray(arr);
      expect(compressed).toEqual("0:2;16:3;g:4");
    });

    it("should compress an array of numbers larger than 255 correctly", () => {
      const arr = [512, 512, 1024, 42, 0, 1, 99, 999, 999, 1596, 1596, 1596];
      const compressed = compressNumberArray(arr);
      expect(compressed).toEqual("e8:2;sg;16;0;1;2r;rr:2;18c:3");
    });

    it("should compress an array of numbers with no repeats correctly", () => {
      const arr = [0, 1, 2, 3];
      const compressed = compressNumberArray(arr);
      expect(compressed).toEqual("0;1;2;3");
    });

    it("should support large counts", () => {
      const arr = [];
      for (let i = 0; i < 300; i++) {
        arr.push(9);
      }
      const compressed = compressNumberArray(arr);
      expect(compressed).toEqual("9:8c");
    });
  });

  describe("decompressNumberString", () => {
    it("should decompress a string to an array of numbers correctly", () => {
      const str = "0:2;16:3;g:4";
      const decompressed = decompressNumberString(str);
      expect(decompressed).toEqual([0, 0, 42, 42, 42, 16, 16, 16, 16]);
    });

    it("should handle single occurrences correctly", () => {
      const str = "0;1;2";
      const decompressed = decompressNumberString(str);
      expect(decompressed).toEqual([0, 1, 2]);
    });

    it("should be reversible", () => {
      const str = "0:2;16:3;g:4";
      const decompressed = decompressNumberString(str);
      expect(compressNumberArray(decompressed)).toEqual(str);
    });

    it("should support large counts", () => {
      const str = "1f:sg";
      const decompressed = decompressNumberString(str);
      expect(decompressed.length).toEqual(1024);
      expect(decompressed.every((n) => n === 51)).toBe(true);
    });

    it("should return empty array for invalid input", () => {
      const str = "0;2a:;4:10"; // Missing count after 2a:
      const decompressed = decompressNumberString(str);
      expect(decompressed).toEqual([]);
      expect(decompressed).toHaveLength(0);

      const str2 = "0;:2;4:10"; // Missing value before :2
      const decompressed2 = decompressNumberString(str2);
      expect(decompressed2).toEqual([]);
      expect(decompressed2).toHaveLength(0);

      const str3 = "0;2a:2:3;4:10"; // Too many : separators
      const decompressed3 = decompressNumberString(str3);
      expect(decompressed3).toEqual([]);
      expect(decompressed3).toHaveLength(0);

      const str4 = "0;2a:0;4:10"; // Count cannot be zero
      const decompressed4 = decompressNumberString(str4);
      expect(decompressed4).toEqual([]);
      expect(decompressed4).toHaveLength(0);

      const str5 = "0;2a:!;4:10"; // Invalid base-36 count
      const decompressed5 = decompressNumberString(str5);
      expect(decompressed5).toEqual([]);
      expect(decompressed5).toHaveLength(0);
    });
  });

  describe("decompressProjectResources", () => {
    it("should decompress project resources correctly", () => {
      const compressedResources = {
        ...dummyProjectResources,
        scenes: [
          { ...dummyCompressedSceneResource, collisions: "002+2a3+104+" },
        ],
        backgrounds: [
          {
            ...dummyCompressedBackgroundResource,
            tileColors: "002+2a3+104+",
          },
        ],
      };

      const decompressed = decompressProjectResources(compressedResources);
      expect(decompressed.scenes[0]?.collisions).toEqual([
        0, 0, 42, 42, 42, 16, 16, 16, 16,
      ]);
      expect(decompressed.backgrounds[0]?.tileColors).toEqual([
        0, 0, 42, 42, 42, 16, 16, 16, 16,
      ]);
    });
  });

  describe("compressProjectResources", () => {
    it("should compress project resources correctly", () => {
      const resources: ProjectResources = {
        ...dummyProjectResources,
        scenes: [
          {
            ...dummySceneResource,
            collisions: [0, 0, 42, 42, 42, 16, 16, 16, 16],
            tilemap: undefined,
          },
        ],
        backgrounds: [
          {
            ...dummyBackgroundResource,
            tileColors: [0, 0, 42, 42, 42, 16, 16, 16, 16],
          },
        ],
      };

      const compressed = compressProjectResources(resources);
      expect(compressed.scenes[0]?.collisions).toEqual("002+2a3+104+");
      expect(compressed.backgrounds[0]?.tileColors).toEqual("002+2a3+104+");
    });
  });
});
