#include "Sprite.h"

#include "BankManager.h"
#include "Stack.h"

SpriteInfo sprites_info[MAX_FRAMES];
DECLARE_STACK(sprite_pool, MAX_SPRITES);
UBYTE hide_sprites = FALSE;

void SpritePoolReset_b() __banked;
void SpritePoolReturn_b(UINT8 i) __banked;
UINT8 SpritePoolNext_b() __banked;

void SpritePoolReset() {
  SpritePoolReset_b();
}

void SpritePoolReturn(UINT8 i) {
  SpritePoolReturn_b(i);
}

UINT8 SpritePoolNext() {
  return SpritePoolNext_b();
}
