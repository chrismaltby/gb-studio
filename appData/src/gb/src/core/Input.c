#include "Input.h"
#include "ScriptRunner.h"

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

void HandleInputScripts()
{
  UBYTE input_index, input_joy;

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
          last_joy = joy;
          ScriptStart(&input_script_ptrs[input_index]);
          return;
        }
      }
      input_joy = input_joy >> 1;
    }
  }
}
