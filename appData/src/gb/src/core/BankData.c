#include "BankData.h"

#include <string.h>

#include "BankManager.h"
#include "Scroll.h"

void SetBankedBkgData(UBYTE bank, UBYTE i, UBYTE l, unsigned char* ptr) {
  UBYTE _save = _current_bank;
  SWITCH_ROM(bank);
  set_bkg_data(i, l, ptr);
  SWITCH_ROM(_save);
}

void SetBankedSpriteData(UBYTE bank, UBYTE i, UBYTE l, unsigned char* ptr) {
  UBYTE _save = _current_bank;
  SWITCH_ROM(bank);
  set_sprite_data(i, l, ptr);
  SWITCH_ROM(_save);
}

UBYTE ReadBankedUBYTE(UBYTE bank, unsigned char* ptr) {
  UBYTE value;
  UBYTE _save = _current_bank;
  SWITCH_ROM(bank);
  value = *(UBYTE*)ptr;
  SWITCH_ROM(_save);
  return value;
}

void ReadBankedBankPtr(UBYTE bank, BankPtr* to, BankPtr* from) {
  UBYTE _save = _current_bank;
  SWITCH_ROM(bank);
  memcpy(to, from, sizeof(BankPtr));
  SWITCH_ROM(_save);
}

void MemcpyBanked(UBYTE bank, void* to, void* from, size_t n) {
  UBYTE _save = _current_bank;
  SWITCH_ROM(bank);
  memcpy(to, from, n);
  SWITCH_ROM(_save);
}
