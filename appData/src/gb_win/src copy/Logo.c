#include "Logo.h"
#include "BankManager.h"

void LogoInit_b();
void LogoUpdate_b();

void LogoInit()
{
  PUSH_BANK(logo_bank);
  LogoInit_b();
  POP_BANK;
}

void LogoUpdate()
{
  PUSH_BANK(logo_bank);
  LogoUpdate_b();
  POP_BANK;
}
