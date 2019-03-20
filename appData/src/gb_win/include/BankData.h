#ifndef BANK_DATA_H
#define BANK_DATA_H

#include <gb/gb.h>
#include "data_ptrs.h"

void SetBankedBkgData(UBYTE bank, UBYTE i, UBYTE l, unsigned char *ptr);
void SetBankedBkgTiles(UBYTE bank, UBYTE x, UBYTE y, UBYTE w, UBYTE h, unsigned char *ptr);
void SetBankedWinTiles(UBYTE bank, UBYTE x, UBYTE y, UBYTE w, UBYTE h, unsigned char *ptr);
void SetBankedSpriteData(UBYTE bank, UBYTE i, UBYTE l, unsigned char *ptr);
UBYTE ReadBankedUBYTE(UBYTE bank, unsigned char *ptr);
void ReadBankedUBYTEArray(UBYTE bank, unsigned char *out, unsigned char *ptr, UBYTE size);
UWORD ReadBankedUWORD(UBYTE bank, unsigned char *ptr);
void StrCpyBanked(UBYTE bank, unsigned char *to, unsigned char *from);
void ReadBankedBankPtr(UBYTE bank, BANK_PTR *to, unsigned char *from);

#endif
