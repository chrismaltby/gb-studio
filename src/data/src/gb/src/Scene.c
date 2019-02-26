#include "Scene.h"
#include "BankManager.h"

void SceneInit_b();
void SceneUpdate_b();
void SceneSetEmotion_b(UBYTE actor, UBYTE type);
UBYTE SceneIsEmoting_b();

UWORD map_next_index;
POS map_next_pos;
VEC2D map_next_dir;

ACTOR actors[MAX_ACTORS];
TRIGGER triggers[MAX_TRIGGERS];
UWORD scene_index;
UWORD scene_next_index;

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

void SceneSetEmotion(UBYTE actor, UBYTE type)
{
  PUSH_BANK(scene_bank);
  SceneSetEmotion_b(actor, type);
  POP_BANK;
}

UBYTE SceneIsEmoting()
{
  UBYTE isEmoting;
  PUSH_BANK(scene_bank);
  isEmoting = SceneIsEmoting_b();
  POP_BANK;
  return isEmoting;
}
