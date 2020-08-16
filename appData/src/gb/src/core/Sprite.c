#include "Sprite.h"

#include "BankManager.h"
#include "Stack.h"

SpriteInfo sprites_info[MAX_FRAMES];
DECLARE_STACK(sprite_pool, MAX_SPRITES);
UBYTE hide_sprites = FALSE;

void SpritePoolReset_b();
void SpritePoolReturn_b(UINT8 i);
UINT8 SpritePoolNext_b();

void SpritePoolReset() {
  PUSH_BANK(SPRITE_BANK);
  SpritePoolReset_b();
  POP_BANK;
}

void SpritePoolReturn(UINT8 i) {
  PUSH_BANK(SPRITE_BANK);
  SpritePoolReturn_b(i);
  POP_BANK;
}

UINT8 SpritePoolNext() {
  UINT8 next;
  PUSH_BANK(SPRITE_BANK);
  next = SpritePoolNext_b();
  POP_BANK;
  return next;
}
