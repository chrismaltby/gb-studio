import {
  compress8bitNumberArray,
  compressProjectResources,
  decompress8bitNumberString,
  decompressProjectResources,
} from "shared/lib/resources/compression";
import { ProjectResources } from "shared/lib/resources/types";
import {
  dummyCompressedBackgroundResource,
  dummyCompressedSceneResource,
  dummyProjectResources,
} from "../dummydata";

describe("compression.ts", () => {
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
      expect(decompressed.scenes[0].collisions).toEqual([
        0, 0, 42, 42, 42, 16, 16, 16, 16,
      ]);
      expect(decompressed.backgrounds[0].tileColors).toEqual([
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
            ...dummyCompressedSceneResource,
            collisions: [0, 0, 42, 42, 42, 16, 16, 16, 16],
          },
        ],
        backgrounds: [
          {
            ...dummyCompressedBackgroundResource,
            tileColors: [0, 0, 42, 42, 42, 16, 16, 16, 16],
          },
        ],
      };

      const compressed = compressProjectResources(resources);
      expect(compressed.scenes[0].collisions).toEqual("002+2a3+104+");
      expect(compressed.backgrounds[0].tileColors).toEqual("002+2a3+104+");
    });
  });
});
