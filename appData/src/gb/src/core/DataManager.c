#include "DataManager.h"

#include <stdio.h>
#include <string.h>
#include "Trigger.h"
#include "Actor.h"
#include "BankManager.h"
#include "Palette.h"
#include "Projectiles.h"
#include "ScriptRunner.h"
#include "Scroll.h"
#include "Sprite.h"
#include "UI.h"
#include "Input.h"
#include "data/data_ptrs.h"
#include "BankData.h"
#include "VM.h"
// #include "data/scene_0.h"

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

#define __BANK_PREFIX(A) __bank_##A
#define TO_FAR_PTR(A) {.bank = (char)&(__BANK_PREFIX(A)), .ptr = (void *)&(A)}
#define TO_FAR_ARGS(T, A) (T)(A).ptr, (A).bank

void LoadTiles(const tileset_t* tiles, UBYTE bank) {
  UBYTE _save = _current_bank;  

  SWITCH_ROM_MBC1(bank);
  set_bkg_data(0, tiles->n_tiles, tiles->tiles);
  SWITCH_ROM_MBC1(_save);  
}

void LoadImage(const background_t *background, UBYTE bank) {
  UBYTE _save = _current_bank;  

  SWITCH_ROM_MBC1(bank);
  image_bank = bank;
  image_tile_width = background->width;
  image_tile_height = background->height;
  image_width = image_tile_width * 8;
  scroll_x_max = image_width - ((UINT16)SCREENWIDTH);
  image_height = image_tile_height * 8;
  scroll_y_max = image_height - ((UINT16)SCREENHEIGHT);
  image_ptr = background->tiles;  

  LoadTiles(background->tileset.ptr, background->tileset.bank);
  SWITCH_ROM_MBC1(_save);
}

void LoadPalette(const UBYTE *data_ptr, UBYTE bank) {
  UBYTE _save = _current_bank;  

  SWITCH_ROM_MBC1(bank);
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
  }
  SWITCH_ROM_MBC1(_save);
}

void LoadUIPalette(const UBYTE *data_ptr, UBYTE bank) {
  UBYTE _save = _current_bank;  
  SWITCH_ROM_MBC1(bank);  
  memcpy(BkgPalette + UI_PALETTE_OFFSET, data_ptr, 8);
  SWITCH_ROM_MBC1(_save);
}

void LoadSpritePalette(const UBYTE *data_ptr, UBYTE bank) {
  UBYTE _save = _current_bank;  
  SWITCH_ROM_MBC1(bank);  
  memcpy(SprPalette, data_ptr, 56);
  SWITCH_ROM_MBC1(_save);
}

void LoadPlayerSpritePalette(const UBYTE *data_ptr, UBYTE bank) {
  UBYTE _save = _current_bank;  
  SWITCH_ROM_MBC1(bank);  
  memcpy(SprPalette + PLAYER_PALETTE_OFFSET, data_ptr, 8);
  SWITCH_ROM_MBC1(_save);
}

UBYTE LoadSprite(UBYTE sprite_offset, const spritesheet_t *sprite, UBYTE bank) {
  UBYTE _save = _current_bank;  
  UBYTE size;

  SWITCH_ROM_MBC1(bank);

  size = sprite->n_frames * 4;

  if (sprite_offset == 0 && sprite->n_frames > 6) {
    size = MAX_PLAYER_SPRITE_SIZE;
  }

  set_sprite_data(sprite_offset, size, sprite->frames);

  SWITCH_ROM_MBC1(_save);
  
  return size;
}

// @todo Change LoadScene to take far_ptr to scene rather than scene index
void LoadScene(const scene_t *scene, UBYTE bank) {
  UBYTE i, k;
  const actor_t* scene_actors;
  const trigger_t* scene_triggers;
  const far_ptr_t* scene_sprite_ptrs;
  far_ptr_t far_scene_actors;
  far_ptr_t far_scene_triggers;
  far_ptr_t far_scene_sprites;

  // Load scene
  SWITCH_ROM_MBC1(bank);
  far_scene_actors = scene->actors;
  far_scene_triggers = scene->triggers;
  far_scene_sprites = scene->sprites;
  scene_type = 1;
  actors_len = scene->n_actors + 1;
  triggers_len = scene->n_triggers;
  sprites_len = scene->n_sprites;
  collision_bank = scene->collisions.bank; 
  collision_ptr = scene->collisions.ptr;
  image_attr_bank = scene->colors.bank; 
  image_attr_ptr = scene->colors.ptr;

  // Load background + tiles
  LoadImage(scene->background.ptr, scene->background.bank);
  LoadPalette(scene->palette.ptr, scene->palette.bank);
  LoadSpritePalette(scene->sprite_palette.ptr, scene->sprite_palette.bank);
  // LoadPlayerSpritePalette(start_player_palette.ptr, start_player_palette.bank);

  SpritePoolReset();
  ScriptCtxPoolReset();
  UIReset();
  RemoveInputScripts();
  ProjectilesInit();
  InitPlayer();

  // Load sprites
  k = 24;
  if (sprites_len != 0) {
    SWITCH_ROM_MBC1(far_scene_sprites.bank);
    scene_sprite_ptrs = far_scene_sprites.ptr;
    for(i = 0; i != sprites_len; i++) {
      UBYTE sprite_len = LoadSprite(k, scene_sprite_ptrs->ptr, scene_sprite_ptrs->bank);
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
      scene_sprite_ptrs++;
    }
  }

  // Load actors
  if (actors_len != 0) {
    SWITCH_ROM_MBC1(far_scene_actors.bank);
    scene_actors = far_scene_actors.ptr;
    for(i = 1; i != actors_len; i++) {
      actors[i].sprite = scene_actors->sprite;
      actors[i].palette_index = scene_actors->palette;
      actors[i].pos.x = 8 * scene_actors->x;
      actors[i].pos.y = 8 * scene_actors->y;
      actors[i].start_pos.x = actors[i].pos.x;
      actors[i].start_pos.y = actors[i].pos.y;
      actors[i].movement_ctx = 0;
      actors[i].enabled = TRUE;
      actors[i].moving = FALSE;
      actors[i].pinned = scene_actors->pinned;
      actors[i].collisionsEnabled = TRUE;
      actors[i].script_control = FALSE;
      actors[i].sprite_type = SPRITE_STATIC;
      actors[i].animate = scene_actors->animate;
      actors[i].anim_speed = scene_actors->anim_speed;
      actors[i].move_speed = scene_actors->move_speed;
      scene_actors++;
    }
  }

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
      scene_triggers++;
    }
  }

  InitScroll();

  // Reset last trigger
  last_trigger_tx = 0xFF;
  last_trigger_ty = 0xFF;

  /*
  player.hit_1_ptr.bank = *(data_ptr++);
  player.hit_1_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);

  player.hit_2_ptr.bank = *(data_ptr++);
  player.hit_2_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);

  player.hit_3_ptr.bank = *(data_ptr++);
  player.hit_3_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);
  */

  // Enable all pinned actors by default
  for (i = 1; i != actors_len; i++) {
    if (actors[i].pinned) {
      ActivateActor(i);
    }
  }

}
