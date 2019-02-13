#include "ScriptRunner.h"

void Script_Run()
{
  script_cmd = ReadBankedUBYTE(script_ptr_bank, script_ptr);
  script_arg1 = ReadBankedUBYTE(script_ptr_bank, script_ptr + 1);
  script_arg2 = ReadBankedUBYTE(script_ptr_bank, script_ptr + 2);
  script_arg3 = ReadBankedUBYTE(script_ptr_bank, script_ptr + 4);
  
}