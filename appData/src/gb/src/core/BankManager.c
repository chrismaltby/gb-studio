#include "BankManager.h"

DECLARE_STACK(bank_stack, N_PUSH_BANKS);

void PushBank(UINT8 b) {
  StackPush(bank_stack, _current_bank);
  SWITCH_ROM(b);
}

void PopBank() {
  REFRESH_BANK;
  StackPop(bank_stack);
}
