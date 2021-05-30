#pragma bank 1

#include "Sprite.h"
#include "Stack.h"

UINT8 sprite_active_pool[MAX_SPRITES];
UBYTE sprite_active_pool_size = 0;

void SpritePoolReset_b() __banked {
  UBYTE i, k;
  sprite_pool[0] = 0;
  for (i = 0; i != MAX_SPRITES; i++) {
    // Reverse order of sprites so newer
    // sprites will appear behind player/projectiles
    k = (MAX_SPRITES - i) << 1;
    StackPush(sprite_pool, k);
    move_sprite(k, 0, 0);
    move_sprite(k + 1, 0, 0);
  }
  sprite_active_pool[0] = 0;
  sprite_active_pool_size = 0;
}

void SpritePoolReturn_b(UINT8 i) __banked {
  UBYTE j;
  UBYTE a = 0;

  StackPush(sprite_pool, i);

  // Find index in pool
  for (j = 0; j != sprite_active_pool_size; j++) {
    if (sprite_active_pool[j] == i) {
      a = j;
      break;
    }
  }

  // If found sprite with index
  if (a) {
    // Return index to pool
    sprite_active_pool[a] = sprite_active_pool[--sprite_active_pool_size];
    // Move sprite offscreen
    move_sprite(i, 0, 0);
    move_sprite(i + 1, 0, 0);
  }
}

UINT8 SpritePoolNext_b() __banked {
  UINT8 next = StackPop(sprite_pool);
  sprite_active_pool[sprite_active_pool_size++] = next;
  
  return next;
}
