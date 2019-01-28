#pragma bank=10
#include "Map.h"
#include "game.h"
#include "BankData.h"
#include "UI.h"
#include "SpriteHelpers.h"
#include "FadeManager.h"

UINT8 map_bank = 10;

const unsigned char *map;
const unsigned char *map_col;

UBYTE map_width = 32;
UBYTE map_height = 18;
UBYTE emotion_type = 1;
UBYTE emotion_timer = 0;
UBYTE emotion_actor = 1;
const BYTE emotion_offsets[] = {2, 1, 0, -1, -2, -3, -4, -5, -6, -5, -4, -3, -2, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};

UBYTE MapNpcAt_b(UBYTE actor_i, UBYTE tx_a, UBYTE ty_a);
UBYTE MapTriggerAt_b(UBYTE tx_a, UBYTE ty_a);
void MapUpdateActors_b();
void MapHandleInput_b();
void MapRepositionCamera_b();
void MapHandleTrigger_b();
void MapUpdateEmotionBubble_b();

#pragma region initialise

void LoadMap_b()
{
  UBYTE i, j, k, si;
  UWORD ptr;

  DISPLAY_OFF;
  SHOW_SPRITES;

  // Close dialogue window from previous level if still open
  menu_y = MENU_CLOSED_Y;
  menu_dest_y = MENU_CLOSED_Y;
  WX_REG = 7;

  map_index = map_next_index;
  map = map_ptrs[map_index];
  map_width = map_widths[map_index];
  map_height = map_heights[map_index];
  map_col = map_col_ptrs[map_index];

  // Init player
  actors[0].redraw = TRUE;
  actors[0].pos.x = map_next_pos.x;
  actors[0].pos.y = map_next_pos.y;
  actors[0].dir.x = map_next_dir.x;
  actors[0].dir.y = map_next_dir.y;
  actors[0].moving = FALSE;
  // actors[0].enabled = TRUE;

  // Initialize the background graphics
  SetBankedBkgData(tile_banks[map_index], 0, 192, map_tiles_ptrs[map_index]);
  SetBankedBkgTiles(map_banks[map_index], 0, 0, map_width, map_height, map);

  LOG("LOAD SPRITES %d\n", map_sprites_len[map_index]);

  SpritesReset();

  // Load Player Sprite
  SetBankedSpriteData(3, 0, 24, village_sprites);

  k = 24;
  for (i = 0; i != map_sprites_len[map_index]; i++) {
    LOG("LOAD SPRITE %d\n", i);
    ptr = (UWORD) map_sprites[map_index] + i;
    // j = *(UBYTE *) ptr;
    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    LOG("j=%d\n", j);
    ptr = (UWORD) sprite_ptrs[j];
    // ptr = (UWORD) cat_sprite;
    j = sprite_len[j] << 2;
    SetBankedSpriteData(7, k, j, ptr);
    // SetBankedSpriteData(7, k, k + j, ptr);
    // SetBankedSpriteData(7, k, k + j, ptr);
    // SetBankedSpriteData(0, k, k + j, ptr);

    k += j;
  }

  LOG("LOAD ACTORS %d\n", map_actors_len[map_index]);
  map_actor_num = map_actors_len[map_index] + 1;
  for (i = 1; i != map_actors_len[map_index] + 1; i++) {
    LOG("LOAD ACTOR %d\n", i);

    // 0 - Sprite
    ptr = (UWORD) map_actors[map_index] + ((i - 1) << 3);
    // j = *(UBYTE *) ptr;
    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    LOG("j=%d\n", j);

    actors[i].sprite = j;
    actors[i].redraw = TRUE;
    actors[i].enabled = TRUE;

    // 1 - Type
    ptr++;
    // j = *(UBYTE *) ptr; 
    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    LOG("animated j=%d\n", j);
    actors[i].animated = FALSE; // WTF needed 
    actors[i].animated = j;

    // 2 - X Pos
    ptr++;
    // j = *(UBYTE *) ptr;  
    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    LOG("x=%d\n", j);
    actors[i].pos.x = (j << 3) + 8;

    // 3 - Y Pos
    ptr++;
    // j = *(UBYTE *) ptr;      
    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    LOG("y=%d\n", j);
    actors[i].pos.y = (j << 3) + 8;

    // 4 -  Direction
    ptr++;
    // j = *(UBYTE *) ptr;      
    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    LOG("direction=%d\n", j);
    actors[i].dir.x = j == 2 ? -1 : j == 4 ? 1 : 0;
    actors[i].dir.y = j == 8 ? -1 : j == 1 ? 1 : 0;

    // 5 - Movement Type
    ptr++;
    // j = *(UBYTE *) ptr;    
    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    // actors[i].movement_type = AI_RANDOM_FACE;        
    actors[i].movement_type = 0;        // WTF needed        
    actors[i].movement_type = j;


    // 6 - Script Hi
    ptr++;
    // j = *(UBYTE *) ptr;      
    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    LOG("hi=%d\n", j);
    // 7 - Script Lo
    ptr++;
    actors[i].script_ptr =
      (UWORD) ((j * 256) + (ReadBankedUBYTE(map_banks[map_index], ptr)));

    // actors[i].script_ptr = (UWORD) ((j*256) + (*(UBYTE *) ptr));

    // j = *(UBYTE *) ptr;      
    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    LOG("lo=%d\n", j);

  }

  // Hide unused Sprites
  for (i = map_actor_num; i != MAX_ACTORS; i++) {
    move_sprite((i << 1), 0, 0);
    move_sprite((i << 1) + 1, 0, 0);
  }

  LOG("LOAD TRIGGERS %d\n", map_triggers_len[map_index]);
  map_trigger_num = map_triggers_len[map_index];
  for (i = 0; i != map_triggers_len[map_index] + 1; i++) {
    LOG("LOAD TRIGGER %d\n", i);

    // 0 - X Pos
    ptr = (UWORD) map_triggers[map_index] + (i * 7);
    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    // j = *(UBYTE *) ptr;  
    LOG("x=%d\n", j);
    triggers[i].pos.x = j;

    // 1 - Y Pos
    ptr++;
    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    // j = *(UBYTE *) ptr;      
    LOG("y=%d\n", j);
    triggers[i].pos.y = 0;
    triggers[i].pos.y = j;

    // 2 - Width
    ptr++;
    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    // j = *(UBYTE *) ptr;  
    LOG("w=%d\n", j);
    triggers[i].w = 0;
    triggers[i].w = j;

    // 3 - Height
    ptr++;
    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    // j = *(UBYTE *) ptr;      
    LOG("h=%d\n", j);
    triggers[i].h = 0;
    triggers[i].h = j;

    // 4 -  Type
    ptr++;
    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    // j = *(UBYTE *) ptr;      
    LOG("type=%d\n", j);

    // 5 - Script Hi
    ptr++;
    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    // j = *(UBYTE *) ptr;      
    LOG("hi=%d\n", j);
    // 6 - Script Lo
    ptr++;
    triggers[i].script_ptr =
      (UWORD) ((j * 256) + (ReadBankedUBYTE(map_banks[map_index], ptr)));
    // triggers[i].script_ptr = (UWORD) ((j*256) + (*(UBYTE *) ptr));

    j = ReadBankedUBYTE(map_banks[map_index], ptr);
    // j = *(UBYTE *) ptr;      
    LOG("lo=%d\n", j);

  }

  // Reset vars
  first_frame_on_tile = FALSE;
  camera_settings = CAMERA_LOCK_FLAG;

  MapRepositionCamera_b();
  MapHandleTrigger_b();


  SetBankedSpriteData(3, 124, 4, emotion_sprites + (64*4));
  set_sprite_tile(38, 124);
  set_sprite_tile(39, 126);
  move_sprite(38, 48, 104);
  move_sprite(39, 56, 104);

  emotion_timer = 0;

  FadeIn();

  DISPLAY_ON;
}

#pragma endregion

void MapRepositionCamera_b()
{
  if ((camera_settings & CAMERA_LOCK_FLAG) == CAMERA_LOCK_FLAG) {
    if (actors[0].pos.x < SCREEN_WIDTH_HALF) {
      camera_dest.x = 0;
    } else if (actors[0].pos.x > (map_width << 3) - SCREEN_WIDTH_HALF) {
      camera_dest.x = (map_width << 3) - SCREEN_WIDTH;
    } else {
      camera_dest.x = actors[0].pos.x - SCREEN_WIDTH_HALF;
    }
    if (actors[0].pos.y < SCREEN_HEIGHT_HALF) {
      camera_dest.y = 0;
    } else if (actors[0].pos.y > (map_height << 3) - SCREEN_HEIGHT_HALF) {
      camera_dest.y = (map_height << 3) - SCREEN_HEIGHT;
    } else {
      camera_dest.y = actors[0].pos.y - SCREEN_HEIGHT_HALF;
    }
  }

  if ((camera_settings & CAMERA_TRANSITION_FLAG) == CAMERA_TRANSITION_FLAG) {
    if ((time & (camera_settings & CAMERA_SPEED_MASK)) == 0) {
      if (camera_dest.x < SCX_REG) {
        SCX_REG--;
      } else if (camera_dest.x > SCX_REG) {
        SCX_REG++;
      }
      if (camera_dest.y < SCY_REG) {
        SCY_REG--;
      } else if (camera_dest.y > SCY_REG) {
        SCY_REG++;
      }
    }
  } else {
    SCX_REG = camera_dest.x;
    SCY_REG = camera_dest.y;
  }

  if (((last_fn == script_cmd_camera_move)
       || (last_fn == script_cmd_camera_lock)) && SCX_REG == camera_dest.x
      && SCY_REG == camera_dest.y) {
    script_action_complete = TRUE;
    camera_settings &= ~CAMERA_TRANSITION_FLAG; // Remove transition flag
  }
}

void MapUpdate_b()
{
  MapHandleInput_b();

  if (IS_FRAME_16) {
    frame_offset = !frame_offset;
  }
  // Handle Wait
  if (wait_time != 0) {
    wait_time--;
    if (wait_time == 0) {
      script_action_complete = TRUE;
    }
  }

  MapUpdateActors_b();
  UIUpdate();

  // Handle Shake
  if (shake_time != 0) {
    shake_time--;
    SCX_REG += shake_time & 0x5;
    if (shake_time == 0) {
      script_action_complete = TRUE;
    }
  }  

  // Handle map switch
  if (map_index != map_next_index && !IsFading()) {
    map_index = map_next_index;
    LoadMap();
  }
}

void MapUpdateActorMovement_b(UBYTE i)
{
  UWORD tile;
  UWORD tile_offset;
  UBYTE tile_index_data;
  UBYTE tile_bit_mask;
  UBYTE next_tx, next_ty;
  UBYTE npc;
  UBYTE letter;

  if (update_actor_dir.x == 0 && update_actor_dir.y == 0) {
    actors[i].moving = FALSE;
  } else {
    if (actors[i].dir.x != update_actor_dir.x
        || actors[i].dir.y != update_actor_dir.y) {
      actors[i].dir.x = update_actor_dir.x;
      actors[i].dir.y = update_actor_dir.y;
      actors[i].redraw = TRUE;
    }
    actors[i].moving = TRUE;
  }

  if (actors[i].moving && !script_ptr) {
    next_tx = (actors[i].pos.x >> 3) + actors[i].dir.x;
    next_ty = (actors[i].pos.y >> 3) + actors[i].dir.y;

    npc = MapNpcAt_b(i, next_tx, next_ty);
    if (npc != map_actor_num) {
      actors[i].moving = FALSE;
    }

    if (map_col) {
      // Left tile
      tile = ((UWORD) map_col) + ((next_tx - 1) + (next_ty - 1) * map_width);
      tile_index_data = ReadBankedUBYTE(map_banks[map_index], tile);

      if (tile_index_data) {
        actors[i].moving = FALSE;
      }
      // Right tile
      tile =
        ((UWORD) map_col) + ((next_tx - 1) + (next_ty - 1) * map_width + 1);
      tile_index_data = ReadBankedUBYTE(map_banks[map_index], tile);

      if (tile_index_data) {
        actors[i].moving = FALSE;
      }
    }
  }
}


UBYTE MapNpcAt_b(UBYTE actor_i, UBYTE tx_a, UBYTE ty_a)
{
  UBYTE i, tx_b, ty_b;
  for (i = 0; i != map_actor_num; i++) {
    if (i == actor_i) {
      continue;
    }
    // LOG("NPC i=%d @ [%d,%d]\n", i, actors[i].pos.x >> 3, actors[i].pos.y >> 3);
    tx_b = actors[i].pos.x >> 3;
    ty_b = actors[i].pos.y >> 3;
    if ((ty_a == ty_b || ty_a == ty_b - 1) &&
        (tx_a == tx_b || tx_a == tx_b + 1 || tx_a + 1 == tx_b)
      ) {
      return i;
    }
  }

  return map_actor_num;
}

UBYTE MapTriggerAt_b(UBYTE tx_a, UBYTE ty_a)
{
  UBYTE i, tx_b, ty_b, tx_c, ty_c;

  for (i = 0; i != map_trigger_num; i++) {
    // tx_b = 0;
    tx_b = triggers[i].pos.x;
    // ty_b = 0;
    ty_b = triggers[i].pos.y + 1;
    // tx_c = 0;
    tx_c = tx_b + triggers[i].w;
    // ty_c = 0;
    ty_c = ty_b + triggers[i].h - 1;

    // LOG("tx_a=%d tx_b=%d tx_c=%d\n", tx_a, tx_b, tx_c);
    // LOG("ty_a=%d ty_b=%d ty_c=%d\n", ty_a, ty_b, ty_c);
    if (tx_a >= tx_b && tx_a <= tx_c && ty_a >= ty_b && ty_a <= ty_c) {
      // if ((ty_a >= ty_b && ty_a <= ty_c) &&
      //     (tx_a >= tx_b && tx_a <= tx_c)
      //   ) {
      LOG("hit!\n");
      return i;
    }
  }

  return map_trigger_num;
}

void MapHandleInput_b()
{
  UWORD tile, tile_offset;
  UBYTE tile_index_data;
  // UBYTE tile;
  UBYTE next_tx, next_ty;
  UBYTE npc;

  // If menu open - check if A pressed to close
  if (menu_y == MENU_OPEN_Y && (joy & J_A) && !(prev_joy & J_A)) {
    if (!text_drawn) {
      draw_text(TRUE);
    } else {
      menu_dest_y = MENU_CLOSED_Y;
      if (last_fn == script_cmd_line) {
        script_action_complete = TRUE;
      }
    }
  }
  // If player between tiles can't handle input
  if (!ACTOR_ON_TILE(0)) {
    return;
  }
  // Can't move while menu open
  if (menu_y != MENU_CLOSED_Y) {
    return;
  }

  // Can't move if emoting
  if (emotion_timer != 0) {
    return;
  }

  // Can't move while script is running
  if (script_ptr || IsFading()) {
    actors[0].moving = FALSE;
    return;
  }

  if ((joy & J_A) && !(prev_joy & J_A)) {
    actors[0].moving = FALSE;
    next_tx = (actors[0].pos.x >> 3) + actors[0].dir.x;
    next_ty = (actors[0].pos.y >> 3) + actors[0].dir.y;
    npc = MapNpcAt_b(0, next_tx, next_ty);
    if (npc != map_actor_num) {
      actors[0].moving = FALSE;
      if (actors[npc].movement_type != NONE) {
        actors[npc].dir.x = -actors[0].dir.x;
        actors[npc].dir.y = -actors[0].dir.y;
      }
      actors[npc].moving = FALSE;
      actors[npc].redraw = TRUE;
      script_actor = npc;
      script_ptr = actors[npc].script_ptr;
    }
  } else if (actors[0].movement_type == PLAYER_INPUT) {
    if (joy & J_LEFT) {
      update_actor_dir.x = -1;
      update_actor_dir.y = 0;
    } else if (joy & J_RIGHT) {
      update_actor_dir.x = 1;
      update_actor_dir.y = 0;
    } else {
      update_actor_dir.x = 0;
      if (joy & J_UP) {
        update_actor_dir.y = -1;
      } else if (joy & J_DOWN) {
        update_actor_dir.y = 1;
      } else {
        update_actor_dir.y = 0;
      }
    }
    MapUpdateActorMovement_b(0);
  }
}


void MapUpdateActors_b()
{
  UBYTE i, flip, frame, sprite_index, x, y, trigger, trigger_tile_offset;
  BYTE r;

  // Handle script move
  if (actor_move_settings & ACTOR_MOVE_ENABLED
      && ((actors[script_actor].pos.x & 7) == 0)
      && ((actors[script_actor].pos.y & 7) == 0)) {
    LOG("TEST posx=%d posy=%d destx=%d desty=%d\n", actors[script_actor].pos.x,
        actors[script_actor].pos.y, actor_move_dest.x, actor_move_dest.y);
    if (actors[script_actor].pos.x == actor_move_dest.x
        && actors[script_actor].pos.y == actor_move_dest.y) {
      actor_move_settings &= ~ACTOR_MOVE_ENABLED;
      script_action_complete = TRUE;
      actors[script_actor].moving = FALSE;
    } else {
      LOG("NOT THERE YET\n");
      if (actors[script_actor].pos.x > actor_move_dest.x) {
        LOG("LEFT\n");
        update_actor_dir.x = -1;
        update_actor_dir.y = 0;
      } else if (actors[script_actor].pos.x < actor_move_dest.x) {
        LOG("RIGHT\n");

        update_actor_dir.x = 1;
        update_actor_dir.y = 0;
      } else {
        update_actor_dir.x = 0;
        if (actors[script_actor].pos.y > actor_move_dest.y) {
          LOG("UP\n");

          update_actor_dir.y = -1;
        } else if (actors[script_actor].pos.y < actor_move_dest.y) {
          LOG("DOWN\n");

          update_actor_dir.y = 1;
        } else {
          update_actor_dir.y = 0;
        }
      }
      MapUpdateActorMovement_b(script_actor);
    }
  }
  // Handle random npc movement
  if (!script_ptr) {
    // LOG("RANDOM BEHAVIOUR--------------\n");
    for (i = 1; i != map_actor_num; i++) {
      if (ACTOR_ON_TILE(i)) {
        // if ((time & 0x3F) == 0) {
        if ((actors[i].movement_type == AI_RANDOM_WALK
             || actors[i].movement_type == AI_RANDOM_FACE)
            && (time & 0x3F) == 0) {
          r = rand();
          // LOG("CHECK RAND MOVEMENT r=%d \n", r);

          if (r > 64) {
            if (actors[i].movement_type == AI_RANDOM_WALK) {
              LOG("UPDATE MOVEMENT x=%d y=%d\n", actors[i].dir.x,
                  actors[i].dir.y);
              update_actor_dir.x = actors[i].dir.x;
              update_actor_dir.y = actors[i].dir.y;
              MapUpdateActorMovement_b(i);
            }
          } else if (r > 0) {
            r = rand();
            actors[i].dir.x = (r > 0) - (r < 0);
            actors[i].dir.y = 0;
            actors[i].redraw = TRUE;
          } else if (r > -64) {
            r = rand();
            actors[i].dir.x = 0;
            actors[i].dir.y = (r > 0) - (r < 0);
            actors[i].redraw = TRUE;
          }
        } else {
          actors[i].moving = FALSE;
        }
      }
    }
  }

  for (i = 0; i != map_actor_num; i++) {

    // If running script only update script actor - Unless needs redraw
    if (script_ptr && i != script_actor && !actors[i].redraw) {
      continue;
    }

    if ((actors[i].moving && ((actors[i].pos.x & 7) == 0)
         && ((actors[i].pos.y & 7) == 0)) || actors[i].redraw) {

      LOG("REDRAW %d x=%d y=%d\n", i, actors[i].dir.x, actors[i].dir.y);
      flip = FALSE;
      frame = actors[i].sprite;

      sprite_index = i << 1;

      if (actors[i].moving && actors[i].animated) {
        LOG("REDRAW a \n");
        frame += ((actors[i].pos.x >> 4) & 1) == ((actors[i].pos.y >> 4) & 1);
      }
      // Increase frame based on facing direction
      if (actors[i].dir.y < 0) {
        LOG("REDRAW b \n");
        frame += 1 + actors[i].animated;
      } else if (actors[i].dir.x < 0) {
        LOG("REDRAW c\n");
        flip = TRUE;
        frame += 2 + actors[i].animated + actors[i].animated;
      } else if (actors[i].dir.x > 0) {
        LOG("REDRAW d \n");
        frame += 2 + actors[i].animated + actors[i].animated;
      }
      // Handle facing left
      if (flip) {
        set_sprite_prop(sprite_index, S_FLIPX);
        set_sprite_prop(sprite_index + 1, S_FLIPX);
        set_sprite_tile(sprite_index, (frame << 2) + 2);
        set_sprite_tile(sprite_index + 1, frame << 2);
      } else {
        set_sprite_prop(sprite_index, 0x0);
        set_sprite_prop(sprite_index + 1, 0x0);
        set_sprite_tile(sprite_index, frame << 2);
        set_sprite_tile(sprite_index + 1, (frame << 2) + 2);
      }

      actors[i].redraw = FALSE;
    }
    // Move actors
    if (actors[i].moving) {
      actors[i].pos.x += actors[i].dir.x;
      actors[i].pos.y += actors[i].dir.y;
    }
  }

  MapHandleTrigger_b();

  // Position Camera
  MapRepositionCamera_b();

  // Position Sprites
  for (i = 0; i != map_actor_num; i++) {
    // Position actors
    x = actors[i].pos.x - SCX_REG;
    y = actors[i].pos.y - SCY_REG;

    // If sprite not under menu position it, otherwise hide
    if (actors[i].enabled && (y < menu_y + 16 || menu_y == MENU_CLOSED_Y)) {
      move_sprite((i << 1), x, y);
      move_sprite((i << 1) + 1, x + 8, y);
    } else {
      move_sprite((i << 1), 0, 0);
      move_sprite((i << 1) + 1, 0, 0);
    }
  }

  MapUpdateEmotionBubble_b();
}

void MapUpdateEmotionBubble_b()
{
  UBYTE x, y;

  if(emotion_timer > 0) {
    x = actors[emotion_actor].pos.x - SCX_REG;
    y = actors[emotion_actor].pos.y - 16 - SCY_REG;

    if(emotion_timer<15) {
      y += emotion_offsets[emotion_timer];
    }

    move_sprite(38, x, y);
    move_sprite(39, x+8, y);

    emotion_timer++;
    if(emotion_timer > 60) {
      emotion_timer = 0;
    }
  } else {
    move_sprite(38, 0, 0);
    move_sprite(39, 0, 0);    
  }  
}

void MapHandleTrigger_b()
{
  UBYTE trigger, trigger_tile_offset;

  if (((actors[0].pos.x & 7) == 0)
      && (((actors[0].pos.y & 7) == 0) || actors[0].pos.y == 254)) {

    if (!first_frame_on_tile) {

      // If at bottom of map offset tile lookup by 1 (look at tile 32 rather than 31)
      trigger_tile_offset = actors[0].pos.y == 254;

      LOG("ON TILE %d %d\n", actors[0].pos.x >> 3, actors[0].pos.y >> 3);
      first_frame_on_tile = TRUE;

      trigger =
        MapTriggerAt_b(actors[0].pos.x >> 3,
                       trigger_tile_offset + (actors[0].pos.y >> 3));
      if (trigger != map_trigger_num) {
        actors[0].moving = FALSE;
        script_actor = 0;
        script_ptr = triggers[trigger].script_ptr;
      }
    }
  } else {
    first_frame_on_tile = FALSE;
  }
}

void MapSetEmotion_b(UBYTE actor, UBYTE type)
{
  move_sprite(38, 0, 0);
  move_sprite(39, 0, 0);   
  SetBankedSpriteData(3, 124, 4, emotion_sprites + (type*64)); 
  emotion_timer = 1;
  emotion_actor = actor;
}

UBYTE IsEmoting_b()
{
  return emotion_timer > 0;
}
