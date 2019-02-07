#pragma bank = 10

#include <stdio.h>
#include <stdlib.h>
#include "game.h"
#include "Scene.h"
#include "UI.h"
#include "BankData.h"
#include "FadeManager.h"
#include "SpriteHelpers.h"
#include "Macros.h"
#include "data_ptrs.h"
#include "banks.h"

UINT8 scene_bank = 10;

UBYTE scene_width = 32;
UBYTE scene_height = 32;
UBYTE emotion_type = 1;
UBYTE emotion_timer = 0;
UBYTE emotion_actor = 1;
const BYTE emotion_offsets[] = {2, 1, 0, -1, -2, -3, -4, -5, -6, -5, -4, -3, -2, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};

static void SceneHandleInput();
void SceneRender();
UBYTE MapNpcAt_b(UBYTE actor_i, UBYTE tx_a, UBYTE ty_a);
UBYTE MapTriggerAt_b(UBYTE tx_a, UBYTE ty_a);
void MapUpdateActors_b();
void MapHandleInput_b();
void MapRepositionCamera_b();
void MapHandleTrigger_b();
void MapUpdateEmotionBubble_b();
void MapUpdateActorMovement_b(UBYTE i);
UBYTE clampUBYTE(UBYTE v, UBYTE min, UBYTE max);

////////////////////////////////////////////////////////////////////////////////
// Private vars
////////////////////////////////////////////////////////////////////////////////
#pragma region private vars

#pragma endregion

////////////////////////////////////////////////////////////////////////////////
// Private functions
////////////////////////////////////////////////////////////////////////////////
#pragma region private functions

#pragma endregion

////////////////////////////////////////////////////////////////////////////////
// Initialise
////////////////////////////////////////////////////////////////////////////////
#pragma region initialise

void SceneInit_b()
{
  UWORD sceneIndex, imageIndex;
  BANK_PTR bank_ptr, sprite_bank_ptr;
  UWORD ptr, sprite_ptr;
  UBYTE i, tilesetIndex, tilesetSize, numSprites, spriteIndex;
  UBYTE k, j, sprite_len, numActors;

  DISPLAY_OFF;

  SpritesReset();

  SCX_REG = 0;
  SCY_REG = 0;
  WX_REG = MAXWNDPOSX;
  WY_REG = MAXWNDPOSY;

  // sceneIndex = 42;
  sceneIndex = 12;

  // Load scene
  ReadBankedBankPtr(16, &bank_ptr, &scene_bank_ptrs[sceneIndex]);
  ptr = ((UWORD)bank_data_ptrs[bank_ptr.bank]) + bank_ptr.offset;
  imageIndex = ReadBankedUWORD(bank_ptr.bank, ptr);
  numSprites = ReadBankedUBYTE(bank_ptr.bank, ptr + 2);
  // x = ReadBankedUBYTE(bank_ptr.bank, ptr+3);
  // y = ReadBankedUBYTE(bank_ptr.bank, ptr+4);
  // z = ReadBankedUBYTE(bank_ptr.bank, ptr+5);
  // p = ReadBankedUBYTE(bank_ptr.bank, ptr+6);

  // LOG("NUMSPRITES=%u\n",numSprites);
  // LOG("X=%u\n",x);
  // LOG("Y=%u\n",y);
  // LOG("Z=%u\n",z);
  // LOG("P=%u\n",p);

  // Load sprites
  k = 24;
  ptr = ptr + 3;
  for (i = 0; i != numSprites; i++)
  {
    LOG("LOAD SPRITE=%u k=%u\n", i, k);
    spriteIndex = ReadBankedUBYTE(bank_ptr.bank, ptr + i);
    LOG("SPRITE INDEX=%u\n", spriteIndex);
    ReadBankedBankPtr(16, &sprite_bank_ptr, &sprite_bank_ptrs[spriteIndex]);
    sprite_ptr = ((UWORD)bank_data_ptrs[sprite_bank_ptr.bank]) + sprite_bank_ptr.offset;
    sprite_len = ReadBankedUBYTE(sprite_bank_ptr.bank, sprite_ptr) << 2;
    LOG("SPRITE LEN=%u\n", sprite_len);
    SetBankedSpriteData(sprite_bank_ptr.bank, k, sprite_len, sprite_ptr + 1);
    k += sprite_len;
  }

  // Load actors
  ptr = ptr + numSprites;
  numActors = ReadBankedUBYTE(bank_ptr.bank, ptr);
  ptr = ptr + 1;
  LOG("NUM ACTORS=%u\n", numActors);
  for (i = 1; i != numActors + 1; i++)
  {
    LOG("LOAD ACTOR %u\n", i);
    actors[i].sprite = ReadBankedUBYTE(bank_ptr.bank, ptr);
    LOG("ACTOR_SPRITE=%u\n", actors[i].sprite);
    actors[i].redraw = TRUE;
    actors[i].enabled = TRUE;
    actors[i].animated = FALSE; // WTF needed
    actors[i].animated = ReadBankedUBYTE(bank_ptr.bank, ptr + 1);
    actors[i].pos.x = (ReadBankedUBYTE(bank_ptr.bank, ptr + 2) << 3) + 8;
    actors[i].pos.y = (ReadBankedUBYTE(bank_ptr.bank, ptr + 3) << 3) + 8;
    j = ReadBankedUBYTE(bank_ptr.bank, ptr + 4);
    actors[i].dir.x = j == 2 ? -1 : j == 4 ? 1 : 0;
    actors[i].dir.y = j == 8 ? -1 : j == 1 ? 1 : 0;
    actors[i].movement_type = 0; // WTF needed
    actors[i].movement_type = ReadBankedUBYTE(bank_ptr.bank, ptr + 5);
    LOG("ACTOR_POS [%u,%u]\n", actors[i].pos.x, actors[i].pos.y);
    actors[i].events_ptr.bank = ReadBankedUBYTE(bank_ptr.bank, ptr + 6);
    actors[i].events_ptr.offset = (ReadBankedUBYTE(bank_ptr.bank, ptr + 7) * 0xFFu) + ReadBankedUBYTE(bank_ptr.bank, ptr + 8);
    LOG("ACTOR_EVENT_PTR BANK=%u OFFSET=%u\n", actors[i].events_ptr.bank, actors[i].events_ptr.offset);
    ptr = ptr + 9u;
  }

  // Load Player Sprite
  SetBankedSpriteData(3, 0, 24, village_sprites);

  // Load Image Tiles - V3 pointer to bank_ptr (31000) (42145)
  ReadBankedBankPtr(16, &bank_ptr, &image_bank_ptrs[imageIndex]);
  ptr = ((UWORD)bank_data_ptrs[bank_ptr.bank]) + bank_ptr.offset;
  tilesetIndex = ReadBankedUBYTE(bank_ptr.bank, ptr);
  scene_width = ReadBankedUBYTE(bank_ptr.bank, ptr + 1u);
  scene_height = ReadBankedUBYTE(bank_ptr.bank, ptr + 2u);
  SetBankedBkgTiles(bank_ptr.bank, 0, 0, scene_width, scene_height, ptr + 3u);

  // Load Image Tileset
  ReadBankedBankPtr(16, &bank_ptr, &tileset_bank_ptrs[tilesetIndex]);
  ptr = ((UWORD)bank_data_ptrs[bank_ptr.bank]) + bank_ptr.offset;
  tilesetSize = ReadBankedUBYTE(bank_ptr.bank, ptr);
  SetBankedBkgData(bank_ptr.bank, 0, tilesetSize, ptr + 1u);

  // Init player
  actors[0].redraw = TRUE;
  actors[0].pos.x = 96;
  actors[0].pos.y = 96;
  actors[0].dir.x = 1;
  actors[0].dir.y = 0;
  actors[0].moving = FALSE;

  // Hide unused Sprites
  for (i = numActors; i != MAX_ACTORS; i++)
  {
    move_sprite((i << 1), 0, 0);
    move_sprite((i << 1) + 1, 0, 0);
  }

  // Reset vars
  first_frame_on_tile = FALSE;
  camera_settings = CAMERA_LOCK_FLAG;

  MapRepositionCamera_b();
  MapHandleTrigger_b();

  FadeIn();

  DISPLAY_ON;
}

#pragma endregion

////////////////////////////////////////////////////////////////////////////////
// Update
////////////////////////////////////////////////////////////////////////////////
#pragma region update

void SceneUpdate_b()
{
  SceneHandleInput();
  SceneRender();

  // Handle map switch
  if (map_index != map_next_index && !IsFading())
  {
    map_index = map_next_index;
    SceneInit();
  }
}

void MapRepositionCamera_b()
{
  // UBYTE snap_left, snap_right, snap_top, snap_bottom, cam_x, cam_y;
  UBYTE cam_x, cam_y;

  // If camera is locked to player
  if ((camera_settings & CAMERA_LOCK_FLAG) == CAMERA_LOCK_FLAG)
  {
    cam_x = clampUBYTE(actors[0].pos.x, SCREEN_WIDTH_HALF, (scene_width << 3) - SCREEN_WIDTH_HALF);
    camera_dest.x = cam_x - SCREEN_WIDTH_HALF;

    cam_y = clampUBYTE(actors[0].pos.y, SCREEN_HEIGHT_HALF, (scene_height << 3) - SCREEN_HEIGHT_HALF);
    camera_dest.y = cam_y - SCREEN_HEIGHT_HALF;

    // cam_x = actors[0].pos.x - SCREEN_WIDTH_HALF;
    // cam_y = actors[0].pos.y - SCREEN_HEIGHT_HALF;
    // snap_left = (scene_width << 3) - SCREEN_WIDTH_HALF;
    // snap_right = snap_left - SCREEN_WIDTH_HALF;
    // snap_top = (scene_height << 3) - SCREEN_HEIGHT_HALF;
    // snap_bottom = snap_top - SCREEN_HEIGHT_HALF;
    // camera_dest.x = cam_x > snap_left ? 0 : cam_x > snap_right ? snap_right : cam_x;
    // camera_dest.y = cam_y > snap_top ? 0 : cam_y > snap_bottom ? snap_bottom : cam_y;

    // cam_p = actors[0].pos.x - SCREEN_WIDTH_HALF;
    // snap_a = (scene_width << 3) - SCREEN_WIDTH_HALF;
    // snap_b = snap_a - SCREEN_WIDTH_HALF;
    // camera_dest.x = cam_p > snap_a ? 0 : cam_p > snap_b ? snap_b : cam_p;

    // cam_p = actors[0].pos.y - SCREEN_HEIGHT_HALF;
    // snap_a = (scene_height << 3) - SCREEN_HEIGHT_HALF;
    // snap_b = snap_a - SCREEN_HEIGHT_HALF;
    // camera_dest.y = cam_p > snap_a ? 0 : cam_p > snap_b ? snap_b : cam_p;

    /*
    // Quickest version
    if (actors[0].pos.x < SCREEN_WIDTH_HALF)
    {
      camera_dest.x = 0;
    }
    else if (actors[0].pos.x > (scene_width << 3) - SCREEN_WIDTH_HALF)
    {
      camera_dest.x = (scene_width << 3) - SCREEN_WIDTH;
    }
    else
    {
      camera_dest.x = actors[0].pos.x - SCREEN_WIDTH_HALF;
    }
    if (actors[0].pos.y < SCREEN_HEIGHT_HALF)
    {
      camera_dest.y = 0;
    }
    else if (actors[0].pos.y > (scene_height << 3) - SCREEN_HEIGHT_HALF)
    {
      camera_dest.y = (scene_height << 3) - SCREEN_HEIGHT;
    }
    else
    {
      camera_dest.y = actors[0].pos.y - SCREEN_HEIGHT_HALF;
    }
    */
  }

  if ((camera_settings & CAMERA_TRANSITION_FLAG) == CAMERA_TRANSITION_FLAG)
  {
    if ((time & (camera_settings & CAMERA_SPEED_MASK)) == 0)
    {
      if (camera_dest.x < SCX_REG)
      {
        SCX_REG--;
      }
      else if (camera_dest.x > SCX_REG)
      {
        SCX_REG++;
      }
      if (camera_dest.y < SCY_REG)
      {
        SCY_REG--;
      }
      else if (camera_dest.y > SCY_REG)
      {
        SCY_REG++;
      }
    }
  }
  else
  {
    SCX_REG = camera_dest.x;
    SCY_REG = camera_dest.y;
  }

  if (((last_fn == script_cmd_camera_move) || (last_fn == script_cmd_camera_lock)) && SCX_REG == camera_dest.x && SCY_REG == camera_dest.y)
  {
    script_action_complete = TRUE;
    camera_settings &= ~CAMERA_TRANSITION_FLAG; // Remove transition flag
  }
}

////////////////////////////////////////////////////////////////////////////////
// Input
////////////////////////////////////////////////////////////////////////////////
#pragma region input

static void SceneHandleInput()
{
  UWORD tile, tile_offset;
  UBYTE tile_index_data;
  // UBYTE tile;
  UBYTE next_tx, next_ty;
  UBYTE npc;

  // If menu open - check if A pressed to close
  if (menu_y == MENU_OPEN_Y && (joy & J_A) && !(prev_joy & J_A))
  {
    if (!text_drawn)
    {
      draw_text(TRUE);
    }
    else
    {
      menu_dest_y = MENU_CLOSED_Y;
      if (last_fn == script_cmd_line)
      {
        script_action_complete = TRUE;
      }
    }
  }
  // If player between tiles can't handle input
  if (!ACTOR_ON_TILE(0))
  {
    return;
  }
  // Can't move while menu open
  if (menu_y != MENU_CLOSED_Y)
  {
    return;
  }

  // Can't move if emoting
  if (emotion_timer != 0)
  {
    return;
  }

  // Can't move while script is running
  if (script_ptr || IsFading())
  {
    actors[0].moving = FALSE;
    return;
  }

  if ((joy & J_A) && !(prev_joy & J_A))
  {
    actors[0].moving = FALSE;
    next_tx = (actors[0].pos.x >> 3) + actors[0].dir.x;
    next_ty = (actors[0].pos.y >> 3) + actors[0].dir.y;
    npc = MapNpcAt_b(0, next_tx, next_ty);
    if (npc != map_actor_num)
    {
      actors[0].moving = FALSE;
      if (actors[npc].movement_type != NONE)
      {
        actors[npc].dir.x = -actors[0].dir.x;
        actors[npc].dir.y = -actors[0].dir.y;
      }
      actors[npc].moving = FALSE;
      actors[npc].redraw = TRUE;
      script_actor = npc;
      script_ptr = actors[npc].script_ptr;
    }
  }
  else if (actors[0].movement_type == PLAYER_INPUT)
  {
    if (joy & J_LEFT)
    {
      update_actor_dir.x = -1;
      update_actor_dir.y = 0;
    }
    else if (joy & J_RIGHT)
    {
      update_actor_dir.x = 1;
      update_actor_dir.y = 0;
    }
    else
    {
      update_actor_dir.x = 0;
      if (joy & J_UP)
      {
        update_actor_dir.y = -1;
      }
      else if (joy & J_DOWN)
      {
        update_actor_dir.y = 1;
      }
      else
      {
        update_actor_dir.y = 0;
      }
    }
    MapUpdateActorMovement_b(0);
  }
}

#pragma endregion

////////////////////////////////////////////////////////////////////////////////
// Render
////////////////////////////////////////////////////////////////////////////////
#pragma region render

void SceneRender()
{
  if (IS_FRAME_16)
  {
    frame_offset = !frame_offset;
  }
  // Handle Wait
  if (wait_time != 0)
  {
    wait_time--;
    if (wait_time == 0)
    {
      script_action_complete = TRUE;
    }
  }

  MapUpdateActors_b();
  UIUpdate();

  // Handle Shake
  if (shake_time != 0)
  {
    shake_time--;
    SCX_REG += shake_time & 0x5;
    if (shake_time == 0)
    {
      script_action_complete = TRUE;
    }
  }
}

#pragma endregion

////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////
#pragma region helpers

void MapUpdateActorMovement_b(UBYTE i)
{
  UWORD tile;
  UWORD tile_offset;
  UBYTE tile_index_data;
  UBYTE tile_bit_mask;
  UBYTE next_tx, next_ty;
  UBYTE npc;
  UBYTE letter;

  if (update_actor_dir.x == 0 && update_actor_dir.y == 0)
  {
    actors[i].moving = FALSE;
  }
  else
  {
    if (actors[i].dir.x != update_actor_dir.x || actors[i].dir.y != update_actor_dir.y)
    {
      actors[i].dir.x = update_actor_dir.x;
      actors[i].dir.y = update_actor_dir.y;
      actors[i].redraw = TRUE;
    }
    actors[i].moving = TRUE;
  }

  if (actors[i].moving && !script_ptr)
  {
    next_tx = (actors[i].pos.x >> 3) + actors[i].dir.x;
    next_ty = (actors[i].pos.y >> 3) + actors[i].dir.y;

    npc = MapNpcAt_b(i, next_tx, next_ty);
    if (npc != map_actor_num)
    {
      actors[i].moving = FALSE;
    }

    /*
    // Collision detection
    if (map_col)
    {
      // Left tile
      tile = ((UWORD)map_col) + ((next_tx - 1) + (next_ty - 1) * scene_width);
      tile_index_data = ReadBankedUBYTE(map_banks[map_index], tile);

      if (tile_index_data)
      {
        actors[i].moving = FALSE;
      }
      // Right tile
      tile =
          ((UWORD)map_col) + ((next_tx - 1) + (next_ty - 1) * scene_width + 1);
      tile_index_data = ReadBankedUBYTE(map_banks[map_index], tile);

      if (tile_index_data)
      {
        actors[i].moving = FALSE;
      }
    }
    */
  }
}

UBYTE MapNpcAt_b(UBYTE actor_i, UBYTE tx_a, UBYTE ty_a)
{
  UBYTE i, tx_b, ty_b;
  for (i = 0; i != map_actor_num; i++)
  {
    if (i == actor_i)
    {
      continue;
    }
    // LOG("NPC i=%d @ [%d,%d]\n", i, actors[i].pos.x >> 3, actors[i].pos.y >> 3);
    tx_b = actors[i].pos.x >> 3;
    ty_b = actors[i].pos.y >> 3;
    if ((ty_a == ty_b || ty_a == ty_b - 1) &&
        (tx_a == tx_b || tx_a == tx_b + 1 || tx_a + 1 == tx_b))
    {
      return i;
    }
  }

  return map_actor_num;
}

UBYTE MapTriggerAt_b(UBYTE tx_a, UBYTE ty_a)
{
  UBYTE i, tx_b, ty_b, tx_c, ty_c;

  for (i = 0; i != map_trigger_num; i++)
  {
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
    if (tx_a >= tx_b && tx_a <= tx_c && ty_a >= ty_b && ty_a <= ty_c)
    {
      // if ((ty_a >= ty_b && ty_a <= ty_c) &&
      //     (tx_a >= tx_b && tx_a <= tx_c)
      //   ) {
      LOG("hit!\n");
      return i;
    }
  }

  return map_trigger_num;
}

void MapUpdateActors_b()
{
  UBYTE i, flip, frame, sprite_index, x, y, trigger, trigger_tile_offset;
  BYTE r;

  // Handle script move
  if (actor_move_settings & ACTOR_MOVE_ENABLED && ((actors[script_actor].pos.x & 7) == 0) && ((actors[script_actor].pos.y & 7) == 0))
  {
    LOG("TEST posx=%d posy=%d destx=%d desty=%d\n", actors[script_actor].pos.x,
        actors[script_actor].pos.y, actor_move_dest.x, actor_move_dest.y);
    if (actors[script_actor].pos.x == actor_move_dest.x && actors[script_actor].pos.y == actor_move_dest.y)
    {
      actor_move_settings &= ~ACTOR_MOVE_ENABLED;
      script_action_complete = TRUE;
      actors[script_actor].moving = FALSE;
    }
    else
    {
      LOG("NOT THERE YET\n");
      if (actors[script_actor].pos.x > actor_move_dest.x)
      {
        LOG("LEFT\n");
        update_actor_dir.x = -1;
        update_actor_dir.y = 0;
      }
      else if (actors[script_actor].pos.x < actor_move_dest.x)
      {
        LOG("RIGHT\n");

        update_actor_dir.x = 1;
        update_actor_dir.y = 0;
      }
      else
      {
        update_actor_dir.x = 0;
        if (actors[script_actor].pos.y > actor_move_dest.y)
        {
          LOG("UP\n");

          update_actor_dir.y = -1;
        }
        else if (actors[script_actor].pos.y < actor_move_dest.y)
        {
          LOG("DOWN\n");

          update_actor_dir.y = 1;
        }
        else
        {
          update_actor_dir.y = 0;
        }
      }
      MapUpdateActorMovement_b(script_actor);
    }
  }
  // Handle random npc movement
  if (!script_ptr)
  {
    // LOG("RANDOM BEHAVIOUR--------------\n");
    for (i = 1; i != map_actor_num; i++)
    {
      if (ACTOR_ON_TILE(i))
      {
        // if ((time & 0x3F) == 0) {
        if ((actors[i].movement_type == AI_RANDOM_WALK || actors[i].movement_type == AI_RANDOM_FACE) && (time & 0x3F) == 0)
        {
          r = rand();
          // LOG("CHECK RAND MOVEMENT r=%d \n", r);

          if (r > 64)
          {
            if (actors[i].movement_type == AI_RANDOM_WALK)
            {
              LOG("UPDATE MOVEMENT x=%d y=%d\n", actors[i].dir.x,
                  actors[i].dir.y);
              update_actor_dir.x = actors[i].dir.x;
              update_actor_dir.y = actors[i].dir.y;
              MapUpdateActorMovement_b(i);
            }
          }
          else if (r > 0)
          {
            r = rand();
            actors[i].dir.x = (r > 0) - (r < 0);
            actors[i].dir.y = 0;
            actors[i].redraw = TRUE;
          }
          else if (r > -64)
          {
            r = rand();
            actors[i].dir.x = 0;
            actors[i].dir.y = (r > 0) - (r < 0);
            actors[i].redraw = TRUE;
          }
        }
        else
        {
          actors[i].moving = FALSE;
        }
      }
    }
  }

  for (i = 0; i != map_actor_num; i++)
  {

    // If running script only update script actor - Unless needs redraw
    if (script_ptr && i != script_actor && !actors[i].redraw)
    {
      continue;
    }

    if ((actors[i].moving && ((actors[i].pos.x & 7) == 0) && ((actors[i].pos.y & 7) == 0)) || actors[i].redraw)
    {

      LOG("REDRAW %d x=%d y=%d\n", i, actors[i].dir.x, actors[i].dir.y);
      flip = FALSE;
      frame = actors[i].sprite;

      sprite_index = i << 1;

      if (actors[i].moving && actors[i].animated)
      {
        LOG("REDRAW a \n");
        frame += ((actors[i].pos.x >> 4) & 1) == ((actors[i].pos.y >> 4) & 1);
      }
      // Increase frame based on facing direction
      if (actors[i].dir.y < 0)
      {
        LOG("REDRAW b \n");
        frame += 1 + actors[i].animated;
      }
      else if (actors[i].dir.x < 0)
      {
        LOG("REDRAW c\n");
        flip = TRUE;
        frame += 2 + actors[i].animated + actors[i].animated;
      }
      else if (actors[i].dir.x > 0)
      {
        LOG("REDRAW d \n");
        frame += 2 + actors[i].animated + actors[i].animated;
      }
      // Handle facing left
      if (flip)
      {
        set_sprite_prop(sprite_index, S_FLIPX);
        set_sprite_prop(sprite_index + 1, S_FLIPX);
        set_sprite_tile(sprite_index, (frame << 2) + 2);
        set_sprite_tile(sprite_index + 1, frame << 2);
      }
      else
      {
        set_sprite_prop(sprite_index, 0x0);
        set_sprite_prop(sprite_index + 1, 0x0);
        set_sprite_tile(sprite_index, frame << 2);
        set_sprite_tile(sprite_index + 1, (frame << 2) + 2);
      }

      actors[i].redraw = FALSE;
    }
    // Move actors
    if (actors[i].moving)
    {
      actors[i].pos.x += actors[i].dir.x;
      actors[i].pos.y += actors[i].dir.y;
    }
  }

  MapHandleTrigger_b();

  // Position Camera
  MapRepositionCamera_b();

  // Position Sprites
  for (i = 0; i != map_actor_num; i++)
  {
    // Position actors
    x = actors[i].pos.x - SCX_REG;
    y = actors[i].pos.y - SCY_REG;

    // If sprite not under menu position it, otherwise hide
    if (actors[i].enabled && (y < menu_y + 16 || menu_y == MENU_CLOSED_Y))
    {
      move_sprite((i << 1), x, y);
      move_sprite((i << 1) + 1, x + 8, y);
    }
    else
    {
      move_sprite((i << 1), 0, 0);
      move_sprite((i << 1) + 1, 0, 0);
    }
  }

  MapUpdateEmotionBubble_b();
}

void MapHandleTrigger_b()
{
  UBYTE trigger, trigger_tile_offset;

  if (((actors[0].pos.x & 7) == 0) && (((actors[0].pos.y & 7) == 0) || actors[0].pos.y == 254))
  {

    if (!first_frame_on_tile)
    {

      // If at bottom of map offset tile lookup by 1 (look at tile 32 rather than 31)
      trigger_tile_offset = actors[0].pos.y == 254;

      LOG("ON TILE %d %d\n", actors[0].pos.x >> 3, actors[0].pos.y >> 3);
      first_frame_on_tile = TRUE;

      trigger =
          MapTriggerAt_b(actors[0].pos.x >> 3,
                         trigger_tile_offset + (actors[0].pos.y >> 3));
      if (trigger != map_trigger_num)
      {
        actors[0].moving = FALSE;
        script_actor = 0;
        script_ptr = triggers[trigger].script_ptr;
      }
    }
  }
  else
  {
    first_frame_on_tile = FALSE;
  }
}

void MapUpdateEmotionBubble_b()
{
  UBYTE x, y;

  if (emotion_timer > 0)
  {
    x = actors[emotion_actor].pos.x - SCX_REG;
    y = actors[emotion_actor].pos.y - 16 - SCY_REG;

    if (emotion_timer < 15)
    {
      y += emotion_offsets[emotion_timer];
    }

    move_sprite(38, x, y);
    move_sprite(39, x + 8, y);

    emotion_timer++;
    if (emotion_timer > 60)
    {
      emotion_timer = 0;
    }
  }
  else
  {
    move_sprite(38, 0, 0);
    move_sprite(39, 0, 0);
  }
}

UBYTE clampUBYTE(UBYTE v, UBYTE min, UBYTE max)
{
  UBYTE t;
  t = v < min ? min : v;
  return t > max ? max : t;
}

#pragma endregion
