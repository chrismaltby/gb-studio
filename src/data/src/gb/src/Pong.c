#include "Pong.h"
#include "BankManager.h"

void PongInit_b();
void PongUpdate_b();

void PongInit()
{
  PUSH_BANK(pong_bank);
  PongInit_b();
  POP_BANK;
}

void PongUpdate()
{
  PUSH_BANK(pong_bank);
  PongUpdate_b();
  POP_BANK;
}
