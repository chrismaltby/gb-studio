#ifndef BANK_DATA_H
#define BANK_DATA_H

#include <gb/gb.h>

#ifdef __EMSCRIPTEN__
#define BankDataPtr(bank) ((UBYTE *)bank_data_ptrs[(bank)])
#else
#define BankDataPtr(bank) ((UBYTE *)0x4000)
#endif

typedef struct _BankPtr {
  UBYTE bank;
  UWORD offset;
} BankPtr;

void SetBankedBkgData(UBYTE bank, UBYTE i, UBYTE l, unsigned char *ptr);
void SetBankedBkgTiles(UBYTE bank, UBYTE x, UBYTE y, UBYTE w, UBYTE h, unsigned char *ptr);
void SetBankedWinTiles(UBYTE bank, UBYTE x, UBYTE y, UBYTE w, UBYTE h, unsigned char *ptr);
void SetBankedSpriteData(UBYTE bank, UBYTE i, UBYTE l, unsigned char *ptr);
UBYTE ReadBankedUBYTE(UBYTE bank, unsigned char *ptr);
void ReadBankedUBYTEArray(UBYTE bank, unsigned char *out, unsigned char *ptr, UBYTE size);
UWORD ReadBankedUWORD(UBYTE bank, unsigned char *ptr);
void StrCpyBanked(UBYTE bank, char *to, char *from);
void ReadBankedBankPtr(UBYTE bank, BankPtr *to, BankPtr *from);

#endif
