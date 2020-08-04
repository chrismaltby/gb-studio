#include "Collision.h"

#include "BankManager.h"
#include "DataManager.h"

#define MAX_UINT16 0xFFFF

UBYTE TileAt(UINT16 tx, UINT16 ty) {
  UWORD y_offset;
  UBYTE tile;
  // Check tile outside of bounds
  if (tx == MAX_UINT16 || tx == image_tile_width || ty == image_tile_height || ty == MAX_UINT16) {
    return OUT_OF_BOUNDS;
  }

  y_offset = ty * (UINT16)image_tile_width;

  PUSH_BANK(collision_bank);
  tile = (UBYTE) * (collision_ptr + y_offset + tx);
  POP_BANK;
  return tile;
}

UBYTE TileAt2x1(UINT16 tx, UINT16 ty) {
  UBYTE*  collision_ptr_tmp;
  UBYTE tile;
  // Check tile outside of bounds
  if (tx == MAX_UINT16 || tx == image_tile_width || ty == image_tile_height || ty == MAX_UINT16) {
    return OUT_OF_BOUNDS;
  }

  collision_ptr_tmp = ty * (UINT16)image_tile_width + tx + collision_ptr;
  
  PUSH_BANK(collision_bank);
  tile = (UBYTE) * collision_ptr_tmp | (UBYTE) *(collision_ptr_tmp + 1U);
  POP_BANK;
  return tile;
}

UBYTE TileAt2x2(UINT16 tx, UINT16 ty) {
  UWORD y_offset, y1_offset;
  UBYTE tile;
  // Check tile outside of bounds
  if (tx == MAX_UINT16 || tx == image_tile_width || ty == image_tile_height || ty == MAX_UINT16) {
    return OUT_OF_BOUNDS;
  }

  y_offset = ty * (UINT16)image_tile_width;
  y1_offset = (ty + 1U) * (UINT16)image_tile_width;

  PUSH_BANK(collision_bank);
  tile = (UBYTE) * (collision_ptr + y_offset + tx);
  if (!tile) {
    tile = (UBYTE) * (collision_ptr + y_offset + (tx + 1U));
    if (!tile) {
      tile = (UBYTE) * (collision_ptr + y1_offset + (tx));
      if (!tile) {
        tile = (UBYTE) * (collision_ptr + y1_offset + (tx + 1U));
      }
    }
  }
  POP_BANK;
  return tile;
}
