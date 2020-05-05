#include "Collision.h"

#include "BankManager.h"
#include "DataManager.h"

#define MAX_UINT16 0xFFFF

UBYTE TileAt(UINT16 tx, UINT16 ty) {
  UBYTE tile;
  // Check tile outside of bounds
  if (tx == MAX_UINT16 || tx == image_tile_width || ty == image_tile_height || ty == MAX_UINT16) {
    return OUT_OF_BOUNDS;
  }
  PUSH_BANK(collision_bank);
  tile = (UBYTE) * (collision_ptr + (ty * image_tile_width) + tx);
  POP_BANK;
  return tile;
}

UBYTE TileAt2x1(UINT16 tx, UINT16 ty) {
  UBYTE tile;
  // Check tile outside of bounds
  if (tx == MAX_UINT16 || tx == image_tile_width || ty == image_tile_height || ty == MAX_UINT16) {
    return OUT_OF_BOUNDS;
  }
  PUSH_BANK(collision_bank);
  tile = (UBYTE) * (collision_ptr + (ty * image_tile_width) + tx);
  if (!tile) {
    tile = (UBYTE) * (collision_ptr + (ty * image_tile_width) + (tx + 1));
  }
  POP_BANK;
  return tile;
}

UBYTE TileAt2x2(UINT16 tx, UINT16 ty) {
  UBYTE tile;
  // Check tile outside of bounds
  if (tx == MAX_UINT16 || tx == image_tile_width || ty == image_tile_height || ty == MAX_UINT16) {
    return OUT_OF_BOUNDS;
  }
  PUSH_BANK(collision_bank);
  tile = (UBYTE) * (collision_ptr + (ty * image_tile_width) + tx);
  if (!tile) {
    tile = (UBYTE) * (collision_ptr + (ty * image_tile_width) + (tx + 1));
    if (!tile) {
      tile = (UBYTE) * (collision_ptr + ((ty + 1) * image_tile_width) + (tx));
      if (!tile) {
        tile = (UBYTE) * (collision_ptr + ((ty + 1) * image_tile_width) + (tx + 1));
      }
    }
  }
  POP_BANK;
  return tile;
}
