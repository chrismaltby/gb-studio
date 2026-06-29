import {
  imageTileAllocationColorOnly,
  imageTileAllocationDefault,
  spriteTileAllocationColorOnly,
  spriteTileAllocationDefault,
  spriteTileAllocationVRAM2Only,
} from "lib/compiler/tileAllocation";

describe("imageTileAllocationDefault", () => {
  test("Should allocate all image tiles to VRAM1 in original order", () => {
    for (let i = 0; i < 384; i++) {
      expect(imageTileAllocationDefault(i, 384)).toEqual({
        tileIndex: i,
        inVRAM2: false,
      });
    }
  });
});

describe("imageTileAllocationColorOnly", () => {
  const expectedColorOnlyAllocation = (tileIndex: number) => {
    if (tileIndex < 128) {
      return {
        tileIndex,
        inVRAM2: false,
      };
    }

    if (tileIndex < 256) {
      return {
        tileIndex: tileIndex - 128,
        inVRAM2: true,
      };
    }

    return {
      tileIndex: 128 + Math.floor((tileIndex - 256) / 2),
      inVRAM2: tileIndex % 2 !== 0,
    };
  };

  test("Should allocate first 128 image tiles to VRAM1", () => {
    for (let i = 0; i < 128; i++) {
      expect(imageTileAllocationColorOnly(i, 384)).toEqual({
        tileIndex: i,
        inVRAM2: false,
      });
    }
  });

  test("Should allocate next 128 image tiles to VRAM2 with index reset", () => {
    for (let i = 128; i < 256; i++) {
      expect(imageTileAllocationColorOnly(i, 384)).toEqual({
        tileIndex: i - 128,
        inVRAM2: true,
      });
    }
  });

  test("Should split image tiles after 255 evenly between VRAM1 and VRAM2", () => {
    for (let i = 256; i < 384; i++) {
      expect(imageTileAllocationColorOnly(i, 384)).toEqual({
        tileIndex: 128 + Math.floor((i - 256) / 2),
        inVRAM2: i % 2 !== 0,
      });
    }
  });

  test("Should handle image allocation boundary values", () => {
    expect(imageTileAllocationColorOnly(0, 384)).toEqual({
      tileIndex: 0,
      inVRAM2: false,
    });
    expect(imageTileAllocationColorOnly(127, 384)).toEqual({
      tileIndex: 127,
      inVRAM2: false,
    });
    expect(imageTileAllocationColorOnly(128, 384)).toEqual({
      tileIndex: 0,
      inVRAM2: true,
    });
    expect(imageTileAllocationColorOnly(255, 384)).toEqual({
      tileIndex: 127,
      inVRAM2: true,
    });
    expect(imageTileAllocationColorOnly(256, 384)).toEqual({
      tileIndex: 128,
      inVRAM2: false,
    });
    expect(imageTileAllocationColorOnly(257, 384)).toEqual({
      tileIndex: 128,
      inVRAM2: true,
    });
    expect(imageTileAllocationColorOnly(258, 384)).toEqual({
      tileIndex: 129,
      inVRAM2: false,
    });
    expect(imageTileAllocationColorOnly(259, 384)).toEqual({
      tileIndex: 129,
      inVRAM2: true,
    });
  });

  test("Should match expected image color-only allocation over a large range", () => {
    for (let i = 0; i < 512; i++) {
      expect(imageTileAllocationColorOnly(i, 512)).toEqual(
        expectedColorOnlyAllocation(i),
      );
    }
  });
});

describe("spriteTileAllocationDefault", () => {
  test("Should allocate all 8x8 sprite tiles to VRAM1 in original order", () => {
    for (let i = 0; i < 128; i++) {
      expect(spriteTileAllocationDefault(i, 128, "8x8")).toEqual({
        tileIndex: i,
        inVRAM2: false,
      });
    }
  });

  test("Should allocate all 8x16 sprite tiles to VRAM1 in original order", () => {
    for (let i = 0; i < 128; i++) {
      expect(spriteTileAllocationDefault(i, 128, "8x16")).toEqual({
        tileIndex: i,
        inVRAM2: false,
      });
    }
  });
});

describe("spriteTileAllocationColorOnly", () => {
  test("Should split even 8x8 sprite tile counts evenly between VRAM banks", () => {
    const numTiles = 8;

    expect(spriteTileAllocationColorOnly(0, numTiles, "8x8")).toEqual({
      tileIndex: 0,
      inVRAM2: false,
    });
    expect(spriteTileAllocationColorOnly(1, numTiles, "8x8")).toEqual({
      tileIndex: 1,
      inVRAM2: false,
    });
    expect(spriteTileAllocationColorOnly(2, numTiles, "8x8")).toEqual({
      tileIndex: 2,
      inVRAM2: false,
    });
    expect(spriteTileAllocationColorOnly(3, numTiles, "8x8")).toEqual({
      tileIndex: 3,
      inVRAM2: false,
    });
    expect(spriteTileAllocationColorOnly(4, numTiles, "8x8")).toEqual({
      tileIndex: 0,
      inVRAM2: true,
    });
    expect(spriteTileAllocationColorOnly(5, numTiles, "8x8")).toEqual({
      tileIndex: 1,
      inVRAM2: true,
    });
    expect(spriteTileAllocationColorOnly(6, numTiles, "8x8")).toEqual({
      tileIndex: 2,
      inVRAM2: true,
    });
    expect(spriteTileAllocationColorOnly(7, numTiles, "8x8")).toEqual({
      tileIndex: 3,
      inVRAM2: true,
    });
  });

  test("Should place the extra tile in VRAM1 for odd 8x8 sprite tile counts", () => {
    const numTiles = 5;

    expect(spriteTileAllocationColorOnly(0, numTiles, "8x8")).toEqual({
      tileIndex: 0,
      inVRAM2: false,
    });
    expect(spriteTileAllocationColorOnly(1, numTiles, "8x8")).toEqual({
      tileIndex: 1,
      inVRAM2: false,
    });
    expect(spriteTileAllocationColorOnly(2, numTiles, "8x8")).toEqual({
      tileIndex: 2,
      inVRAM2: false,
    });
    expect(spriteTileAllocationColorOnly(3, numTiles, "8x8")).toEqual({
      tileIndex: 0,
      inVRAM2: true,
    });
    expect(spriteTileAllocationColorOnly(4, numTiles, "8x8")).toEqual({
      tileIndex: 1,
      inVRAM2: true,
    });
  });

  test("Should split 8x16 sprite tiles in pairs between VRAM banks", () => {
    const numTiles = 8;

    expect(spriteTileAllocationColorOnly(0, numTiles, "8x16")).toEqual({
      tileIndex: 0,
      inVRAM2: false,
    });
    expect(spriteTileAllocationColorOnly(1, numTiles, "8x16")).toEqual({
      tileIndex: 1,
      inVRAM2: false,
    });
    expect(spriteTileAllocationColorOnly(2, numTiles, "8x16")).toEqual({
      tileIndex: 2,
      inVRAM2: false,
    });
    expect(spriteTileAllocationColorOnly(3, numTiles, "8x16")).toEqual({
      tileIndex: 3,
      inVRAM2: false,
    });
    expect(spriteTileAllocationColorOnly(4, numTiles, "8x16")).toEqual({
      tileIndex: 0,
      inVRAM2: true,
    });
    expect(spriteTileAllocationColorOnly(5, numTiles, "8x16")).toEqual({
      tileIndex: 1,
      inVRAM2: true,
    });
    expect(spriteTileAllocationColorOnly(6, numTiles, "8x16")).toEqual({
      tileIndex: 2,
      inVRAM2: true,
    });
    expect(spriteTileAllocationColorOnly(7, numTiles, "8x16")).toEqual({
      tileIndex: 3,
      inVRAM2: true,
    });
  });

  test("Should round 8x16 VRAM1 allocation up to an even tile pair boundary", () => {
    const numTiles = 5;

    expect(spriteTileAllocationColorOnly(0, numTiles, "8x16")).toEqual({
      tileIndex: 0,
      inVRAM2: false,
    });
    expect(spriteTileAllocationColorOnly(1, numTiles, "8x16")).toEqual({
      tileIndex: 1,
      inVRAM2: false,
    });
    expect(spriteTileAllocationColorOnly(2, numTiles, "8x16")).toEqual({
      tileIndex: 2,
      inVRAM2: false,
    });
    expect(spriteTileAllocationColorOnly(3, numTiles, "8x16")).toEqual({
      tileIndex: 3,
      inVRAM2: false,
    });
    expect(spriteTileAllocationColorOnly(4, numTiles, "8x16")).toEqual({
      tileIndex: 0,
      inVRAM2: true,
    });
  });

  test("Should calculate expected 8x8 color-only sprite allocation for a range of tile counts", () => {
    for (let numTiles = 1; numTiles <= 16; numTiles++) {
      const bank1NumTiles = Math.ceil(numTiles / 2);

      for (let tileIndex = 0; tileIndex < numTiles; tileIndex++) {
        const inVRAM2 = tileIndex >= bank1NumTiles;

        expect(
          spriteTileAllocationColorOnly(tileIndex, numTiles, "8x8"),
        ).toEqual({
          tileIndex: inVRAM2 ? tileIndex - bank1NumTiles : tileIndex,
          inVRAM2,
        });
      }
    }
  });

  test("Should calculate expected 8x16 color-only sprite allocation for a range of tile counts", () => {
    for (let numTiles = 1; numTiles <= 16; numTiles++) {
      const bank1NumTiles = Math.ceil(numTiles / 4) * 2;

      for (let tileIndex = 0; tileIndex < numTiles; tileIndex++) {
        const inVRAM2 = tileIndex >= bank1NumTiles;

        expect(
          spriteTileAllocationColorOnly(tileIndex, numTiles, "8x16"),
        ).toEqual({
          tileIndex: inVRAM2 ? tileIndex - bank1NumTiles : tileIndex,
          inVRAM2,
        });
      }
    }
  });
});

describe("spriteTileAllocationVRAM2Only", () => {
  test("Should allocate all sprite tiles to VRAM2 in original order", () => {
    for (let i = 0; i < 128; i++) {
      expect(spriteTileAllocationVRAM2Only(i)).toEqual({
        tileIndex: i,
        inVRAM2: true,
      });
    }
  });
});
