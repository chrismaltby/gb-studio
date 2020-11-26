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
#include "BankData.h"
#include "VM.h"
#include "scene_0.h"

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

// @todo Change LoadScene to take far_ptr to scene rather than scene index
void LoadScene(UINT16 index) {
  UBYTE bank, i, k;
  UBYTE* data_ptr;
  const scene_t* scene;
  const actor_t* scene_actors;
  const trigger_t* scene_triggers;
  const tileset_t* tiles;
  const background_t* background;
  const far_ptr_t far_background;
  const far_ptr_t far_tileset;
  const far_ptr_t far_scene_actors;
  const far_ptr_t far_scene_triggers;
  const far_ptr_t far_scene = TO_FAR_PTR(scene_0);

  SpritePoolReset();
  ScriptCtxPoolReset();

  // Load scene
  SWITCH_ROM_MBC1(far_scene.bank);
  scene = (scene_t*)far_scene.ptr;
  far_background = scene->background;
  far_scene_actors = scene->actors;
  far_scene_triggers = scene->triggers;
  scene_type = 1;
  actors_len = 1;
  triggers_len = 0;//scene->n_triggers;
  collision_bank = scene->collisions.bank; 
  collision_ptr = scene->collisions.ptr;
  image_attr_bank = scene->colors.bank; 
  image_attr_ptr = scene->colors.ptr;

  // Load background
  SWITCH_ROM_MBC1(far_background.bank);
  background = (background_t*)far_background.ptr;
  image_bank = far_background.bank;
  image_tile_width = background->width;
  image_tile_height = background->height;
  image_width = image_tile_width * 8;
  scroll_x_max = image_width - ((UINT16)SCREENWIDTH);
  image_height = image_tile_height * 8;
  scroll_y_max = image_height - ((UINT16)SCREENHEIGHT);
  image_ptr = background->tiles;  
  far_tileset = background->tileset;

  // Load tiles
  SWITCH_ROM_MBC1(far_tileset.bank);
  tiles = (tileset_t*)far_tileset.ptr;
  set_bkg_data(0, tiles->n_tiles, tiles->tiles);

  // // Load actors
  // if (actors_len != 0) {
  //   SWITCH_ROM_MBC1(far_scene_actors.bank);
  //   scene_actors = (actor_t*)far_scene_actors.ptr;
  //   for(i=0; i != actors_len; i++) {
  //     actors[i + 1].pos.x = scene_actors->x;
  //     actors[i + 1].pos.y = scene_actors->y;
  //     scene_actors += sizeof(actor_t);
  //   }
  // }
  actors_active[0] = 0;
  actors_active_size = 1;

  // Load triggers
  if (triggers_len != 0) {
    SWITCH_ROM_MBC1(far_scene_triggers.bank);
    scene_triggers = (trigger_t*)far_scene_triggers.ptr;
    for(i=0; i != triggers_len; i++) {
      triggers[i].x = scene_triggers->x;
      triggers[i].y = scene_triggers->y;
      triggers[i].w = scene_triggers->width;
      triggers[i].h = scene_triggers->height;
      scene_triggers += sizeof(trigger_t);
    }
  }

  UIReset();
  RemoveInputScripts();
  ProjectilesInit();
  InitPlayer();
  InitScroll();
}
