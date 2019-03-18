#include "Scene.h"
#include "BankManager.h"

void SceneInit_b();
void SceneUpdate_b();
void SceneSetEmote_b(UBYTE actor, UBYTE type);
UBYTE SceneIsEmoting_b();
UBYTE SceneCameraAtDest_b();

UWORD map_next_index;
POS map_next_pos;
VEC2D map_next_dir;
ACTOR actors[MAX_ACTORS];
TRIGGER triggers[MAX_TRIGGERS];
UWORD scene_index;
UWORD scene_next_index;
UBYTE await_input;
POS camera_dest;
UBYTE camera_settings = CAMERA_LOCK_FLAG;
UBYTE wait_time = 0;
UBYTE shake_time = 0;
UBYTE scene_width;
UBYTE scene_height;

void SceneInit()
{
  PUSH_BANK(scene_bank);
  SceneInit_b();
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
