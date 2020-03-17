#include "Sprite.h"

#include "Stack.h"

Sprite sprites[MAX_SPRITES];

DECLARE_STACK(sprite_pool, MAX_SPRITES);
UINT8 sprite_active_pool[MAX_SPRITES];
UBYTE sprite_active_pool_size = 0;

void SpritePoolReset() {
  UBYTE i, k;
  for (i = MAX_SPRITES; i != 0; i--) {
    k = i << 1;
    sprite_pool[i] = MAX_SPRITES - i;
    move_sprite(k, 0, 0);
    move_sprite(k + 1, 0, 0);
  }
  sprite_pool[0] = MAX_SPRITES;
  sprite_active_pool[0] = 0;
  sprite_active_pool_size = 0;
}

void SpritePoolReturn(UINT8 i) {
  UBYTE j, k;
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
    k = i << 1;
    // Move sprite offscreen
    move_sprite(k, 0, 0);
    move_sprite(k + 1, 0, 0);
  }
}

UINT8 SpritePoolNext() {
  UINT8 next = StackPop(sprite_pool);
  sprite_active_pool[sprite_active_pool_size++] = next;
  sprites[next].rerender = TRUE;
  LOG("SPRITE:: gotfrompool %u\n", next);
  return next;
}

void UpdateSprites() {
  UBYTE i, s, k, frame;  //, flip, fo;
  UBYTE screen_x;
  UBYTE screen_y;

  k = 0;

  for (i = 0; i != sprite_active_pool_size; i++) {
    s = sprite_active_pool[i];
    LOG("SPRITE UpdateSprites %u %u\n", i, s);

    k = s << 1;
    screen_x = sprites[s].pos.x;
    screen_y = sprites[s].pos.y;

    if (sprites[s].rerender) {
      LOG("SPRITE RERENDER %u %u\n", i, s);
      frame = MUL_4(sprites[s].frame + sprites[s].frame_offset);

      if (sprites[s].flip) {
        set_sprite_prop(k, S_FLIPX);
        set_sprite_prop(k + 1, S_FLIPX);
        set_sprite_tile(k, frame + 2);
        set_sprite_tile(k + 1, frame);
      } else {
        set_sprite_prop(k, 0);
        set_sprite_prop(k + 1, 0);
        set_sprite_tile(k, frame);
        set_sprite_tile(k + 1, frame + 2);
      }

      sprites[s].rerender = FALSE;
    }

    LOG("SPRITE MOVE %u %u\n", i, s);
    move_sprite(k, screen_x, screen_y);
    move_sprite(k + 1, screen_x + 8, screen_y);
  }
}
