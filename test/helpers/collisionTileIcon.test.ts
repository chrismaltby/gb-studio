import { isCollisionTileActive } from "shared/lib/collisions/collisionTiles";
import { CollisionTileDef } from "shared/lib/resources/types";

const WHITE = "#FFFFFFFF";

describe("isCollisionTileActive", () => {
  test("should be active when value matches", () => {
    const tileDef: CollisionTileDef = {
      key: "t1",
      color: WHITE,
      flag: 0x1,
    };
    expect(isCollisionTileActive(1, tileDef)).toBeTrue();
  });

  test("should not be active when value doesn't match", () => {
    const tileDef: CollisionTileDef = {
      key: "t1",
      color: WHITE,
      flag: 0x1,
    };
    expect(isCollisionTileActive(0, tileDef)).toBeFalse();
  });

  test("should be active when masked value matches", () => {
    const tileDef: CollisionTileDef = {
      key: "t1",
      color: WHITE,
      flag: 0x1,
      mask: 0xf,
    };
    expect(isCollisionTileActive(0x31, tileDef)).toBeTrue();
  });

  test("should not be active when flag is set without mask", () => {
    const tileDef: CollisionTileDef = {
      key: "t1",
      color: WHITE,
      flag: 0x1,
    };
    expect(isCollisionTileActive(0x31, tileDef)).toBeFalse();
  });

  test("should be active when bit is set for multi selection (shift + selected multiple walls)", () => {
    const tileDef: CollisionTileDef = {
      key: "t1",
      color: WHITE,
      flag: 0x1,
      mask: 0xf,
      multi: true,
    };
    expect(isCollisionTileActive(0x5, tileDef)).toBeTrue();
  });

  test("should not be active when bit is set for without multi select flag", () => {
    const tileDef: CollisionTileDef = {
      key: "t1",
      color: WHITE,
      flag: 0x1,
      mask: 0xf,
      multi: false,
    };
    expect(isCollisionTileActive(0x5, tileDef)).toBeFalse();
  });

  test("should not be active when all bits set in multi selection (shift + selected ALL walls)", () => {
    const tileDef: CollisionTileDef = {
      key: "t1",
      color: WHITE,
      flag: 0x1,
      mask: 0xf,
      multi: true,
    };
    expect(isCollisionTileActive(0xf, tileDef)).toBeFalse();
  });
});
