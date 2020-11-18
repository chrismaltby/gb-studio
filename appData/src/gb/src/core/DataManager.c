#include "DataManager.h"

#include <stdio.h>
#include <string.h>
#include "Actor.h"
#include "BankManager.h"
#include "Palette.h"
#include "Projectiles.h"
#include "ScriptRunner.h"
#include "Scroll.h"
#include "Sprite.h"
#include "Trigger.h"
#include "UI.h"
#include "Input.h"
#include "data_ptrs.h"

#define MAX_PLAYER_SPRITE_SIZE 24

BankPtr bank_ptr;
UBYTE image_bank;
UBYTE image_attr_bank;
UBYTE collision_bank;
unsigned char* image_ptr;
unsigned char* image_attr_ptr;
unsigned char* collision_ptr;
UBYTE image_tile_width;
UBYTE image_tile_height;
UINT16 image_width;
UINT16 image_height;
UBYTE sprites_len;
UBYTE actors_len = 0;
UBYTE scene_type;
BankPtr scene_events_start_ptr;

void LoadTiles(UINT16 index) {
  UBYTE bank, size;
  UBYTE* data_ptr;

  PUSH_BANK(DATA_PTRS_BANK);
  bank = tileset_bank_ptrs[index].bank;
  data_ptr = (UBYTE*)(tileset_bank_ptrs[index].offset + (BankDataPtr(bank)));
  POP_BANK;

  PUSH_BANK(bank);
  size = *(data_ptr++);
  set_bkg_data(0, size, data_ptr);
  POP_BANK;
}

void LoadImage(UINT16 index) {
  UBYTE* data_ptr;

  PUSH_BANK(DATA_PTRS_BANK);
  image_bank = background_bank_ptrs[index].bank;
  data_ptr = (UBYTE*)(background_bank_ptrs[index].offset + (BankDataPtr(image_bank)));
  POP_BANK;

  PUSH_BANK(image_bank);

  LoadTiles(*(data_ptr++));

  image_tile_width = *(data_ptr++);
  image_tile_height = *(data_ptr++);
  image_width = image_tile_width * 8;
  scroll_x_max = image_width - ((UINT16)SCREENWIDTH);
  image_height = image_tile_height * 8;
  scroll_y_max = image_height - ((UINT16)SCREENHEIGHT);
  image_ptr = data_ptr;

  POP_BANK;
}

void LoadImageAttr(UINT16 index) {
  PUSH_BANK(DATA_PTRS_BANK);
  image_attr_bank = background_attr_bank_ptrs[index].bank;
  image_attr_ptr =
      (unsigned char*)(background_attr_bank_ptrs[index].offset + (BankDataPtr(image_attr_bank)));
  POP_BANK;
}

void LoadPalette(UINT16 index) {
  UBYTE bank;
  UBYTE* data_ptr;

  PUSH_BANK(DATA_PTRS_BANK);
  bank = palette_bank_ptrs[index].bank;
  data_ptr = (UBYTE*)(palette_bank_ptrs[index].offset + (BankDataPtr(bank)));
  POP_BANK;

  PUSH_BANK(bank);
  if (palette_update_mask == 0x3F) {
    memcpy(BkgPalette, data_ptr, 48);
  } else {
    if (palette_update_mask & 0x1) {
      memcpy(BkgPalette, data_ptr, 8);
    }
    if (palette_update_mask & 0x2) {
      memcpy(BkgPalette + 4, data_ptr + 8, 8);
    }
    if (palette_update_mask & 0x4) {
      memcpy(BkgPalette + 8, data_ptr + 16, 8);
    }
    if (palette_update_mask & 0x8) {
      memcpy(BkgPalette + 12, data_ptr + 24, 8);
    }    
    if (palette_update_mask & 0x10) {
      memcpy(BkgPalette + 16, data_ptr + 32, 8);
    }    
    if (palette_update_mask & 0x20) {
      memcpy(BkgPalette + 20, data_ptr + 40, 8);
    }            
  }  POP_BANK;
}

void LoadUIPalette(UINT16 index) {
  UBYTE bank;
  UBYTE* data_ptr;

  PUSH_BANK(DATA_PTRS_BANK);
  bank = palette_bank_ptrs[index].bank;
  data_ptr = (UBYTE*)(palette_bank_ptrs[index].offset + (BankDataPtr(bank)));
  POP_BANK;

  PUSH_BANK(bank);
  memcpy(BkgPalette + UI_PALETTE_OFFSET, data_ptr, 8);
  POP_BANK;
}

void LoadSpritePalette(UINT16 index) {
  UBYTE bank;
  UBYTE* data_ptr;

  PUSH_BANK(DATA_PTRS_BANK);
  bank = palette_bank_ptrs[index].bank;
  data_ptr = (UBYTE*)(palette_bank_ptrs[index].offset + (BankDataPtr(bank)));
  POP_BANK;

  PUSH_BANK(bank);
  memcpy(SprPalette, data_ptr, 56);
  POP_BANK;
}

void LoadPlayerSpritePalette(UINT16 index) {
  UBYTE bank;
  UBYTE* data_ptr;

  PUSH_BANK(DATA_PTRS_BANK);
  bank = palette_bank_ptrs[index].bank;
  data_ptr = (UBYTE*)(palette_bank_ptrs[index].offset + (BankDataPtr(bank)));
  POP_BANK;

  PUSH_BANK(bank);
  memcpy(SprPalette + PLAYER_PALETTE_OFFSET, data_ptr, 8);
  POP_BANK;
}

UBYTE LoadSprite(UINT16 index, UBYTE sprite_offset) {
  UBYTE bank, sprite_frames, size, load_size;
  UBYTE* data_ptr;

  PUSH_BANK(DATA_PTRS_BANK);
  bank = sprite_bank_ptrs[index].bank;
  data_ptr = (UBYTE*)(sprite_bank_ptrs[index].offset + (BankDataPtr(bank)));
  POP_BANK;

  PUSH_BANK(bank);
  sprite_frames = *(data_ptr++);
  size = sprite_frames * 4;

  if (sprite_offset == 0 && sprite_frames > 6) {
    load_size = MAX_PLAYER_SPRITE_SIZE;
  } else {
    load_size = size;
  }

  set_sprite_data(sprite_offset, load_size, data_ptr);
  POP_BANK;

  return size;
}

void LoadScene(UINT16 index) {
  UBYTE bank, i, k;
  UBYTE* data_ptr;

  PUSH_BANK(DATA_PTRS_BANK);
  bank = scene_bank_ptrs[index].bank;
  data_ptr = (scene_bank_ptrs[index].offset + (BankDataPtr(bank)));

  collision_bank = collision_bank_ptrs[index].bank;
  collision_ptr =
      (unsigned char*)(collision_bank_ptrs[index].offset + (BankDataPtr(collision_bank)));
  POP_BANK;

  SpritePoolReset();
  ScriptCtxPoolReset();

  PUSH_BANK(bank);
  LoadImage((*(data_ptr++) * 256) + *(data_ptr++));
  LoadImageAttr(index);
  LoadPalette((*(data_ptr++) * 256) + *(data_ptr++));
  LoadSpritePalette((*(data_ptr++) * 256) + *(data_ptr++));
  LoadPlayerSpritePalette(0);
  LoadUIPalette(1);
  UIReset();
  RemoveInputScripts();

  ProjectilesInit();
  InitPlayer();
  
  scene_type = (*(data_ptr++)) + 1;
  sprites_len = (*(data_ptr++)) + 1;
  actors_len = (*(data_ptr++)) + 1;
  triggers_len = *(data_ptr++);

  scene_events_start_ptr.bank = *(data_ptr++);
  scene_events_start_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);

  // Load sprites
  k = 24;
  for (i = 1; i != sprites_len; i++) {
    UBYTE sprite_len = LoadSprite((*(data_ptr++) * 256) + *(data_ptr++), k);
    sprites_info[i].sprite_offset = DIV_4(k);
    sprites_info[i].frames_len = DIV_4(sprite_len);
    if (sprites_info[i].frames_len == 6) {
      sprites_info[i].sprite_type = SPRITE_ACTOR_ANIMATED;
      sprites_info[i].frames_len = 2;
    } else if (sprites_info[i].frames_len == 3) {
      sprites_info[i].sprite_type = SPRITE_ACTOR;
      sprites_info[i].frames_len = 1;
    } else {
      sprites_info[i].sprite_type = SPRITE_STATIC;
    }
    k += sprite_len;
  }

  // Load actors
  for (i = 1; i != actors_len; i++) {
    UBYTE j;

    actors[i].sprite = *(data_ptr++);
    actors[i].palette_index = *(data_ptr++);
    actors[i].enabled = TRUE;
    actors[i].moving = FALSE;
    actors[i].sprite_type = *(data_ptr++);
    actors[i].frames_len = *(data_ptr++);
    actors[i].animate = *(data_ptr++);
    actors[i].frame = actors[i].animate >> 1;
    actors[i].animate = actors[i].animate & 0x1;
    actors[i].pos.x = *(data_ptr++) * 8;
    actors[i].pos.y = *(data_ptr++) * 8;
    actors[i].start_pos.x = actors[i].pos.x;
    actors[i].start_pos.y = actors[i].pos.y;

    j = *(data_ptr++);
    actors[i].dir.x = j == 2 ? -1 : j == 4 ? 1 : 0;
    actors[i].dir.y = j == 8 ? -1 : j == 1 ? 1 : 0;

    actors[i].move_speed = *(data_ptr++);
    actors[i].anim_speed = *(data_ptr++);
    actors[i].pinned = *(data_ptr++);
    actors[i].collision_group = actors[i].pinned >> 1;
    actors[i].pinned = actors[i].pinned & 0x1;

    actors[i].collisionsEnabled = !actors[i].pinned;

    actors[i].events_ptr.bank = *(data_ptr++);
    actors[i].events_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);

    actors[i].movement_ptr.bank = *(data_ptr++);
    actors[i].movement_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);

    actors[i].hit_1_ptr.bank = *(data_ptr++);
    actors[i].hit_1_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);

    actors[i].hit_2_ptr.bank = *(data_ptr++);
    actors[i].hit_2_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);

    actors[i].hit_3_ptr.bank = *(data_ptr++);
    actors[i].hit_3_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);

    actors[i].movement_ctx = 0;
    actors[i].script_control = FALSE;
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

  InitScroll();

  // Reset last trigger
  last_trigger_tx = 0xFF;
  last_trigger_ty = 0xFF;

  player.hit_1_ptr.bank = *(data_ptr++);
  player.hit_1_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);

  player.hit_2_ptr.bank = *(data_ptr++);
  player.hit_2_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);

  player.hit_3_ptr.bank = *(data_ptr++);
  player.hit_3_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);

  // Enable all pinned actors by default
  for (i = 1; i != actors_len; i++) {
    if (actors[i].pinned) {
      ActivateActor(i);
    }
  }

  POP_BANK;
}
