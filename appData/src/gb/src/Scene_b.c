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
UBYTE check_triggers;
UBYTE scene_loaded;
UBYTE scene_input_ready;
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
UBYTE last_joy;

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
void SceneRenderActor_b(UBYTE i);
void SceneRenderEmoteBubble_b();
void SceneRenderCameraShake_b();
void SceneUpdateActorMovement_b(UBYTE i);
void SceneSetEmote_b(UBYTE actor, UBYTE type);
void SceneHandleWait();
void SceneHandleTransition();
void SceneUpdateTimer_b();

////////////////////////////////////////////////////////////////////////////////
// Initialise
////////////////////////////////////////////////////////////////////////////////

void SceneInit_b1()
{
  DISPLAY_OFF;

  scene_loaded = FALSE;
  scene_input_ready = FALSE;

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
    actors[i].enabled = TRUE;
    actors[i].moving = FALSE;
    actors[i].sprite_type = FALSE; // WTF needed
    actors[i].sprite_type = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 1);
    actors[i].frames_len = 0;
    actors[i].frames_len = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 2);
    actors[i].animate = FALSE;
    actors[i].frame_offset = 0;
    actors[i].flip = FALSE;
    actors[i].animate = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 3) & 1;
    actors[i].frame = 0;
    actors[i].frame = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 3) >> 1;
    actors[i].move_speed = 0;
    actors[i].anim_speed = 0;

    actors[i].pos.x = MUL_8(ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 4)) + 8;
    actors[i].pos.y = MUL_8(ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 5)) + 8;
    j = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 6);
    actors[i].dir.x = j == 2 ? -1 : j == 4 ? 1 : 0;
    actors[i].dir.y = j == 8 ? -1 : j == 1 ? 1 : 0;

    actors[i].movement_type = 0; // WTF needed
    actors[i].movement_type = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 7);

    actors[i].move_speed = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 8);
    actors[i].anim_speed = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 9);

    // LOG("ACTOR_POS [%u,%u]\n", actors[i].pos.x, actors[i].pos.y);
    actors[i].events_ptr.bank = ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 10);
    actors[i].events_ptr.offset = (ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 11) * 256) + ReadBankedUBYTE(bank_ptr.bank, scene_load_ptr + 12);

    // LOG("ACTOR_EVENT_PTR BANK=%u OFFSET=%u\n", actors[i].events_ptr.bank, actors[i].events_ptr.offset);
    scene_load_ptr = scene_load_ptr + 13u;
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
  // Init player
  actors[0].enabled = TRUE;
  actors[0].moving = FALSE;
  actors[0].pos.x = map_next_pos.x;
  actors[0].pos.y = map_next_pos.y;
  actors[0].dir.x = map_next_dir.x;
  actors[0].dir.y = map_next_dir.y;
}

void SceneInit_b4()
{
  UBYTE i;
  for (i = 1; i != scene_num_actors; ++i)
  {
    SceneRenderActor_b(i);
  }
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
  actors[0].frame = 0;
  actors[0].animate = FALSE;
  actors[0].sprite_type = sprite_frames == 6 ? SPRITE_ACTOR_ANIMATED : sprite_frames == 3 ? SPRITE_ACTOR : SPRITE_STATIC;
  actors[0].frames_len = sprite_frames == 6 ? 2 : sprite_frames == 3 ? 1 : sprite_frames;
  SceneRenderActor_b(0);
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
  check_triggers = TRUE;
  SceneHandleTriggers_b();

  FadeIn();

  time = 0;
  last_joy = 0;
  scene_loaded = TRUE;

  // Disable timer script
  timer_script_duration = 0;

  SHOW_SPRITES;
  DISPLAY_ON;
}

////////////////////////////////////////////////////////////////////////////////
// Update
////////////////////////////////////////////////////////////////////////////////

void SceneUpdate_b()
{
  SceneUpdateCameraShake_b();
  SceneUpdateCamera_b();
  SceneRender();
  SceneUpdateTimer_b();
  SceneHandleInput();
  ScriptRunnerUpdate();
  SceneUpdateActors_b();
  SceneUpdateEmoteBubble_b();
  SceneHandleWait();
  SceneHandleTransition();
  UIUpdate();
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
  UBYTE i, len, jump;
  BYTE r;
  UBYTE *ptr;

  jump = sizeof(ACTOR);

  // Handle script move
  if (actor_move_settings & ACTOR_MOVE_ENABLED && ACTOR_ON_TILE(script_actor))
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
            SceneRenderActor_b(i);
            ++r;
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
            SceneRenderActor_b(i);
            ++r;
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
    else
    {
      ptr = actors;
      ptr += jump;
      for (i = 1; i != scene_num_actors; i++)
      {
        if (ACTOR_MOVING(ptr) && ACTOR_ON_TILE(i))
        {
          ACTOR_MOVING(ptr) = FALSE;
        }
        ptr += jump;
      }
    }
  }

  ptr = actors;
  len = scene_num_actors;

  if (script_ptr != 0)
  {
    for (i = 0; i != script_actor; ++i)
    {
      ptr += jump;
    }
    // Move actors
    if (ACTOR_MOVING(ptr))
    {
      if (ACTOR_MOVE_SPEED(ptr) == 0)
      {
        if (IS_FRAME_2)
        {
          ACTOR_X(ptr) = ACTOR_X(ptr) + ACTOR_DX(ptr);
          ACTOR_Y(ptr) = ACTOR_Y(ptr) + ACTOR_DY(ptr);
        }
      }
      else
      {
        ACTOR_X(ptr) = ACTOR_X(ptr) + ACTOR_DX(ptr) * ACTOR_MOVE_SPEED(ptr);
        ACTOR_Y(ptr) = ACTOR_Y(ptr) + ACTOR_DY(ptr) * ACTOR_MOVE_SPEED(ptr);
      }
    }
  }
  else
  {
    for (i = 0; i != len; ++i)
    {
      // Move actors
      if (ACTOR_MOVING(ptr))
      {
        if (ACTOR_MOVE_SPEED(ptr) == 0)
        {
          if (IS_FRAME_2)
          {
            ACTOR_X(ptr) = ACTOR_X(ptr) + ACTOR_DX(ptr);
            ACTOR_Y(ptr) = ACTOR_Y(ptr) + ACTOR_DY(ptr);
          }
        }
        else
        {
          ACTOR_X(ptr) = ACTOR_X(ptr) + ACTOR_DX(ptr) * ACTOR_MOVE_SPEED(ptr);
          ACTOR_Y(ptr) = ACTOR_Y(ptr) + ACTOR_DY(ptr) * ACTOR_MOVE_SPEED(ptr);
        }
      }
      ptr += jump;
    }
  }

  // Cycle through animation frames
  if (IS_FRAME_8)
  {
    len = scene_num_actors;
    ptr = actors;

    for (i = 0; i != len; ++i)
    {
      if (ACTOR_ANIM_SPEED(ptr) == 4 || (ACTOR_ANIM_SPEED(ptr) == 3 && IS_FRAME_16) || (ACTOR_ANIM_SPEED(ptr) == 2 && IS_FRAME_32) || (ACTOR_ANIM_SPEED(ptr) == 1 && IS_FRAME_64) || (ACTOR_ANIM_SPEED(ptr) == 0 && IS_FRAME_128))
      {
        if ((ACTOR_MOVING(ptr) && actors[i].sprite_type != SPRITE_STATIC) || ACTOR_ANIMATE(ptr))
        {
          if (ACTOR_FRAME(ptr) == ACTOR_FRAMES_LEN(ptr) - 1)
          {
            ACTOR_FRAME(ptr) = 0;
          }
          else
          {
            ACTOR_FRAME(ptr) = ACTOR_FRAME(ptr) + 1;
          }
        }
      }

      ptr += jump;
    }
  }
}

void SceneUpdateActorMovement_b(UBYTE i)
{
  UBYTE next_tx, next_ty;
  UBYTE npc;
  UWORD collision_index;

  memcpy(&actors[i].dir, update_dir, sizeof(POS));

  SceneRenderActor_b(i);

  // Dont check collisions when running script
  if (script_ptr != 0 && (actor_move_settings & ACTOR_NOCLIP))
  {
    if (i == 0)
    {
      check_triggers = TRUE;
    }
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

  if (i == 0)
  {
    check_triggers = TRUE;
  }
  actors[i].moving = TRUE;
}

void SceneUpdateTimer_b()
{
  // Don't update timer when scene is loading
  if (!scene_loaded || !scene_input_ready)
  {
    return;
  }

  // Don't update timer while script is running
  if (script_ptr != 0 || emote_timer != 0 || fade_running)
  {
    return;
  }

  // Don't update timer when UI is open
  if (!UIIsClosed())
  {
     return;
  }

  // Check if timer is enabled
  if (timer_script_duration != 0)
  {
    if (timer_script_time == 0)
    {
      // Don't start script when actor is between tiles
      if (!ACTOR_ON_TILE(0))
      {
        return;
      }

      last_joy = last_joy & 0xF0;
      ScriptStart(&timer_script_ptr);

      // Reset the countdown timer
      timer_script_time = timer_script_duration;
    }
    else
    {
      // Timer tick every 16 frames
      if ((time & 0x0F) == 0x00)
      {
        --timer_script_time;  
      }
    }
  }
}

void SceneHandleTriggers_b()
{
  UBYTE trigger, trigger_tile_offset;

  if (check_triggers && script_ptr == 0 && (ACTOR_ON_TILE(0) || actors[0].pos.y == 254))
  {
    check_triggers = FALSE;

    // If at bottom of map offset tile lookup by 1 (look at tile 32 rather than 31)
    trigger_tile_offset = actors[0].pos.y == 254;

    trigger =
        SceneTriggerAt_b(DIV_8(actors[0].pos.x),
                         trigger_tile_offset + DIV_8(actors[0].pos.y));

    if (trigger != scene_num_triggers)
    {
      actors[0].moving = FALSE;
      last_joy = last_joy & 240;
      script_actor = 0;
      ScriptStart(&triggers[trigger].events_ptr);
      ScriptRunnerUpdate();
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
  UBYTE next_tx, next_ty, input_index, input_joy;
  UBYTE npc;

  // If scene hasn't finished loading prevent input
  if (!scene_loaded || !scene_input_ready)
  {
    // If scene has loaded wait for all buttons
    // to be released before allowing new input
    if (scene_loaded)
    {
      scene_input_ready = (joy & 240) == 0;
    }
    return;
  }

  // If menu open - check if A pressed to close
  UIOnInteract();

  // If player between tiles can't handle input
  if (!ACTOR_ON_TILE(0))
  {
    return;
  }

  // Can't move while script is running
  if (script_ptr != 0 || emote_timer != 0 || fade_running)
  {
    actors[0].moving = FALSE;
    return;
  }

  if (joy != 0 && joy != last_joy)
  {
    input_index = 0;
    input_joy = joy;
    for (input_index = 0; input_index != 8; ++input_index)
    {
      if (input_joy & 1)
      {
        if (input_script_ptrs[input_index].bank)
        {
          actors[0].moving = FALSE;
          last_joy = joy;
          ScriptStart(&input_script_ptrs[input_index]);
          return;
        }
      }
      input_joy = input_joy >> 1;
    }
  }

  if (JOY_PRESSED(J_A))
  {
    last_joy = joy;
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
      SceneRenderActor_b(npc);
      script_actor = npc;
      ScriptStart(&actors[npc].events_ptr);
    }
  }
  else if ((actors[0].moving || joy != last_joy))
  {
    last_joy = joy;

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
  SceneRenderCameraShake_b();
  SceneRenderActors_b();
  SceneRenderEmoteBubble_b();
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
  UBYTE i, s, x, y, jump;
  UBYTE *ptr;

  if (IS_FRAME_9)
  {
    ptr = actors;
    jump = sizeof(ACTOR);

    for (i = 0; i != scene_num_actors; ++i)
    {
      s = MUL_2(i) + ACTOR_SPRITE_OFFSET;
      x = MUL_4(ACTOR_SPRITE(ptr) + ACTOR_FRAME(ptr) + ACTOR_FRAME_OFFSET(ptr));
      if (ACTOR_FLIP(ptr))
      {
        set_sprite_tile(s + 1, x);
        set_sprite_tile(s, x + 2);
      }
      else
      {
        set_sprite_tile(s, x);
        set_sprite_tile(s + 1, x + 2);
      }

      ptr += jump;
    }
  }

  ptr = actors;
  jump = sizeof(ACTOR);

  for (i = 0; i != scene_num_actors; ++i)
  {
    s = MUL_2(i) + ACTOR_SPRITE_OFFSET;
    x = ACTOR_X(ptr) - SCX_REG;
    y = ACTOR_Y(ptr) - SCY_REG;

    if (ACTOR_ENABLED(ptr) && (win_pos_y == MENU_CLOSED_Y || (y < win_pos_y + 16 || x < win_pos_x + 8)))
    {
      move_sprite(s, x, y);
      move_sprite(s + 1, x + 8, y);
    }
    else
    {
      move_sprite(s, 0, 0);
      move_sprite(s + 1, 0, 0);
    }
    ptr += jump;
  }
}

void SceneRenderActor_b(UBYTE i)
{
  UBYTE s, flip, frame, fo;

  s = MUL_2(i) + ACTOR_SPRITE_OFFSET;
  fo = 0;

  flip = actors[i].flip;

  if (actors[i].sprite_type != SPRITE_STATIC)
  {
    flip = FALSE;

    // Increase frame based on facing direction
    if (IS_NEG(actors[i].dir.y))
    {
      fo = 1 + (actors[i].sprite_type == SPRITE_ACTOR_ANIMATED);
    }
    else if (actors[i].dir.x != 0)
    {
      fo = 2 + MUL_2(actors[i].sprite_type == SPRITE_ACTOR_ANIMATED);

      // Facing left so flip sprite
      if (IS_NEG(actors[i].dir.x))
      {
        flip = TRUE;
      }
    }
    else
    {
      fo = 0;
    }

    actors[i].flip = FALSE;
    actors[i].flip = flip;
  }

  frame = MUL_4(actors[i].sprite + actors[i].frame + fo);

  if (flip)
  {
    // Handle facing left
    set_sprite_prop_pair(s, S_FLIPX);
    set_sprite_tile_pair(s, frame + 2, frame);
  }
  else
  {
    // Handle facing right
    set_sprite_prop_pair(s, 0x0);
    set_sprite_tile_pair(s, frame, frame + 2);
  }

  actors[i].frame_offset = 0;
  actors[i].frame_offset = fo;
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
  tx_b = DIV_8(ACTOR_X((UBYTE *)actors));
  ty_b = DIV_8(ACTOR_Y((UBYTE *)actors));
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
  UBYTE i, tx_b, ty_b, jump;
  UBYTE *ptr;

  ptr = actors;
  jump = sizeof(ACTOR);

  for (i = 0; i != scene_num_actors; i++)
  {
    if (i == index || !ACTOR_ENABLED(ptr))
    {
      ptr += jump;
      continue;
    }
    tx_b = DIV_8(ACTOR_X(ptr));
    ty_b = DIV_8(ACTOR_Y(ptr));
    if ((ty_a == ty_b || ty_a == ty_b - 1) &&
        (tx_a == tx_b || tx_a == tx_b + 1 || tx_a + 1 == tx_b))
    {
      return i;
    }
    ptr += jump;
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

UBYTE SceneAwaitInputPressed_b()
{
  // If scene hasn't finished loading prevent input
  if (!scene_loaded || !scene_input_ready || !ACTOR_ON_TILE(0) || fade_running)
  {
    return FALSE;
  }

  return ((joy & await_input) != 0);
}
