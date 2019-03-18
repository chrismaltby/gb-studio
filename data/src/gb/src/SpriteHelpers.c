#include "SpriteHelpers.h"

void SpritesReset()
{
  UBYTE i;

  for (i = 0; i != 40; i++) {
    move_sprite(i, 0, 0);
    set_sprite_prop(i, 0);
  }
}
