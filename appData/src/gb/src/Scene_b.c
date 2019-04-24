// clang-format off
#pragma bank=3
// clang-format on

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
#include "Math.h"
#include "ScriptRunner.h"

UINT8 scene_bank = 3;

////////////////////////////////////////////////////////////////////////////////
// Private vars
////////////////////////////////////////////////////////////////////////////////

// Scene Init Globals - Needed since split init across multiple functions
UWORD image_index;
UBYTE tileset_index;
UWORD scene_load_col_ptr;
UBYTE collision_tiles_len, col_bank;
BANK_PTR events_ptr;
BANK_PTR bank_ptr;
// End of Scene Init Globals

UBYTE scene_num_actors;
UBYTE scene_num_triggers;
UBYTE emote_type = 1;
UBYTE emote_timer = 0;
UBYTE emote_actor = 1;
const BYTE emote_offsets[] = {2, 1, 0, -1, -2, -3, -4, -5, -6, -5, -4, -3, -2, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
UBYTE scene_col_tiles[128] = {0};
UBYTE camera_moved = FALSE;
const VEC2D dir_up = {0, -1};
const VEC2D dir_down = {0, 1};
const VEC2D dir_left = {-1, 0};
const VEC2D dir_right = {1, 0};
const VEC2D dir_none = {0, 0};
VEC2D *directions[5] = {&dir_up, &dir_down, &dir_left, &dir_right, &dir_none};
VEC2D *update_dir;

////////////////////////////////////////////////////////////////////////////////
// Private functions
////////////////////////////////////////////////////////////////////////////////

static void SceneHandleInput();
void SceneRender();
UBYTE SceneNpcAt_b(UBYTE index, UBYTE tx_a, UBYTE ty_a);
UBYTE ScenePlayerAt_b(UBYTE tx_a, UBYTE ty_a);
UBYTE SceneTriggerAt_b(UBYTE tx_a, UBYTE ty_a);
void SceneUpdateActors_b();
void SceneUpdateCamera_b();
void SceneUpdateCameraShake_b();
void SceneUpdateEmoteBubble_b();
void SceneHandleTriggers_b();
void SceneRenderActors_b();
void SceneRenderEmoteBubble_b();
void SceneRenderCameraShake_b();
void SceneUpdateActorMovement_b(UBYTE i);
void SceneSetEmote_b(UBYTE actor, UBYTE type);
void SceneHandleWait();
void SceneHandleTransition();

////////////////////////////////////////////////////////////////////////////////
// Initialise
////////////////////////////////////////////////////////////////////////////////

void SceneInit_b1()
{
  DISPLAY_OFF;

  SpritesReset();
  UIInit();

  SCX_REG = 0;
  SCY_REG = 0;
  WX_REG = MAXWNDPOSX;
  WY_REG = MAXWNDPOSY;

  // Load scene
}

void SceneInit_b2()
{
  BANK_PTR sprite_bank_ptr;
  UWORD sprite_ptr, sprite_index;
  UBYTE num_sprites, k, i, j;
  UBYTE sprite_len;
  UWORD scene_load_ptr;

  ReadBankedBankPtr(DATA_PTRS_BANK, &bank_ptr, &scene_bank_ptrs[scene_index]);
  scene_load_ptr = ((UWORD)bank_data_ptrs[bank_ptr.bank]) + bank_ptr.offset;
  image_index = ReadBankedUWORD(bank_ptr.bank, scene_load_ptr);
  num_sprites = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 2);

  // Load sprites
  k = 24;
  scene_load_ptr = scene_load_ptr + 3;
  for (i = 0; i != num_sprites; i++)
  {
    // LOG("LOAD SPRITE=%u k=%u\n", i, k);
    sprite_index = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + i);
    // LOG("SPRITE INDEX=%u\n", sprite_index);
    ReadBankedBankPtr(DATA_PTRS_BANK, &sprite_bank_ptr, &sprite_bank_ptrs[sprite_index]);
    sprite_ptr = ((UWORD)bank_data_ptrs[sprite_bank_ptr.bank]) + sprite_bank_ptr.offset;
    sprite_len = MUL_4(ReadBankedUBYTE(sprite_bank_ptr.bank, sprite_ptr));
    // LOG("SPRITE LEN=%u\n", sprite_len);
    SetBankedSpriteData(sprite_bank_ptr.bank, k, sprite_len, sprite_ptr + 1);
    k += sprite_len;
  }
  scene_load_ptr = scene_load_ptr + num_sprites;

  // Load actors
  scene_num_actors = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr) + 1;
  scene_load_ptr = scene_load_ptr + 1;
  // LOG("NUM ACTORS=%u\n", scene_num_actors);
  for (i = 1; i != scene_num_actors; i++)
  {
    // LOG("LOAD ACTOR %u\n", i);
    actors[i].sprite = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr);
    // LOG("ACTOR_SPRITE=%u\n", actors[i].sprite);
    actors[i].redraw = TRUE;
    actors[i].enabled = TRUE;
    actors[i].moving = FALSE;
    actors[i].sprite_type = FALSE; // WTF needed
    actors[i].sprite_type = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 1);
    actors[i].pos.x = MUL_8(ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 2)) + 8;
    actors[i].pos.y = MUL_8(ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 3)) + 8;
    j = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 4);
    actors[i].dir.x = j == 2 ? -1 : j == 4 ? 1 : 0;
    actors[i].dir.y = j == 8 ? -1 : j == 1 ? 1 : 0;
    actors[i].movement_type = 0; // WTF needed
    actors[i].movement_type = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 5);
    // LOG("ACTOR_POS [%u,%u]\n", actors[i].pos.x, actors[i].pos.y);
    actors[i].events_ptr.bank = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 6);
    actors[i].events_ptr.offset = (ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 7) * 256) + ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 8);
    // LOG("ACTOR_EVENT_PTR BANK=%u OFFSET=%u\n", actors[i].events_ptr.bank, actors[i].events_ptr.offset);
    scene_load_ptr = scene_load_ptr + 9u;
  }

  // Load triggers
  scene_num_triggers = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr);
  scene_load_ptr = scene_load_ptr + 1;
  // LOG("NUM TRIGGERS=%u\n", scene_num_triggers);
  for (i = 0; i != scene_num_triggers; i++)
  {
    triggers[i].pos.x = ReadBankedUBYTE(bank_ptr.bank, (UWORD)scene_load_ptr);
    triggers[i].pos.y = ReadBankedUBYTE(bank_ptr.bank, (UWORD)scene_load_ptr + 1);
    triggers[i].w = 0;
    triggers[i].w = ReadBankedUBYTE(bank_ptr.bank, (UWORD)scene_load_ptr + 2);
    triggers[i].h = 0;
    triggers[i].h = ReadBankedUBYTE(bank_ptr.bank, (UWORD)scene_load_ptr + 3);
    // @todo 5th byte is type of trigger
    triggers[i].events_ptr.bank = ReadBankedUBYTE(bank_ptr.bank, (UWORD)scene_load_ptr + 5);
    triggers[i].events_ptr.offset = (ReadBankedUBYTE(bank_ptr.bank, (UWORD)scene_load_ptr + 6) * 256) + ReadBankedUBYTE(bank_ptr.bank, (UWORD)scene_load_ptr + 7);
    scene_load_ptr = scene_load_ptr + 8u;
  }

  // Store pointer to collisions for later
  collision_tiles_len = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr);
  scene_load_col_ptr = scene_load_ptr + 1;
  col_bank = bank_ptr.bank;
}

void SceneInit_b3()
{
  // There used to be code here
}

void SceneInit_b4()
{
}

void SceneInit_b5()
{
  BANK_PTR sprite_bank_ptr;
  UWORD sprite_ptr;
  UBYTE sprite_frames, sprite_len;

  // Load Player Sprite
  ReadBankedBankPtr(DATA_PTRS_BANK, &sprite_bank_ptr, &sprite_bank_ptrs[map_next_sprite]);
  sprite_ptr = ((UWORD)bank_data_ptrs[sprite_bank_ptr.bank]) + sprite_bank_ptr.offset;
  sprite_frames = ReadBankedUBYTE(sprite_bank_ptr.bank, sprite_ptr);
  sprite_len = MUL_4(sprite_frames);
  SetBankedSpriteData(sprite_bank_ptr.bank, 0, sprite_len, sprite_ptr + 1);
  actors[0].sprite = 0;
  actors[0].sprite_type = sprite_frames == 6 ? SPRITE_ACTOR_ANIMATED : sprite_frames == 3 ? SPRITE_ACTOR : SPRITE_STATIC;
  actors[0].redraw = TRUE;
}

void SceneInit_b6()
{
  BANK_PTR background_bank_ptr;
  UWORD background_ptr;

  // Load Image Tiles - V3 pointer to bank_ptr (31000) (42145)
  ReadBankedBankPtr(DATA_PTRS_BANK, &background_bank_ptr, &background_bank_ptrs[image_index]);
  background_ptr = ((UWORD)bank_data_ptrs[background_bank_ptr.bank]) + background_bank_ptr.offset;
  tileset_index = ReadBankedUBYTE(background_bank_ptr.bank, background_ptr);
  scene_width = ReadBankedUBYTE(background_bank_ptr.bank, background_ptr + 1u);
  scene_height = ReadBankedUBYTE(background_bank_ptr.bank, background_ptr + 2u);
  SetBankedBkgTiles(background_bank_ptr.bank, 0, 0, scene_width, scene_height, background_ptr + 3u);
}

void SceneInit_b7()
{
  BANK_PTR tileset_bank_ptr;
  UWORD tileset_ptr;
  UBYTE tileset_size;
  // Load Image Tileset
  ReadBankedBankPtr(DATA_PTRS_BANK, &tileset_bank_ptr, &tileset_bank_ptrs[tileset_index]);
  tileset_ptr = ((UWORD)bank_data_ptrs[tileset_bank_ptr.bank]) + tileset_bank_ptr.offset;
  tileset_size = ReadBankedUBYTE(tileset_bank_ptr.bank, tileset_ptr);
  SetBankedBkgData(tileset_bank_ptr.bank, 0, tileset_size, tileset_ptr + 1u);
}

void SceneInit_b8()
{
  UBYTE i;

  // Load collisions ( bitwise ceil by adding the divisor minus one to the dividend )
  for (i = 0; i != collision_tiles_len; i++)
  {
    scene_col_tiles[i] = ReadBankedUBYTE(col_bank, scene_load_col_ptr);
    scene_load_col_ptr++;
  }
}

void SceneInit_b9()
{
  UBYTE i;

  // Init player
  actors[0].redraw = TRUE;
  actors[0].enabled = TRUE;
  actors[0].moving = FALSE;
  actors[0].pos.x = map_next_pos.x;
  actors[0].pos.y = map_next_pos.y;
  actors[0].dir.x = map_next_dir.x;
  actors[0].dir.y = map_next_dir.y;

  // Init start script
  ReadBankedBankPtr(DATA_PTRS_BANK, &bank_ptr, &scene_bank_ptrs[scene_index]);
  events_ptr.bank = ReadBankedUBYTE(bank_ptr.bank, (UWORD)scene_load_col_ptr);
  events_ptr.offset = (ReadBankedUBYTE(bank_ptr.bank, scene_load_col_ptr + 1) * 256) + ReadBankedUBYTE(bank_ptr.bank, scene_load_col_ptr + 2);
  ScriptStart(&events_ptr);

  // Hide unused Sprites
  for (i = scene_num_actors; i != MAX_ACTORS; i++)
  {
    actors[i].enabled = FALSE;
    hide_sprite_pair(MUL_2(i));
  }

  // Reset vars
  camera_settings = CAMERA_LOCK_FLAG;

  SceneUpdateCamera_b();
  actors[0].moving = TRUE;
  SceneHandleTriggers_b();
  actors[0].moving = FALSE;

  FadeIn();

  time = 0;

  SHOW_SPRITES;
  DISPLAY_ON;
}

////////////////////////////////////////////////////////////////////////////////
// Update
////////////////////////////////////////////////////////////////////////////////

void SceneUpdate_b()
{
  SceneHandleInput();
  ScriptRunnerUpdate();
  SceneUpdateActors_b();
  SceneUpdateEmoteBubble_b();
  SceneUpdateCameraShake_b();
  SceneHandleWait();
  SceneHandleTransition();
  UIUpdate();
  SceneUpdateCamera_b();
  SceneRender();
  SceneHandleTriggers_b();
}

void SceneHandleWait()
{
  // Handle Wait - @todo handle this outside scene?
  if (wait_time != 0)
  {
    wait_time--;
    if (wait_time == 0)
    {
      script_action_complete = TRUE;
    }
  }
}

void SceneHandleTransition()
{
  // If scene has switched and FadeOut is complete
  if (scene_index != scene_next_index && !IsFading())
  {
    scene_index = scene_next_index;
    SceneInit();
  }
}

void SceneUpdateCamera_b()
{
  UBYTE cam_x, cam_y;

  // If camera is locked to player
  if ((camera_settings & CAMERA_LOCK_FLAG) == CAMERA_LOCK_FLAG)
  {
    // Reposition based on player position
    cam_x = ClampUBYTE(actors[0].pos.x, SCREEN_WIDTH_HALF, MUL_8(scene_width) - SCREEN_WIDTH_HALF);
    camera_dest.x = cam_x - SCREEN_WIDTH_HALF;
    cam_y = ClampUBYTE(actors[0].pos.y, SCREEN_HEIGHT_HALF, MUL_8(scene_height) - SCREEN_HEIGHT_HALF);
    camera_dest.y = cam_y - SCREEN_HEIGHT_HALF;
  }

  camera_moved = SCX_REG != camera_dest.x || SCY_REG != camera_dest.y;

  if (camera_moved)
  {
    // If camera is animating move towards location
    if ((camera_settings & CAMERA_TRANSITION_FLAG) == CAMERA_TRANSITION_FLAG)
    {
      if ((time & camera_speed) == 0)
      {
        if (SCX_REG > camera_dest.x)
        {
          SCX_REG--;
        }
        else if (SCX_REG < camera_dest.x)
        {
          SCX_REG++;
        }
        if (SCY_REG > camera_dest.y)
        {
          SCY_REG--;
        }
        else if (SCY_REG < camera_dest.y)
        {
          SCY_REG++;
        }
      }
    }
    // Otherwise jump imediately to camera destination
    else
    {
      SCX_REG = camera_dest.x;
      SCY_REG = camera_dest.y;
    }
  }
}

void SceneUpdateActors_b()
{
  UBYTE i, len;
  BYTE r;

  // Handle script move
  if (actor_move_settings & ACTOR_MOVE_ENABLED && ((actors[script_actor].pos.x & 7) == 0) && ((actors[script_actor].pos.y & 7) == 0))
  {
    if (actors[script_actor].pos.x == actor_move_dest.x && actors[script_actor].pos.y == actor_move_dest.y)
    {
      actor_move_settings &= ~ACTOR_MOVE_ENABLED;
      script_action_complete = TRUE;
      actors[script_actor].moving = FALSE;
    }
    else
    {
      if (actors[script_actor].pos.x > actor_move_dest.x)
      {
        update_dir = &dir_left;
      }
      else if (actors[script_actor].pos.x < actor_move_dest.x)
      {
        update_dir = &dir_right;
      }
      else if (actors[script_actor].pos.y > actor_move_dest.y)
      {
        update_dir = &dir_up;
      }
      else if (actors[script_actor].pos.y < actor_move_dest.y)
      {
        update_dir = &dir_down;
      }
      else
      {
        update_dir = &dir_none;
      }

      SceneUpdateActorMovement_b(script_actor);

      if (actors[script_actor].moving == FALSE)
      {
        actor_move_settings &= ~ACTOR_MOVE_ENABLED;
        script_action_complete = TRUE;
        actors[script_actor].moving = FALSE;
      }
    }
  }

  if (script_ptr == 0)
  {
    if (IS_FRAME_64)
    {
      r = rand();

      if (time == 0 || time == 128)
      {
        // Move odd numbered actors on frames 0 and 128
        if (scene_num_actors & 1)
        {
          len = scene_num_actors;
        }
        else
        {
          len = scene_num_actors + 1;
        }
        for (i = 1; i != len; i += 2)
        {
          if (actors[i].movement_type == AI_RANDOM_FACE)
          {
            memcpy(&actors[i].dir, directions[r & 3], sizeof(POS));
            actors[i].redraw = TRUE;
            actors[i].moving = FALSE;
            ++r;
          }
          else if (actors[i].movement_type == AI_ROTATE_TRB)
          {
            if (actors[i].dir.y == -1)
            {
              memcpy(&actors[i].dir, directions[3], sizeof(POS));
            }
            else if (actors[i].dir.y == 1)
            {
              memcpy(&actors[i].dir, directions[0], sizeof(POS));
            }
            else if (actors[i].dir.y == 0)
            {
              memcpy(&actors[i].dir, directions[1], sizeof(POS));
            }
            actors[i].redraw = TRUE;
            actors[i].moving = FALSE;
          }
          else if (actors[i].movement_type == AI_RANDOM_WALK)
          {
            update_dir = directions[r & 3];
            SceneUpdateActorMovement_b(i);
            ++r;
          }
        }
      }
      else
      {
        // Move even numbered actors on frames 64 and 192
        if (scene_num_actors & 1)
        {
          len = scene_num_actors + 1;
        }
        else
        {
          len = scene_num_actors;
        }
        for (i = 2; i != len; i += 2)
        {
          if (actors[i].movement_type == AI_RANDOM_FACE)
          {
            memcpy(&actors[i].dir, directions[r & 3], sizeof(POS));
            actors[i].redraw = TRUE;
            actors[i].moving = FALSE;
            ++r;
          }
          else if (actors[i].movement_type == AI_ROTATE_TRB)
          {
            if (actors[i].dir.y == -1)
            {
              memcpy(&actors[i].dir, directions[3], sizeof(POS));
            }
            else if (actors[i].dir.y == 1)
            {
              memcpy(&actors[i].dir, directions[0], sizeof(POS));
            }
            else if (actors[i].dir.y == 0)
            {
              memcpy(&actors[i].dir, directions[1], sizeof(POS));
            }
            actors[i].redraw = TRUE;
            actors[i].moving = FALSE;
          }
          else if (actors[i].movement_type == AI_RANDOM_WALK)
          {
            update_dir = directions[r & 3];
            SceneUpdateActorMovement_b(i);
            ++r;
          }
        }
      }
    }
    else if ((time == 8) || (time == 72) || (time == 136) || (time == 200))
    {
      for (i = 1; i != scene_num_actors; i++)
      {
        actors[i].moving = FALSE;
      }
    }
  }

  // Is frame where npc would move
  if (((time & 7) && !(time & 56)) || ((time & 0x3F) == 0))
  {
    len = scene_num_actors;
  }
  else
  {
    // Else only move player
    len = 1;

    // Move script actor
    if (script_ptr != 0 && script_actor != 0 && actors[script_actor].moving)
    {
      // Move actors
      actors[script_actor].pos.x += actors[script_actor].dir.x;
      actors[script_actor].pos.y += actors[script_actor].dir.y;
    }
  }

  for (i = 0; i != len; ++i)
  {
    // Move actors
    if (actors[i].moving)
    {
      actors[i].pos.x += actors[i].dir.x;
      actors[i].pos.y += actors[i].dir.y;
    }
  }
}

void SceneUpdateActorMovement_b(UBYTE i)
{
  UBYTE next_tx, next_ty;
  UBYTE npc;
  UWORD collision_index;

  memcpy(&actors[i].dir, update_dir, sizeof(POS));

  actors[i].redraw = TRUE;

  // Dont check collisions when running script
  if (script_ptr != 0 && (actor_move_settings & ACTOR_NOCLIP))
  {
    actors[i].moving = TRUE;
    return;
  }

  next_tx = DIV_8(actors[i].pos.x) + actors[i].dir.x;
  next_ty = DIV_8(actors[i].pos.y) + actors[i].dir.y;

  // Check for npc collisions
  npc = SceneNpcAt_b(i, next_tx, next_ty);
  if (npc != scene_num_actors)
  {
    actors[i].moving = FALSE;
    return;
  }

  // Check collisions on left tile
  collision_index = ((UWORD)scene_width * (next_ty - 1)) + (next_tx - 1);
  if (scene_col_tiles[collision_index >> 3] & (1 << (collision_index & 7)))
  {
    actors[i].moving = FALSE;
    return;
  }

  // Check collisions on right tile
  collision_index = ((UWORD)scene_width * (next_ty - 1)) + (next_tx - 1) + 1;
  if (scene_col_tiles[collision_index >> 3] & (1 << (collision_index & 7)))
  {
    actors[i].moving = FALSE;
    return;
  }

  // LOG("UPDATE ACTOR MOVEMENT %u\n", i);
  actors[i].moving = TRUE;
}

void SceneHandleTriggers_b()
{
  UBYTE trigger, trigger_tile_offset;

  if (ACTOR_ON_TILE(0) || actors[0].pos.y == 254)
  {
    if (actors[0].moving)
    {
      // If at bottom of map offset tile lookup by 1 (look at tile 32 rather than 31)
      trigger_tile_offset = actors[0].pos.y == 254;

      trigger =
          SceneTriggerAt_b(DIV_8(actors[0].pos.x),
                           trigger_tile_offset + DIV_8(actors[0].pos.y));

      if (trigger != scene_num_triggers)
      {
        // LOG("ON TRIGGER\n");
        actors[0].moving = FALSE;
        script_actor = 0;
        ScriptStart(&triggers[trigger].events_ptr);
      }
    }
  }
}

void SceneUpdateCameraShake_b()
{
  // Handle Shake
  if (shake_time != 0)
  {
    shake_time--;
    if (shake_time == 0)
    {
      script_action_complete = TRUE;
    }
  }
}

void SceneUpdateEmoteBubble_b()
{
  // If should be showing emote bubble
  if (emote_timer != 0)
  {
    // If reached end of timer
    if (emote_timer == BUBBLE_TOTAL_FRAMES)
    {
      // Reset the timer
      emote_timer = 0;

      // Hide the bubble sprites
      hide_sprite_pair(BUBBLE_SPRITE_LEFT);
    }
    else
    {
      // Inc timer
      emote_timer++;
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
// Input
////////////////////////////////////////////////////////////////////////////////

static void SceneHandleInput()
{
  UBYTE next_tx, next_ty;
  UBYTE npc;

  // If menu open - check if A pressed to close
  UIOnInteract();

  // If player between tiles can't handle input
  if (!ACTOR_ON_TILE(0))
  {
    return;
  }

  // Can't move while script is running
  if (script_ptr != 0 || emote_timer != 0 || IsFading())
  {
    actors[0].moving = FALSE;
    return;
  }

  if (JOY_PRESSED(J_A))
  {
    actors[0].moving = FALSE;
    next_tx = DIV_8(actors[0].pos.x) + actors[0].dir.x;
    next_ty = DIV_8(actors[0].pos.y) + actors[0].dir.y;
    npc = SceneNpcAt_b(0, next_tx, next_ty);
    if (npc != scene_num_actors)
    {
      actors[0].moving = FALSE;
      if (actors[npc].movement_type != NONE && actors[npc].movement_type != AI_ROTATE_TRB)
      {
        actors[npc].dir.x = -actors[0].dir.x;
        actors[npc].dir.y = -actors[0].dir.y;
      }
      actors[npc].moving = FALSE;
      actors[npc].redraw = TRUE;
      script_actor = npc;
      ScriptStart(&actors[npc].events_ptr);
    }
  }
  else if (IS_FRAME_4)
  {
    if (JOY(J_LEFT))
    {
      update_dir = &dir_left;
    }
    else if (JOY(J_RIGHT))
    {
      update_dir = &dir_right;
    }
    else if (JOY(J_UP))
    {
      update_dir = &dir_up;
    }
    else if (JOY(J_DOWN))
    {
      update_dir = &dir_down;
    }
    else
    {
      actors[0].moving = FALSE;
      return;
    }

    SceneUpdateActorMovement_b(0);
  }
}

////////////////////////////////////////////////////////////////////////////////
// Render
////////////////////////////////////////////////////////////////////////////////

void SceneRender()
{
  SceneRenderActors_b();
  SceneRenderEmoteBubble_b();
  SceneRenderCameraShake_b();
}

void SceneRenderCameraShake_b()
{
  // Handle Shake
  if (shake_time != 0)
  {
    SCX_REG += shake_time & 0x5;
  }
}

void SceneRenderActors_b()
{
  UBYTE i, flip, frame, sprite_index, screen_x, screen_y, redraw, len, scx, scy;

  scx = 0 - SCX_REG;
  scy = 0 - SCY_REG;

  if (IS_FRAME_64 || script_ptr != 0)
  {
    len = scene_num_actors;
  }
  else
  {
    // Else only update player
    len = 1;
  }

  for (i = 0; i != len; ++i)
  {
    // LOG("CHECK FOR REDRAW Actor %u\n", i);

    redraw = actors[i].redraw;

    // If just landed on new tile or needs a redraw
    if (redraw)
    {
      sprite_index = MUL_2(i);

      flip = FALSE;
      frame = actors[i].sprite;

      if (actors[i].sprite_type == SPRITE_ACTOR_ANIMATED)
      {
        // Set frame offset based on position, every 16px switch frame
        frame += (DIV_16(actors[i].pos.x) & 1) == (DIV_16(actors[i].pos.y) & 1);
      }

      if (actors[i].sprite_type != SPRITE_STATIC)
      {
        // Increase frame based on facing direction
        if (actors[i].dir.y < 0)
        {
          frame += 1 + (actors[i].sprite_type == SPRITE_ACTOR_ANIMATED);
        }
        else if (actors[i].dir.x != 0)
        {
          frame += 2 + MUL_2(actors[i].sprite_type == SPRITE_ACTOR_ANIMATED);

          // Facing left so flip sprite
          if (actors[i].dir.x < 0)
          {
            flip = TRUE;
          }
        }
      }

      // LOG("REDRAW Actor %u\n", i);

      // Handle facing left
      if (flip)
      {
        set_sprite_prop_pair(sprite_index, S_FLIPX);
        set_sprite_tile_pair(sprite_index, MUL_4(frame) + 2, MUL_4(frame));
      }
      else
      {
        set_sprite_prop_pair(sprite_index, 0x0);
        set_sprite_tile_pair(sprite_index, MUL_4(frame), MUL_4(frame) + 2);
      }

      actors[i].redraw = FALSE;
      redraw = TRUE;
    }
  }

  if (camera_moved)
  {
    for (i = 0; i != scene_num_actors; ++i)
    {
      sprite_index = MUL_2(i);
      // LOG("a Reposition Actor %u\n", i);
      screen_x = actors[i].pos.x + scx;
      screen_y = actors[i].pos.y + scy;
      if (actors[i].enabled && (win_pos_y == MENU_CLOSED_Y || screen_y < win_pos_y + 16))
      {
        move_sprite_pair(sprite_index, screen_x, screen_y);
      }
      else
      {
        hide_sprite_pair(sprite_index);
      }
    }
  }
  else
  {
    // If frame when npc would move
    if (win_pos_y != MENU_CLOSED_Y || ((time & 7) && !(time & 56)) || ((time & 0x3F) == 0))
    {
      len = scene_num_actors;
    }
    else
    {
      // Else only move player
      len = 1;
      // Unless running script on actor
      if (script_ptr != 0 && script_actor != 0)
      {
        sprite_index = MUL_2(script_actor);
        screen_x = actors[script_actor].pos.x + scx;
        screen_y = actors[script_actor].pos.y + scy;
        if (actors[script_actor].enabled && (win_pos_y == MENU_CLOSED_Y || screen_y < win_pos_y + 16))
        {
          move_sprite_pair(sprite_index, screen_x, screen_y);
        }
        else
        {
          hide_sprite_pair(sprite_index);
        }
      }
    }
    for (i = 0; i != len; ++i)
    {
      sprite_index = MUL_2(i);
      // LOG("b Reposition Actor %u\n", i);
      screen_x = actors[i].pos.x + scx;
      screen_y = actors[i].pos.y + scy;
      if (actors[i].enabled && (win_pos_y == MENU_CLOSED_Y || screen_y < win_pos_y + 16))
      {
        move_sprite_pair(sprite_index, screen_x, screen_y);
      }
      else
      {
        hide_sprite_pair(sprite_index);
      }
    }
  }
}

void SceneRenderEmoteBubble_b()
{
  UBYTE screen_x, screen_y;

  // If should be showing emote bubble
  if (emote_timer != 0)
  {
    // If reached end of timer
    if (emote_timer != BUBBLE_TOTAL_FRAMES)
    {

      // Set x and y above actor displaying emote
      screen_x = actors[emote_actor].pos.x - SCX_REG;
      screen_y = actors[emote_actor].pos.y - ACTOR_HEIGHT - SCY_REG;

      // At start of animation bounce bubble in using stored offsets
      if (emote_timer < BUBBLE_ANIMATION_FRAMES)
      {
        screen_y += emote_offsets[emote_timer];
      }

      // Reposition sprites (left and right)
      move_sprite_pair(BUBBLE_SPRITE_LEFT, screen_x, screen_y);
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////

UBYTE ScenePlayerAt_b(UBYTE tx_a, UBYTE ty_a)
{
  UBYTE tx_b, ty_b;
  tx_b = DIV_8(actors[0].pos.x);
  ty_b = DIV_8(actors[0].pos.y);
  if ((ty_a == ty_b || ty_a == ty_b - 1) &&
      (tx_a == tx_b || tx_a == tx_b + 1 || tx_a + 1 == tx_b))
  {
    return 1;
  }
  else
  {
    return 0;
  }
}

UBYTE SceneNpcAt_b(UBYTE index, UBYTE tx_a, UBYTE ty_a)
{
  UBYTE i, tx_b, ty_b;
  for (i = 0; i != scene_num_actors; i++)
  {
    if (i == index || !actors[i].enabled)
    {
      continue;
    }
    tx_b = DIV_8(actors[i].pos.x);
    ty_b = DIV_8(actors[i].pos.y);
    if ((ty_a == ty_b || ty_a == ty_b - 1) &&
        (tx_a == tx_b || tx_a == tx_b + 1 || tx_a + 1 == tx_b))
    {
      return i;
    }
  }
  return scene_num_actors;
}

UBYTE SceneTriggerAt_b(UBYTE tx_a, UBYTE ty_a)
{
  UBYTE i, tx_b, ty_b, tx_c, ty_c;

  for (i = 0; i != scene_num_triggers; i++)
  {
    tx_b = triggers[i].pos.x;
    ty_b = triggers[i].pos.y + 1;
    tx_c = tx_b + triggers[i].w;
    ty_c = ty_b + triggers[i].h - 1;

    if (tx_a >= tx_b && tx_a <= tx_c && ty_a >= ty_b && ty_a <= ty_c)
    {
      return i;
    }
  }

  return scene_num_triggers;
}

void SceneSetEmote_b(UBYTE actor, UBYTE type)
{
  UWORD scene_load_ptr;

  hide_sprite_pair(BUBBLE_SPRITE_LEFT);
  scene_load_ptr = ((UWORD)bank_data_ptrs[EMOTES_SPRITE_BANK]) + EMOTES_SPRITE_BANK_OFFSET;
  SetBankedSpriteData(EMOTES_SPRITE_BANK, 124, 4, scene_load_ptr + ((UWORD)type * 64));

  set_sprite_tile_pair(BUBBLE_SPRITE_LEFT, 124, 126);
  emote_timer = 1;
  emote_actor = actor;
}

UBYTE SceneIsEmoting_b()
{
  return emote_timer > 0;
}

UBYTE SceneCameraAtDest_b()
{
  return SCX_REG == camera_dest.x && SCY_REG == camera_dest.y;
}
