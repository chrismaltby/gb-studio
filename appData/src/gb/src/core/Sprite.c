#include "Sprite.h"

#include "Stack.h"

Sprite sprites[MAX_SPRITES];

DECLARE_STACK(sprite_pool, MAX_SPRITES);
UINT8 sprite_active_pool[MAX_SPRITES];
UBYTE sprite_active_pool_size = 0;

void SpritePoolReset() {
  UBYTE i, k;
  for (i = 0; i != MAX_SPRITES; i++) {
    k = i << 1;
    sprite_pool[i] = k;
    move_sprite(k, 0, 0);
    move_sprite(k + 1, 0, 0);
  }
  sprite_pool[0] = MAX_SPRITES;
  sprite_active_pool[0] = 0;
  sprite_active_pool_size = 0;
}

void SpritePoolReturn(UINT8 i) {
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

UINT8 SpritePoolNext() {
  UINT8 next = StackPop(sprite_pool);
  sprite_active_pool[sprite_active_pool_size++] = next;
  LOG("SPRITE:: gotfrompool %u\n", next);
  return next;
}
