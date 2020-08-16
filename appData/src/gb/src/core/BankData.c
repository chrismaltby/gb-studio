#include "BankData.h"

#include <string.h>

#include "BankManager.h"
#include "Scroll.h"

void SetBankedBkgData(UBYTE bank, UBYTE i, UBYTE l, unsigned char* ptr) {
  PUSH_BANK(bank);
  WaitForMode0Or1();
  set_bkg_data(i, l, ptr);
  POP_BANK;
}

void SetBankedSpriteData(UBYTE bank, UBYTE i, UBYTE l, unsigned char* ptr) {
  PUSH_BANK(bank);
  set_sprite_data(i, l, ptr);
  POP_BANK;
}

UBYTE ReadBankedUBYTE(UBYTE bank, unsigned char* ptr) {
  UBYTE value;
  PUSH_BANK(bank);
  value = *(UBYTE*)ptr;
  POP_BANK;
  return value;
}

void ReadBankedBankPtr(UBYTE bank, BankPtr* to, BankPtr* from) {
  BankPtr bank_ptr;
  PUSH_BANK(bank);
  memcpy(&bank_ptr, from, sizeof(BankPtr));
  POP_BANK;
  memcpy(to, &bank_ptr, sizeof(BankPtr));
}

void MemcpyBanked(UBYTE bank, void* to, void* from, size_t n) {
  PUSH_BANK(bank);
  memcpy(to, from, n);
  POP_BANK;
}
