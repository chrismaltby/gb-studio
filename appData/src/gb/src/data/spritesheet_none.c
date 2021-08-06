#pragma bank 255

// SpriteSheet: None

#include "gbs_types.h"

BANKREF(spritesheet_none)

const metasprite_t spritesheet_none_metasprite[]  = {
    {metasprite_end}
};

const metasprite_t * const spritesheet_none_metasprites[] = {
    spritesheet_none_metasprite
};

const struct spritesheet_t spritesheet_none = {
    .n_metasprites = 1,
    .metasprites = spritesheet_none_metasprites,
};
