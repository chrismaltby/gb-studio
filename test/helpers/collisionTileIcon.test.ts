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
    const tileDefs = [tileDef];
    expect(isCollisionTileActive(1, tileDef, tileDefs)).toBeTrue();
  });

  test("should not be active when value doesn't match", () => {
    const tileDef: CollisionTileDef = {
      key: "t1",
      color: WHITE,
      flag: 0x1,
    };
    const tileDefs = [tileDef];
    expect(isCollisionTileActive(0, tileDef, tileDefs)).toBeFalse();
  });

  test("should be active when masked value matches", () => {
    const tileDef: CollisionTileDef = {
      key: "t1",
      color: WHITE,
      flag: 0x1,
      mask: 0xf,
    };
    const tileDefs = [tileDef];
    expect(isCollisionTileActive(0x31, tileDef, tileDefs)).toBeTrue();
  });

  test("should not be active when flag is set without mask", () => {
    const tileDef: CollisionTileDef = {
      key: "t1",
      color: WHITE,
      flag: 0x1,
    };
    const tileDefs = [tileDef];
    expect(isCollisionTileActive(0x31, tileDef, tileDefs)).toBeFalse();
  });

  test("should be active when bit is set for multi selection (shift + selected multiple walls)", () => {
    const tileDef: CollisionTileDef = {
      key: "t1",
      color: WHITE,
      flag: 0x1,
      mask: 0xf,
      multi: true,
    };
    const tileDefs = [tileDef];
    expect(isCollisionTileActive(0x5, tileDef, tileDefs)).toBeTrue();
  });

  test("should not be active when bit is set for without multi select flag", () => {
    const tileDef: CollisionTileDef = {
      key: "t1",
      color: WHITE,
      flag: 0x1,
      mask: 0xf,
      multi: false,
    };
    const tileDefs = [tileDef];
    expect(isCollisionTileActive(0x5, tileDef, tileDefs)).toBeFalse();
  });

  test("should not be active when all bits set in multi selection (shift + selected ALL walls)", () => {
    const tileDef: CollisionTileDef = {
      key: "t1",
      color: WHITE,
      flag: 0x1,
      mask: 0xf,
      multi: true,
    };
    const tileDefs = [tileDef];
    expect(isCollisionTileActive(0xf, tileDef, tileDefs)).toBeFalse();
  });

  test("should not be active if better match found", () => {
    const tileDef1: CollisionTileDef = {
      key: "t1",
      color: WHITE,
      flag: 0x1,
      mask: 0x3,
    };
    const tileDef2: CollisionTileDef = {
      key: "t2",
      color: WHITE,
      flag: 0x3,
      mask: 0x3,
    };
    const tileDefs = [tileDef1, tileDef2];
    expect(isCollisionTileActive(0x3, tileDef1, tileDefs)).toBeFalse();
  });

  test("should be active if exact match found", () => {
    const tileDef1: CollisionTileDef = {
      key: "t1",
      color: WHITE,
      flag: 0x1,
      mask: 0x7,
    };
    const tileDef2: CollisionTileDef = {
      key: "t2",
      color: WHITE,
      flag: 0x7,
      mask: 0x7,
    };
    const tileDef3: CollisionTileDef = {
      key: "t3",
      color: WHITE,
      flag: 0x3,
      mask: 0x7,
    };

    const tileDefs = [tileDef1, tileDef2, tileDef3];
    expect(isCollisionTileActive(0x7, tileDef2, tileDefs)).toBeTrue();
  });
});
