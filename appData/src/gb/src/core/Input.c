#include "Input.h"

UBYTE joy;
UBYTE last_joy;
UBYTE await_input;
BankPtr input_script_ptrs[NUM_INPUTS] = {{0}};

UBYTE AwaitInputPressed()
{
  // If scene hasn't finished loading prevent input
//   if (!scene_loaded || !scene_input_ready || !ACTOR_ON_TILE(0) || fade_running)
//   {
//     return FALSE;
//   }

  return ((joy & await_input) != 0);
}
