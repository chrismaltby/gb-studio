#include "Scene.h"
#include "BankManager.h"
#include "gbt_player.h"

void SceneInit_b1();
void SceneInit_b2();
void SceneInit_b3();
void SceneInit_b4();
void SceneInit_b5();
void SceneInit_b6();
void SceneInit_b7();
void SceneInit_b8();
void SceneInit_b9();
void SceneUpdate_b();
void SceneSetEmote_b(UBYTE actor, UBYTE type);
UBYTE SceneIsEmoting_b();
UBYTE SceneCameraAtDest_b();
UBYTE SceneAwaitInputPressed_b();
void SceneRenderActor_b(UBYTE i);

POS map_next_pos;
VEC2D map_next_dir;
UBYTE map_next_sprite;
ACTOR actors[MAX_ACTORS];
TRIGGER triggers[MAX_TRIGGERS];
UWORD scene_index;
UWORD scene_next_index;
UBYTE await_input;
POS camera_dest;
UBYTE camera_settings = CAMERA_LOCK_FLAG;
UBYTE camera_speed;
UBYTE wait_time = 0;
UBYTE shake_time = 0;
UBYTE scene_width;
UBYTE scene_height;
BANK_PTR input_script_ptrs[NUM_INPUTS] = {{0}};
UBYTE timer_script_duration = 0;
UBYTE timer_script_time = 0;
BANK_PTR timer_script_ptr = {0};


void SceneInit()
{
  PUSH_BANK(scene_bank);
  SceneInit_b1();
  POP_BANK;
  gbt_update();
  wait_vbl_done();

  PUSH_BANK(scene_bank);
  SceneInit_b2();
  POP_BANK;
  gbt_update();
  wait_vbl_done();

  PUSH_BANK(scene_bank);
  SceneInit_b3();
  POP_BANK;
  gbt_update();
  wait_vbl_done();

  PUSH_BANK(scene_bank);
  SceneInit_b4();
  POP_BANK;
  gbt_update();
  wait_vbl_done();

  PUSH_BANK(scene_bank);
  SceneInit_b5();
  POP_BANK;
  gbt_update();
  wait_vbl_done();

  PUSH_BANK(scene_bank);
  SceneInit_b6();
  POP_BANK;
  gbt_update();
  wait_vbl_done();

  PUSH_BANK(scene_bank);
  SceneInit_b7();
  POP_BANK;
  gbt_update();
  wait_vbl_done();

  PUSH_BANK(scene_bank);
  SceneInit_b8();
  POP_BANK;
  gbt_update();
  wait_vbl_done();

  PUSH_BANK(scene_bank);
  SceneInit_b9();
  POP_BANK;
}

void SceneUpdate()
{
  PUSH_BANK(scene_bank);
  SceneUpdate_b();
  POP_BANK;
}

void SceneSetEmote(UBYTE actor, UBYTE type)
{
  PUSH_BANK(scene_bank);
  SceneSetEmote_b(actor, type);
  POP_BANK;
}

UBYTE SceneIsEmoting()
{
  UBYTE is_emoting;
  PUSH_BANK(scene_bank);
  is_emoting = SceneIsEmoting_b();
  POP_BANK;
  return is_emoting;
}

UBYTE SceneCameraAtDest()
{
  UBYTE at_dest;
  PUSH_BANK(scene_bank);
  at_dest = SceneCameraAtDest_b();
  POP_BANK;
  return at_dest;
}

UBYTE SceneAwaitInputPressed()
{
  UBYTE pressed;
  PUSH_BANK(scene_bank);
  pressed = SceneAwaitInputPressed_b();
  POP_BANK;
  return pressed;
}

void SceneRenderActor(UBYTE i)
{
  PUSH_BANK(scene_bank);
  SceneRenderActor_b(i);
  POP_BANK;
}
