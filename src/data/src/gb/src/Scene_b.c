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
#pragma region private vars

UBYTE scene_width;
UBYTE scene_height;
UBYTE scene_num_actors;
UBYTE scene_num_triggers;
UBYTE emotion_type = 1;
UBYTE emotion_timer = 0;
UBYTE emotion_actor = 1;
const BYTE emotion_offsets[] = {2, 1, 0, -1, -2, -3, -4, -5, -6, -5, -4, -3, -2, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
UBYTE scene_col_tiles[128] = {0};

const VEC2D dir_up = {0, -1};
const VEC2D dir_down = {0, 1};
const VEC2D dir_left = {-1, 0};
const VEC2D dir_right = {1, 0};
const VEC2D dir_none = {0, 0};
VEC2D *directions[5] = {&dir_up, &dir_down, &dir_left, &dir_right, &dir_none};

#pragma endregion

////////////////////////////////////////////////////////////////////////////////
// Private functions
////////////////////////////////////////////////////////////////////////////////
#pragma region private functions

static void SceneHandleInput();
void SceneRender();
UBYTE SceneNpcAt_b(UBYTE actor_i, UBYTE tx_a, UBYTE ty_a);
UBYTE SceneTriggerAt_b(UBYTE tx_a, UBYTE ty_a);
void SceneUpdateActors_b();
void SceneUpdateCamera_b();
void SceneUpdateCameraShake_b();
void SceneUpdateEmotionBubble_b();
void SceneHandleTriggers_b();
void SceneRenderActors_b();
void SceneRenderEmotionBubble_b();
void SceneRenderCameraShake_b();
void SceneUpdateActorMovement_b(UBYTE i, VEC2D *update_dir);
void SceneSetEmotion_b(UBYTE actor, UBYTE type);
void SceneHandleWait();
void SceneHandleTransition();

#pragma endregion

////////////////////////////////////////////////////////////////////////////////
// Initialise
////////////////////////////////////////////////////////////////////////////////
#pragma region initialise

void SceneInit_b()
{
  UWORD image_index;
  BANK_PTR bank_ptr, sprite_bank_ptr;
  UWORD ptr, sprite_ptr, col_ptr;
  UBYTE i, tileset_index, tileset_size, num_sprites, sprite_index;
  UBYTE k, j, sprite_len, collision_tiles_len, col_bank;

  DISPLAY_OFF;

  SpritesReset();

  SCX_REG = 0;
  SCY_REG = 0;
  WX_REG = MAXWNDPOSX;
  WY_REG = MAXWNDPOSY;

  // Load scene
  ReadBankedBankPtr(16, &bank_ptr, &scene_bank_ptrs[scene_index]);
  ptr = ((UWORD)bank_data_ptrs[bank_ptr.bank]) + bank_ptr.offset;
  image_index = ReadBankedUWORD(bank_ptr.bank, ptr);
  num_sprites = ReadBankedUBYTE(bank_ptr.bank, ptr + 2);

  // Load sprites
  k = 24;
  ptr = ptr + 3;
  for (i = 0; i != num_sprites; i++)
  {
    LOG("LOAD SPRITE=%u k=%u\n", i, k);
    sprite_index = ReadBankedUBYTE(bank_ptr.bank, ptr + i);
    LOG("SPRITE INDEX=%u\n", sprite_index);
    ReadBankedBankPtr(16, &sprite_bank_ptr, &sprite_bank_ptrs[sprite_index]);
    sprite_ptr = ((UWORD)bank_data_ptrs[sprite_bank_ptr.bank]) + sprite_bank_ptr.offset;
    sprite_len = MUL_4(ReadBankedUBYTE(sprite_bank_ptr.bank, sprite_ptr));
    LOG("SPRITE LEN=%u\n", sprite_len);
    SetBankedSpriteData(sprite_bank_ptr.bank, k, sprite_len, sprite_ptr + 1);
    k += sprite_len;
  }

  // Load actors
  ptr = ptr + num_sprites;
  scene_num_actors = ReadBankedUBYTE(bank_ptr.bank, ptr) + 1;
  ptr = ptr + 1;
  LOG("NUM ACTORS=%u\n", scene_num_actors);
  for (i = 1; i != scene_num_actors; i++)
  {
    LOG("LOAD ACTOR %u\n", i);
    actors[i].sprite = ReadBankedUBYTE(bank_ptr.bank, ptr);
    LOG("ACTOR_SPRITE=%u\n", actors[i].sprite);
    actors[i].redraw = TRUE;
    actors[i].enabled = TRUE;
    actors[i].animated = FALSE; // WTF needed
    actors[i].animated = ReadBankedUBYTE(bank_ptr.bank, ptr + 1);
    actors[i].pos.x = MUL_8(ReadBankedUBYTE(bank_ptr.bank, ptr + 2)) + 8;
    actors[i].pos.y = MUL_8(ReadBankedUBYTE(bank_ptr.bank, ptr + 3)) + 8;
    j = ReadBankedUBYTE(bank_ptr.bank, ptr + 4);
    actors[i].dir.x = j == 2 ? -1 : j == 4 ? 1 : 0;
    actors[i].dir.y = j == 8 ? -1 : j == 1 ? 1 : 0;
    actors[i].movement_type = 0; // WTF needed
    actors[i].movement_type = ReadBankedUBYTE(bank_ptr.bank, ptr + 5);
    LOG("ACTOR_POS [%u,%u]\n", actors[i].pos.x, actors[i].pos.y);
    actors[i].events_ptr.bank = ReadBankedUBYTE(bank_ptr.bank, ptr + 6);
    actors[i].events_ptr.offset = (ReadBankedUBYTE(bank_ptr.bank, ptr + 7) * 256) + ReadBankedUBYTE(bank_ptr.bank, ptr + 8);
    LOG("ACTOR_EVENT_PTR BANK=%u OFFSET=%u\n", actors[i].events_ptr.bank, actors[i].events_ptr.offset);
    ptr = ptr + 9u;
  }

  // Load triggers
  scene_num_triggers = ReadBankedUBYTE(bank_ptr.bank, ptr);
  ptr = ptr + 1;
  LOG("NUM TRIGGERS=%u\n", scene_num_triggers);
  for (i = 0; i != scene_num_triggers; i++)
  {
    triggers[i].pos.x = ReadBankedUBYTE(bank_ptr.bank, ptr);
    triggers[i].pos.y = ReadBankedUBYTE(bank_ptr.bank, ptr + 1);
    triggers[i].w = 0;
    triggers[i].w = ReadBankedUBYTE(bank_ptr.bank, ptr + 2);
    triggers[i].h = 0;
    triggers[i].h = ReadBankedUBYTE(bank_ptr.bank, ptr + 3);
    // @todo 5th byte is type of trigger
    triggers[i].events_ptr.bank = ReadBankedUBYTE(bank_ptr.bank, ptr + 5);
    triggers[i].events_ptr.offset = (ReadBankedUBYTE(bank_ptr.bank, ptr + 6) * 256) + ReadBankedUBYTE(bank_ptr.bank, ptr + 7);
    ptr = ptr + 8u;
  }

  // Store pointer to collisions for later
  col_ptr = ptr;
  col_bank = bank_ptr.bank;

  // Load Player Sprite
  SetBankedSpriteData(3, 0, 24, village_sprites);

  // Load Image Tiles - V3 pointer to bank_ptr (31000) (42145)
  ReadBankedBankPtr(16, &bank_ptr, &image_bank_ptrs[image_index]);
  ptr = ((UWORD)bank_data_ptrs[bank_ptr.bank]) + bank_ptr.offset;
  tileset_index = ReadBankedUBYTE(bank_ptr.bank, ptr);
  scene_width = ReadBankedUBYTE(bank_ptr.bank, ptr + 1u);
  scene_height = ReadBankedUBYTE(bank_ptr.bank, ptr + 2u);
  SetBankedBkgTiles(bank_ptr.bank, 0, 0, scene_width, scene_height, ptr + 3u);

  // Load Image Tileset
  ReadBankedBankPtr(16, &bank_ptr, &tileset_bank_ptrs[tileset_index]);
  ptr = ((UWORD)bank_data_ptrs[bank_ptr.bank]) + bank_ptr.offset;
  tileset_size = ReadBankedUBYTE(bank_ptr.bank, ptr);
  SetBankedBkgData(bank_ptr.bank, 0, tileset_size, ptr + 1u);

  // Load collisions ( bitwise ceil by adding the divisor minus one to the dividend )
  collision_tiles_len = (scene_width * scene_height + (8 - 1)) >> 3;
  for (i = 0; i != collision_tiles_len; i++)
  {
    scene_col_tiles[i] = ReadBankedUBYTE(col_bank, col_ptr);
    col_ptr++;
  }

  LOG("COL TILES LEN = %u\n", collision_tiles_len);

  // Init player
  actors[0].redraw = TRUE;
  actors[0].moving = FALSE;
  actors[0].pos.x = map_next_pos.x;
  actors[0].pos.y = map_next_pos.y;
  actors[0].dir.x = map_next_dir.x;
  actors[0].dir.y = map_next_dir.y;

  // Hide unused Sprites
  for (i = scene_num_actors; i != MAX_ACTORS; i++)
  {
    hide_sprite_pair(MUL_2(i));
  }

  // Reset vars
  camera_settings = CAMERA_LOCK_FLAG;

  SceneUpdateCamera_b();
  SceneHandleTriggers_b();

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
  ScriptRunnerUpdate();
  SceneUpdateActors_b();
  SceneHandleTriggers_b();
  SceneUpdateEmotionBubble_b();
  SceneUpdateCameraShake_b();
  SceneHandleWait();
  SceneHandleTransition();
  SceneUpdateCamera_b();
  UIUpdate();
  SceneRender();
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

  // If camera is animating move towards location
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
  // Otherwise jump imediately to camera destination
  else
  {
    SCX_REG = camera_dest.x;
    SCY_REG = camera_dest.y;
  }

  // @todo - should event finish checks be included here, or seperate file?
  if (((last_fn == Script_CameraMoveTo_b) || (last_fn == Script_CameraLock_b)) && SCX_REG == camera_dest.x && SCY_REG == camera_dest.y)
  {
    script_action_complete = TRUE;
    camera_settings &= ~CAMERA_TRANSITION_FLAG; // Remove transition flag
  }
}

void SceneUpdateActors_b()
{
  VEC2D *update_dir;
  UBYTE i;
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

      SceneUpdateActorMovement_b(script_actor, update_dir);
    }
  }

  // Handle random npc movement
  if (!script_ptr)
  {
    for (i = 1; i != scene_num_actors; i++)
    {
      if (ACTOR_ON_TILE(i))
      {
        update_dir = &dir_none;

        if (IS_FRAME_64 && (actors[i].movement_type == AI_RANDOM_WALK || actors[i].movement_type == AI_RANDOM_FACE))
        {
          r = rand();
          update_dir = directions[r & 3];
        }

        SceneUpdateActorMovement_b(i, update_dir);

        if (actors[i].movement_type == AI_RANDOM_FACE)
        {
          actors[i].moving = FALSE;
        }
      }
    }
  }

  for (i = 0; i != scene_num_actors; i++)
  {
    // If running script only update script actor - Unless needs redraw
    if (script_ptr && i != script_actor && !actors[i].redraw)
    {
      continue;
    }

    // Move actors
    if (actors[i].moving)
    {
      actors[i].pos.x += actors[i].dir.x;
      actors[i].pos.y += actors[i].dir.y;
    }
  }
}

void SceneUpdateActorMovement_b(UBYTE i, VEC2D *update_dir)
{
  UBYTE next_tx, next_ty;
  UBYTE npc;
  UWORD collision_index;

  if (update_dir == &dir_none)
  {
    actors[i].moving = FALSE;
  }
  else
  {
    actors[i].dir.x = update_dir->x;
    actors[i].dir.y = update_dir->y;
    actors[i].redraw = TRUE;
    actors[i].moving = TRUE;
  }

  if (actors[i].moving && !script_ptr)
  {
    next_tx = DIV_8(actors[i].pos.x) + actors[i].dir.x;
    next_ty = DIV_8(actors[i].pos.y) + actors[i].dir.y;

    // Check for npc collisions
    npc = SceneNpcAt_b(i, next_tx, next_ty);
    if (npc != scene_num_actors)
    {
      actors[i].moving = FALSE;
    }

    // Check collisions on left tile
    collision_index = (scene_width * (next_ty - 1)) + (next_tx - 1);
    if (scene_col_tiles[collision_index >> 3] & (1 << (collision_index & 7)))
    {
      actors[i].moving = FALSE;
    }

    // Check collisions on right tile
    collision_index = (scene_width * (next_ty - 1)) + (next_tx - 1) + 1;
    if (scene_col_tiles[collision_index >> 3] & (1 << (collision_index & 7)))
    {
      actors[i].moving = FALSE;
    }
  }
}

void SceneHandleTriggers_b()
{
  UBYTE trigger, trigger_tile_offset;

  if (ACTOR_ON_TILE(0) || actors[0].pos.y == 254)
  // if (((actors[0].pos.x & 7) == 0) && (((actors[0].pos.y & 7) == 0) || actors[0].pos.y == 254))
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
        LOG("ON TRIGGER\n");
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

void SceneUpdateEmotionBubble_b()
{
  // If should be showing emotion bubble
  if (emotion_timer != 0)
  {
    // If reached end of timer
    if (emotion_timer == BUBBLE_TOTAL_FRAMES)
    {
      // Reset the timer
      emotion_timer = 0;

      // Hide the bubble sprites
      hide_sprite_pair(BUBBLE_SPRITE_LEFT);
    }
    else
    {
      // Inc timer
      emotion_timer++;
    }
  }
}

#pragma endregion

////////////////////////////////////////////////////////////////////////////////
// Input
////////////////////////////////////////////////////////////////////////////////
#pragma region input

static void SceneHandleInput()
{
  VEC2D *update_dir;
  UBYTE next_tx, next_ty;
  UBYTE npc;

  // If menu open - check if A pressed to close
  if (JOY_PRESSED(J_A))
  {
    // If still drawing text, finish drawing
    if (!text_drawn)
    {
      draw_text(TRUE);
    }
    else
    {
      menu_dest_y = MENU_CLOSED_Y;
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

  if (JOY_PRESSED(J_A))
  {
    actors[0].moving = FALSE;
    next_tx = DIV_8(actors[0].pos.x) + actors[0].dir.x;
    next_ty = DIV_8(actors[0].pos.y) + actors[0].dir.y;
    npc = SceneNpcAt_b(0, next_tx, next_ty);
    if (npc != scene_num_actors)
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
      ScriptStart(&actors[npc].events_ptr);
    }
  }
  else if (actors[0].movement_type == PLAYER_INPUT)
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
      update_dir = &dir_none;
    }

    SceneUpdateActorMovement_b(0, update_dir);
  }
}

#pragma endregion

////////////////////////////////////////////////////////////////////////////////
// Render
////////////////////////////////////////////////////////////////////////////////
#pragma region render

void SceneRender()
{
  SceneRenderActors_b();
  SceneRenderEmotionBubble_b();
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
  UBYTE i, flip, frame, sprite_index, screen_x, screen_y;

  for (i = 0; i != scene_num_actors; i++)
  {
    sprite_index = MUL_2(i);

    // // If running script only update script actor - Unless needs redraw
    // if (script_ptr && i != script_actor && !actors[i].redraw)
    // {
    //   continue;
    // }

    // If just landed on new tile or needs a redraw
    if ((actors[i].moving && ACTOR_ON_TILE(i)) || actors[i].redraw)
    {
      flip = FALSE;
      frame = actors[i].sprite;

      if (actors[i].animated)
      {
        // Set frame offset based on position, every 16px switch frame
        frame += (DIV_16(actors[i].pos.x) & 1) == (DIV_16(actors[i].pos.y) & 1);
      }

      // Increase frame based on facing direction
      if (actors[i].dir.y < 0)
      {
        frame += 1 + actors[i].animated;
      }
      else if (actors[i].dir.x != 0)
      {
        frame += 2 + MUL_2(actors[i].animated);

        // Facing left so flip sprite
        if (actors[i].dir.x < 0)
        {
          flip = TRUE;
        }
      }

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
    }

    // Position actors
    screen_x = actors[i].pos.x - SCX_REG;
    screen_y = actors[i].pos.y - SCY_REG;

    // If sprite not under menu position it, otherwise hide
    // @todo This function probably shouldn't know about the menu, maybe
    // keep a max_sprite_screen_y value and check against that?
    if (actors[i].enabled && (screen_y < menu_y + 16 || menu_y == MENU_CLOSED_Y))
    {
      move_sprite_pair(sprite_index, screen_x, screen_y);
    }
    else
    {
      hide_sprite_pair(sprite_index);
    }
  }
}

void SceneRenderEmotionBubble_b()
{
  UBYTE screen_x, screen_y;

  // If should be showing emotion bubble
  if (emotion_timer != 0)
  {
    // If reached end of timer
    if (emotion_timer != BUBBLE_TOTAL_FRAMES)
    {

      // Set x and y above actor displaying emotion
      screen_x = actors[emotion_actor].pos.x - SCX_REG;
      screen_y = actors[emotion_actor].pos.y - ACTOR_HEIGHT - SCY_REG;

      // At start of animation bounce bubble in using stored offsets
      if (emotion_timer < BUBBLE_ANIMATION_FRAMES)
      {
        screen_y += emotion_offsets[emotion_timer];
      }

      // Reposition sprites (left and right)
      move_sprite_pair(BUBBLE_SPRITE_LEFT, screen_x, screen_y);
    }
  }
}

#pragma endregion

////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////
#pragma region helpers

UBYTE SceneNpcAt_b(UBYTE actor_i, UBYTE tx_a, UBYTE ty_a)
{
  UBYTE i, tx_b, ty_b;
  for (i = 0; i != scene_num_actors; i++)
  {
    if (i == actor_i)
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

void SceneSetEmotion_b(UBYTE actor, UBYTE type)
{
  hide_sprite_pair(BUBBLE_SPRITE_LEFT);
  SetBankedSpriteData(3, 124, 4, emotion_sprites + (type * 64));
  set_sprite_tile_pair(BUBBLE_SPRITE_LEFT, 124, 126);
  emotion_timer = 1;
  emotion_actor = actor;
}

UBYTE SceneIsEmoting_b()
{
  return emotion_timer > 0;
}

#pragma endregion
