#ifndef BANK_DATA_H
#define BANK_DATA_H

#include <gb/gb.h>

#define __BANK_PREFIX(A) __bank_##A
#define TO_FAR_PTR_T(A) {.bank = (char)&(__BANK_PREFIX(A)), .ptr = (void *)&(A)}
#define TO_FAR_ARGS(T, A) (T)(A).ptr, (A).bank
#define BANK(A) (UBYTE)&(__BANK_PREFIX(A))

#define __SIZE_PREFIX(A) __size_##A
#define SIZE(A) (UWORD)&(__SIZE_PREFIX(A))

typedef struct far_ptr_t {
    UINT8 bank;
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
void SetBankedBkgData(UBYTE i, UBYTE l, const unsigned char *ptr, UBYTE bank);

/**
 * Call set_sprite_data with data stored in banked memory (non-reentrant!)
 * 
 * @param i first tile to write to
 * @param l number of tiles to write
 * @param ptr memory address of tile data within bank
 * @param bank bank to read from
 */
void SetBankedSpriteData(UBYTE i, UBYTE l, const unsigned char *ptr, UBYTE bank);

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
void SetBankedBkgTiles(UINT8 x, UINT8 y, UINT8 w, UINT8 h, const unsigned char *tiles, UBYTE bank);

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
void SetBankedWinTiles(UINT8 x, UINT8 y, UINT8 w, UINT8 h, const unsigned char *tiles, UBYTE bank);


/**
 * Read far pointer from banked memory location into dest (non-reentrant!)
 * 
 * @param dest pointer to far_ptr_t struct
 * @param ptr memory address of data within bank
 * @param bank bank to read from
 */
void ReadBankedFarPtr(far_ptr_t * dest, const unsigned char *ptr, UBYTE bank) __preserves_regs(b, c);

/**
 * Read UWORD from banked memory location (non-reentrant!)
 * 
 * @param ptr memory address of data within bank
 * @param bank bank to read from
 * @return value stored in banked location
 */
UWORD ReadBankedUWORD(const unsigned char *ptr, UBYTE bank) __preserves_regs(b, c);

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
void MemcpyBanked(void* to, const void* from, size_t n, UBYTE bank);

#endif
