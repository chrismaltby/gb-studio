#include "Core_Main.h"

#include <gb/cgb.h>

#include "Actor.h"
#include "BankManager.h"
#include "Camera.h"
#include "DataManager.h"
#include "FadeManager.h"
#include "GameTime.h"
#include "Input.h"
#include "MusicManager.h"
#include "Palette.h"
#include "ScriptRunner.h"
#include "Scroll.h"
#include "Sprite.h"
#include "Projectiles.h"
#include "UI.h"
#include "gbt_player.h"
#include "main.h"

#ifdef __EMSCRIPTEN__
void game_loop();
#endif

UBYTE game_time;
UINT16 next_state;
UINT8 delta_time;
UINT16 current_state;
UINT8 state_running = 0;
UINT8 vbl_count;
INT16 old_scroll_x, old_scroll_y;
UINT8 music_mute_frames = 0;

void SetScene(UINT16 state) {
  state_running = 0;
  next_state = state;
}

void vbl_update() {
  vbl_count++;

  // Update background scroll in vbl 
  // interupt to prevent tearing
  SCX_REG = scroll_x;
  SCY_REG = scroll_y;

#ifndef __EMSCRIPTEN__
  if (music_mute_frames != 0) {
    music_mute_frames--;
    if (music_mute_frames == 0) {
      gbt_enable_channels(0xF);
    }
  }
#endif
}

void lcd_update() {
  if (LYC_REG == 0x0) {
    SHOW_SPRITES;

    // If UI is open cause lcd interupt
    // to fire again when first line of
    // window is being drawn
    if (WY_REG != MENU_CLOSED_Y) {
      LYC_REG = WY_REG;
    }
  } else if (WX_REG == WIN_LEFT_X) {
    // If window is covering entire scan line
    // can just hide all sprites until next frame
    HIDE_SPRITES;
    LYC_REG = 0x0;
  }
}

int core_start() {
#ifdef CGB
  if (_cpu == CGB_TYPE) {
    cpu_fast();
  }
#endif

  // Init LCD
  LCDC_REG = 0x67;

  // Set interupt handlers
  add_VBL(vbl_update);
  add_TIM(MusicUpdate);
  add_LCD(lcd_update);

#ifdef CGB
  TMA_REG = _cpu == CGB_TYPE ? 120U : 0xBCU;
#else
  TMA_REG = 0xBCU;
#endif
  TAC_REG = 0x04U;

  LYC_REG = 0x0;  // LCD interupt pos

  set_interrupts(VBL_IFLAG | TIM_IFLAG | LCD_IFLAG);
  enable_interrupts();

  STAT_REG = 0x45;

  // Set palettes
  BGP_REG = OBP0_REG = 0xE4U;
  OBP1_REG = 0xD2U;

  SCX_REG = 0;
  SCY_REG = 0;

  // Position Window Layer
  WX_REG = 7;
  WY_REG = MAXWNDPOSY + 1;

  // Initialise Player
  player.sprite = 0;
  player.moving = TRUE;
  player.frame = 0;
  player.frames_len = 2;
  map_next_pos.x = player.pos.x = (START_SCENE_X << 3);
  map_next_pos.y = player.pos.y = (START_SCENE_Y << 3);
  map_next_dir.x = player.dir.x = START_SCENE_DIR_X;
  map_next_dir.y = player.dir.y = START_SCENE_DIR_Y;
  map_next_sprite = START_PLAYER_SPRITE;
  player.enabled = TRUE;
  player.move_speed = START_PLAYER_MOVE_SPEED;
  player.anim_speed = START_PLAYER_ANIM_SPEED;

  state_running = 0;
  next_state = START_SCENE_INDEX;
  game_time = 0;
  scene_type = 0;

  UIInit();
  FadeInit();
  ScriptRunnerInit();

#ifdef __EMSCRIPTEN__
  emscripten_set_main_loop(game_loop, 60, 1);
}

void game_loop() {
  emscripten_update_registers(SCX_REG, SCY_REG, WX_REG, WY_REG, LYC_REG, LCDC_REG, BGP_REG,
                              OBP0_REG, OBP1_REG);

  if (state_running) {
#else
  while (1) {
    while (state_running) {
#endif

    /* Game Core Loop Start *********************************/

    if (!vbl_count) {
      wait_vbl_done();
    }
    delta_time = vbl_count == 1u ? 0u : 1u;
    vbl_count = 0;

    last_joy = joy;
    joy = joypad();
    if((joy & INPUT_DPAD) != (last_joy & INPUT_DPAD)) {
      // https://stackoverflow.com/a/50705674
      recent_joy = joy & ~last_joy;
    }

    UpdateCamera();
    RefreshScroll();
    UpdateActors();
    UpdateProjectiles();
    UIOnInteract();
    UIUpdate();
    HandleInputScripts();
    FadeUpdate();

    if (!script_ctxs[0].script_ptr_bank && !UIIsBlocking()) {
      PUSH_BANK(stateBanks[scene_type]);
      updateFuncs[scene_type]();
      POP_BANK;
    }

    if (script_complete) {
      // Only allow script complete to be TRUE
      // for a single frame so that scene update
      // fn can use it to clean up
      script_complete = FALSE;
    }

    ScriptTimerUpdate();

    ScriptRestoreCtx(0);

    if(!UIIsBlocking()) {
      // Run background scripts
      ScriptRestoreCtx(1);
      ScriptRestoreCtx(2);
      ScriptRestoreCtx(3);
      ScriptRestoreCtx(4);
      ScriptRestoreCtx(5);
      ScriptRestoreCtx(6);
      ScriptRestoreCtx(7);
      ScriptRestoreCtx(8);
      ScriptRestoreCtx(9);
      ScriptRestoreCtx(10);
      ScriptRestoreCtx(11);

      // Reposition actors and check for collisions
      MoveActors();
      ActorRunCollisionScripts();
    }

    game_time++;

    /* Game Core Loop End ***********************************/
  }
#ifdef __EMSCRIPTEN__
  else {
#endif

    //  Switch Scene

    // Fade out current scene
    FadeOut();
    while (fade_running) {
      wait_vbl_done();
      FadeUpdate();
    }
    DISPLAY_OFF

    state_running = 1;
    current_state = next_state;

    // Reset scroll target and camera
    scroll_target = 0;
    scroll_target = &camera_pos;
    camera_settings = CAMERA_LOCK_FLAG;

    // Disable timer script
    timer_script_duration = 0;

    BGP_REG = PAL_DEF(0, 1, 2, 3);
    OBP0_REG = OBP1_REG = PAL_DEF(0, 0, 1, 3);

    LoadScene(current_state);

    // Run scene type init function
    PUSH_BANK(stateBanks[scene_type]);
    startFuncs[scene_type]();
    POP_BANK;

    game_time = 0;
    old_scroll_x = scroll_x;
    old_scroll_y = scroll_y;

    // Fade in new scene
    DISPLAY_ON;
    FadeIn();

    // Run scene init script
    ScriptStart(&scene_events_start_ptr);
    ScriptRestoreCtx(0);

    MoveActors();
    UpdateCamera();
    RefreshScroll();
    UpdateActors();
    UIUpdate();

    // Wait for fade in to complete
    while (fade_running) {
      wait_vbl_done();
      FadeUpdate();
    }
  }
}
