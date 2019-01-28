#include "BankData.h"
#include "BankManager.h"
#include <gbdkjs.h>
#include <string.h>

void SetBankedBkgData(UBYTE bank, UBYTE i, UBYTE l, unsigned char *ptr)
{
  PUSH_BANK(bank);
  set_bkg_data(i, l, ptr);
  POP_BANK;
}

void SetBankedBkgTiles(UBYTE bank, UBYTE x, UBYTE y, UBYTE w, UBYTE h,
                       unsigned char *ptr)
{
  PUSH_BANK(bank);
  set_bkg_tiles(x, y, w, h, ptr);
  POP_BANK;
}

void SetBankedWinTiles(UBYTE bank, UBYTE x, UBYTE y, UBYTE w, UBYTE h,
                       unsigned char *ptr)
{
  PUSH_BANK(bank);
  set_win_tiles(x, y, w, h, ptr);
  POP_BANK;
}

void SetBankedSpriteData(UBYTE bank, UBYTE i, UBYTE l, unsigned char *ptr)
{
  PUSH_BANK(bank);
  set_sprite_data(i, l, ptr);
  POP_BANK;
}

UBYTE ReadBankedUBYTE(UBYTE bank, unsigned char *ptr)
{
  UBYTE value;
  PUSH_BANK(bank);
  value = *(UBYTE *) ptr;
  POP_BANK;
  return value;
}

void StrCpyBanked(UBYTE bank, unsigned char *to, unsigned char *from)
{
  char buffer[18];
  PUSH_BANK(bank);
  strcpy(buffer, from);
  POP_BANK;
  strcpy(to, buffer);
}
