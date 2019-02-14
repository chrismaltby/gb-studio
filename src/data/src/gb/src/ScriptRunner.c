#include "ScriptRunner.h"
#include "BankData.h"
#include "game.h"

UBYTE script_ptr_bank = 0;
UWORD script_ptr = 0;

void Script_Start(BANK_PTR *events_ptr)
{
  script_ptr_bank = events_ptr->bank;
  script_ptr = ((UWORD)bank_data_ptrs[script_ptr_bank]) + events_ptr->offset;
}

void Script_Run()
{
  UBYTE script_cmd;

  if (!script_ptr_bank)
  {
    return;
  }

  script_cmd = ReadBankedUBYTE(script_ptr_bank, script_ptr);
  // script_arg1 = ReadBankedUBYTE(script_ptr_bank, script_ptr + 1);
  // script_arg2 = ReadBankedUBYTE(script_ptr_bank, script_ptr + 2);
  // script_arg3 = ReadBankedUBYTE(script_ptr_bank, script_ptr + 4);

  LOG("SCRIPT cmd [%u - %u] = %u \n", script_ptr_bank, script_ptr, script_cmd);
}