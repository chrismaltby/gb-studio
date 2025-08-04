import { TILE_SIZE } from "consts";
import { CollisionTileDef } from "shared/lib/resources/types";

const collisonTileMaskCache: Record<string, ImageData> = {};
const collisonTileCache: Record<string, HTMLCanvasElement> = {};

export const renderCollisionTileIcon = (
  icon: string,
  color: string,
): HTMLCanvasElement => {
  const key = `${color}:${icon}`;

  // Use cached if available
  const cachedIcon = collisonTileCache[key];
  if (cachedIcon) {
    return cachedIcon;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create canvas context");
  }

  // Convert icon to binary representation
  const iconBits = icon
    .split("")
    .map((c) => parseInt(c, 16).toString(2).padStart(4, "0"))
    .join("");

  // Use cached mask if available
  let maskData = collisonTileMaskCache[icon];
  if (!maskData) {
    maskData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
    // Draw mask
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const i = x + y * TILE_SIZE;
        const ii = i * 4;
        maskData.data[ii + 3] = iconBits[i] === "1" ? 255 : 0;
      }
    }
  }

  ctx.putImageData(maskData, 0, 0);

  // Fill color over mask
  ctx.fillStyle = color;
  ctx.globalCompositeOperation = "source-in";
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

  // Cache result
  collisonTileMaskCache[icon] = maskData;
  collisonTileCache[key] = canvas;

  return canvas;
};

export const isCollisionTileActive = (
  value: number,
  tileDef: CollisionTileDef,
  tileDefs: CollisionTileDef[],
): boolean => {
  const mask = tileDef.mask || 0xff;
  const maskedValue = value & mask;
  const exactMatch = tileDefs.find(
    (td) => td.flag === (value & (td.mask ?? 0xff)),
  );

  if (tileDef === exactMatch) {
    // Exact match found and this is that tile
    return true;
  } else if (exactMatch) {
    // Exact match found but it wasn't this tile
    return false;
  } else if (tileDef.multi) {
    return (
      // Full mask not selected
      maskedValue !== mask &&
      // But flag bits are
      (maskedValue & tileDef.flag) !== 0
    );
  } else {
    return maskedValue === tileDef.flag;
  }
};
