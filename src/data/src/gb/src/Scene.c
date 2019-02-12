#include "Scene.h"
#include "BankManager.h"

void SceneInit_b();
void SceneUpdate_b();

UWORD map_next_index;
POS map_next_pos;
VEC2D map_next_dir;

ACTOR actors[MAX_ACTORS];
TRIGGER triggers[MAX_TRIGGERS];

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
