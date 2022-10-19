#ifndef BANK_DATA_H
#define BANK_DATA_H

#include <gb/gb.h>

#include "compat.h"

#define TO_FAR_PTR_T(A) {.bank = (UBYTE)&(__bank_ ## A), .ptr = (void *)&(A)}
#define TO_FAR_ARGS(T, A) (T)(A).ptr, (A).bank

#ifndef BANK
#define BANK(VARNAME) ( (UBYTE) & __bank_ ## VARNAME )
#endif
#ifndef BANKREF
#define BANKREF(VARNAME) void __func_ ## VARNAME() BANKED NAKED { \
__asm \
    .local b___func_ ## VARNAME \
    ___bank_ ## VARNAME = b___func_ ## VARNAME \
    .globl ___bank_ ## VARNAME \
__endasm; \
}
#endif
#ifndef BANKREF_EXTERN
#define BANKREF_EXTERN(VARNAME) extern const void __bank_ ## VARNAME;
#endif

#ifndef SIZE
#define SIZE(VARNAME) ((UWORD)&( __size_ ## VARNAME ))
#endif
#ifndef SIZEREF
#define SIZEREF(VARNAME) const void AT(sizeof(VARNAME)) __size_ ## VARNAME;
#endif
#ifndef SIZEREF_EXTERN
#define SIZEREF_EXTERN(VARNAME) extern const void __size_ ## VARNAME;
#endif

typedef struct far_ptr_t {
    UBYTE bank;
    void * ptr;
} far_ptr_t;

/**
 * Call set_bkg_data with data stored in banked memory (non-reentrant!)
 *
 * @param i first tile to write to
 * @param l number of tiles to write
 * @param ptr memory address of tile data within bank
 * @param bank bank to read from
 */
void SetBankedBkgData(UBYTE i, UBYTE l, const unsigned char *ptr, UBYTE bank) OLDCALL;

/**
 * Call set_sprite_data with data stored in banked memory (non-reentrant!)
 *
 * @param i first tile to write to
 * @param l number of tiles to write
 * @param ptr memory address of tile data within bank
 * @param bank bank to read from
 */
void SetBankedSpriteData(UBYTE i, UBYTE l, const unsigned char *ptr, UBYTE bank) OLDCALL;

/**
 * Sets a rectangular region of Tile Map entries for the Background layer (non-reentrant!)
 *
 * @param x      X Start position in Background Map tile coordinates. Range 0 - 31
 * @param y      Y Start position in Background Map tile coordinates. Range 0 - 31
 * @param w      Width of area to set in tiles. Range 0 - 31
 * @param h      Height of area to set in tiles.   Range 0 - 31
 * @param tiles  Pointer to source Tile Map data
 * @param bank   bank to read from
 */
void SetBankedBkgTiles(UINT8 x, UINT8 y, UINT8 w, UINT8 h, const unsigned char *tiles, UBYTE bank) OLDCALL;

/**
 * Sets a rectangular region of Tile Map entries for the Window layer (non-reentrant!)
 *
 * @param x      X Start position in Window Map tile coordinates. Range 0 - 31
 * @param y      Y Start position in Window Map tile coordinates. Range 0 - 31
 * @param w      Width of area to set in tiles. Range 0 - 31
 * @param h      Height of area to set in tiles.   Range 0 - 31
 * @param tiles  Pointer to source Tile Map data
 * @param bank   bank to read from
 */
void SetBankedWinTiles(UINT8 x, UINT8 y, UINT8 w, UINT8 h, const unsigned char *tiles, UBYTE bank) OLDCALL;


/**
 * Read far pointer from banked memory location into dest (non-reentrant!)
 *
 * @param dest pointer to far_ptr_t struct
 * @param ptr memory address of data within bank
 * @param bank bank to read from
 */
void ReadBankedFarPtr(far_ptr_t * dest, const unsigned char *ptr, UBYTE bank) OLDCALL PRESERVES_REGS(b, c);

/**
 * Read UWORD from banked memory location (non-reentrant!)
 *
 * @param ptr memory address of data within bank
 * @param bank bank to read from
 * @return value stored in banked location
 */
UWORD ReadBankedUWORD(const unsigned char *ptr, UBYTE bank) OLDCALL PRESERVES_REGS(b, c);

/**
 * Read UBYTE from banked memory location (non-reentrant!)
 *
 * @param ptr memory address of data within bank
 * @param bank bank to read from
 * @return value stored in banked location
 */
inline UBYTE ReadBankedUBYTE(const unsigned char *ptr, UBYTE bank) {
    return (UBYTE)ReadBankedUWORD(ptr, bank);
}

/**
 * memcpy data from banked memory location (non-reentrant!)
 *
 * @param to destination to write fetched data
 * @param from memory address of data within bank
 * @param n number of bytes to fetch from bank
 * @param bank bank to read from
 */
void MemcpyBanked(void* to, const void* from, size_t n, UBYTE bank) OLDCALL;

/**
 * memcpy data from banked memory location (non-reentrant!) to VRAM
 *
 * @param to destination to write fetched data
 * @param from memory address of data within bank
 * @param n number of bytes to fetch from bank
 * @param bank bank to read from
 */
void MemcpyVRAMBanked(void* to, const void* from, size_t n, UBYTE bank) OLDCALL;

/**
 * returns the index of pointer from the list
 *
 * @param list pointer to the farptr array
 * @param bank bank number of the list
 * @param count number of items in the farptr array
 * @param item pointer the the item in WRAM being searched
 * @return index in the array or count if not found
 */
UBYTE IndexOfFarPtr(const far_ptr_t * list, UBYTE bank, UBYTE count, const far_ptr_t * item);

#endif
