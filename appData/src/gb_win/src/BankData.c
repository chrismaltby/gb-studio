#include "BankData.h"
#include "BankManager.h"
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
  value = *(UBYTE *)ptr;
  POP_BANK;
  return value;
}

void ReadBankedUBYTEArray(UBYTE bank, unsigned char *out, unsigned char *ptr, UBYTE size)
{
  PUSH_BANK(bank);

  memcpy(&out, ptr, size);

  POP_BANK;
}

UWORD ReadBankedUWORD(UBYTE bank, unsigned char *ptr)
{
  UWORD value;
  UBYTE hi, lo;
  PUSH_BANK(bank);
  hi = *(UBYTE *)ptr;
  lo = *(UBYTE *)(ptr + 1);
  value = (hi * 0xFFu) + lo;
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

void ReadBankedBankPtr(UBYTE bank, BANK_PTR *to, unsigned char *from)
{
  BANK_PTR bank_ptr;
  // BANK_PTR *bank_ptr_ptr;
  PUSH_BANK(bank);
  // mem_copy

  memcpy(&bank_ptr, from, sizeof(BANK_PTR));

  // bank_ptr_ptr = (BANK_PTR*)ptr;
  // to->bank = bank_ptr_ptr->bank;
  // to->offset = bank_ptr_ptr->offset;
  POP_BANK;

  memcpy(to, &bank_ptr, sizeof(BANK_PTR));
}
