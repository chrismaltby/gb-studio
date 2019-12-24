#include "BankManager.h"

DECLARE_STACK(bank_stack, N_PUSH_BANKS);

void PushBank(UINT8 b)
{
  StackPush(bank_stack, b);
  SWITCH_ROM(b);
}

void PopBank()
{
  StackPop(bank_stack);
  REFRESH_BANK;
}
