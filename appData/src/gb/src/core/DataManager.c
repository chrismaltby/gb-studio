#include "DataManager.h"

#include "Actor.h"
#include "BankManager.h"
#include "Palette.h"
#include "Scroll.h"
#include "Sprite.h"
#include "Trigger.h"
#include "data_ptrs.h"

BANK_PTR bank_ptr;
UBYTE image_bank;
UBYTE image_attr_bank;
UBYTE collision_bank;
unsigned char *image_ptr;
unsigned char *image_attr_ptr;
unsigned char *collision_ptr;
UBYTE image_tile_width;
UBYTE image_tile_height;
UINT16 image_width;
UINT16 image_height;
UBYTE sprites_len;
UBYTE actors_len;
UBYTE scene_type;
BankPtr scene_events_start_ptr;

void LoadTiles(UINT16 index) {
  UBYTE bank, size;
  UBYTE *data_ptr;

  PUSH_BANK(DATA_PTRS_BANK);
  bank = tileset_bank_ptrs[index].bank;
  data_ptr = (UBYTE *)(tileset_bank_ptrs[index].offset + (BankDataPtr(bank)));
  POP_BANK;

  PUSH_BANK(bank);
  size = *(data_ptr++);
  set_bkg_data(0, size, data_ptr);
  POP_BANK;
}

void LoadUI() {
  UBYTE *data_ptr;

  PUSH_BANK(DATA_PTRS_BANK);
  data_ptr = BankDataPtr(FRAME_BANK) + FRAME_BANK_OFFSET;
  POP_BANK;

  PUSH_BANK(FRAME_BANK);
  set_bkg_data(192, 9, data_ptr);
  POP_BANK;

  // @todo REMOVE FROM HERE
  PUSH_BANK(DATA_PTRS_BANK);
  data_ptr = BankDataPtr(FONT_BANK) + FONT_BANK_OFFSET;
  POP_BANK;

  PUSH_BANK(FONT_BANK);
  set_bkg_data(203, 64, data_ptr + 256);
  // set_bkg_data(201, 64, data_ptr);
  POP_BANK;
  // @todo REMOVE TO HERE
}

void LoadImage(UINT16 index) {
  UBYTE *data_ptr;

  PUSH_BANK(DATA_PTRS_BANK);
  image_bank = background_bank_ptrs[index].bank;
  data_ptr = (UBYTE *)(background_bank_ptrs[index].offset + (BankDataPtr(image_bank)));
  POP_BANK;

  PUSH_BANK(image_bank);

  LoadTiles(*(data_ptr++));

  image_tile_width = *(data_ptr++);
  image_tile_height = *(data_ptr++);
  image_width = image_tile_width * 8;
  image_height = image_tile_height * 8;
  image_ptr = data_ptr;

  POP_BANK;
}

void LoadImageAttr(UINT16 index) {
#ifdef CGB
  UBYTE i;
#endif

  PUSH_BANK(DATA_PTRS_BANK);
  image_attr_bank = background_attr_bank_ptrs[index].bank;
  image_attr_ptr =
      (unsigned char *)(background_attr_bank_ptrs[index].offset + (BankDataPtr(image_attr_bank)));
  POP_BANK;

  PUSH_BANK(image_attr_bank);
#ifdef CGB
  VBK_REG = 1;
  for (i = 0; i != 21; i++) {
    set_bkg_tiles(0, i, 22, 1, image_attr_ptr + (i * image_tile_width));
  }
  VBK_REG = 0;
#endif
  POP_BANK;
}

void LoadPalette(UINT16 index) {
  UBYTE bank;
  UBYTE *data_ptr;

  PUSH_BANK(DATA_PTRS_BANK);
  bank = palette_bank_ptrs[index].bank;
  data_ptr = (UBYTE *)(palette_bank_ptrs[index].offset + (BankDataPtr(bank)));
  POP_BANK;

  PUSH_BANK(bank);
  memcpy(BkgPalette, data_ptr, 48);
  // data_ptr += 64;
  // memcpy(SprPalette, data_ptr, 64);
  POP_BANK;
}

void LoadSpritePalette(UINT16 index) {
  UBYTE bank;
  UBYTE *data_ptr;

  PUSH_BANK(DATA_PTRS_BANK);
  bank = palette_bank_ptrs[index].bank;
  data_ptr = (UBYTE *)(palette_bank_ptrs[index].offset + (BankDataPtr(bank)));
  POP_BANK;

  PUSH_BANK(bank);
  memcpy(SprPalette, data_ptr, 64);
  POP_BANK;
}

UBYTE LoadSprite(UINT16 index, UBYTE sprite_offset) {
  UBYTE bank, size;
  UBYTE *data_ptr;

  PUSH_BANK(DATA_PTRS_BANK);
  bank = sprite_bank_ptrs[index].bank;
  data_ptr = (UBYTE *)(sprite_bank_ptrs[index].offset + (BankDataPtr(bank)));
  POP_BANK;

  PUSH_BANK(bank);
  size = *(data_ptr++) * 4;
  set_sprite_data(sprite_offset, size, data_ptr);
  POP_BANK;

  return size;
}

void LoadScene(UINT16 index) {
  UBYTE bank, i, k;
  UBYTE *data_ptr;

  PUSH_BANK(DATA_PTRS_BANK);
  bank = scene_bank_ptrs[index].bank;
  data_ptr = (scene_bank_ptrs[index].offset + (BankDataPtr(bank)));

  collision_bank = collision_bank_ptrs[index].bank;
  collision_ptr =
      (unsigned char *)(collision_bank_ptrs[index].offset + (BankDataPtr(collision_bank)));
  POP_BANK;

  SpritePoolReset();

  PUSH_BANK(bank);
  LoadImage((*(data_ptr++) * 256) + *(data_ptr++));
  LoadImageAttr(index);
  LoadPalette((*(data_ptr++) * 256) + *(data_ptr++));
  LoadSpritePalette((*(data_ptr++) * 256) + *(data_ptr++));

  scene_type = (*(data_ptr++)) + 1;
  sprites_len = *(data_ptr++);
  actors_len = (*(data_ptr++)) + 1;
  triggers_len = *(data_ptr++);

  scene_events_start_ptr.bank = *(data_ptr++);
  scene_events_start_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);

  // Load sprites
  k = 24;
  for (i = 0; i != sprites_len; i++) {
    k += LoadSprite((*(data_ptr++) * 256) + *(data_ptr++), k);
  }

  // Load actors
  for (i = 1; i != actors_len; i++) {
    UBYTE j;

    actors[i].sprite = *(data_ptr++);
    actors[i].palette_index = *(data_ptr++);
    actors[i].enabled = TRUE;
    actors[i].collisionsEnabled = TRUE;
    actors[i].moving = FALSE;
    actors[i].sprite_type = *(data_ptr++);
    actors[i].frames_len = *(data_ptr++);
    actors[i].animate = *(data_ptr++);
    actors[i].frame = actors[i].animate >> 1;
    actors[i].pos.x = *(data_ptr++) * 8;
    actors[i].pos.y = *(data_ptr++) * 8;
    actors[i].start_pos.x = actors[i].pos.x;
    actors[i].start_pos.y = actors[i].pos.y;

    j = *(data_ptr++);
    actors[i].dir.x = j == 2 ? -1 : j == 4 ? 1 : 0;
    actors[i].dir.y = j == 8 ? -1 : j == 1 ? 1 : 0;

    actors[i].movement_type = *(data_ptr++);
    actors[i].move_speed = *(data_ptr++);
    actors[i].anim_speed = *(data_ptr++);

    actors[i].events_ptr.bank = *(data_ptr++);
    actors[i].events_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);
  }

  actors_active[0] = 0;
  actors_active_size = 1;

  // Load triggers
  for (i = 0; i != triggers_len; i++) {
    triggers[i].x = *(data_ptr++);
    triggers[i].y = *(data_ptr++);
    triggers[i].w = *(data_ptr++);
    triggers[i].h = *(data_ptr++);
    data_ptr++;  // Trigger type
    triggers[i].events_ptr.bank = *(data_ptr++);
    triggers[i].events_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);
  }

  // Initialise scene
  InitPlayer();
  InitScroll();

  POP_BANK;
}
