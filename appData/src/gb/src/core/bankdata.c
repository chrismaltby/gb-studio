#include <string.h>

#include "compat.h"
#include "bankdata.h"
#include "scroll.h"

static UBYTE _save;         // functions below are not reentrant

void SetBankedBkgData(UBYTE i, UBYTE l, const unsigned char* ptr, UBYTE bank) OLDCALL NONBANKED NAKED {
    i; l; ptr; bank;
__asm
    ldh a, (__current_bank)
    ld  (#__save), a

    ldhl  sp,	#6
    ld  a, (hl)
    ldh	(__current_bank), a
    ld  (_rROMB0), a

    pop bc
    call  _set_bkg_data     ; preserves BC

    ld  a, (#__save)
    ldh (__current_bank), a
    ld  (_rROMB0), a
    ld  h, b
    ld  l, c
    jp  (hl)
__endasm;
}

void SetBankedSpriteData(UBYTE i, UBYTE l, const unsigned char* ptr, UBYTE bank) OLDCALL NONBANKED NAKED {
    i; l; ptr; bank;
__asm
    ldh a, (__current_bank)
    ld  (#__save), a

    ldhl  sp, #6
    ld  a, (hl)
    ldh	(__current_bank), a
    ld  (_rROMB0), a

    pop bc
    call  _set_sprite_data    ; preserves BC

    ld  a, (#__save)
    ldh (__current_bank), a
    ld  (_rROMB0), a
    ld  h, b
    ld  l, c
    jp  (hl)
__endasm;
}

void SetBankedBkgTiles(UINT8 x, UINT8 y, UINT8 w, UINT8 h, const unsigned char *tiles, UBYTE bank) OLDCALL NONBANKED NAKED {
    x; y; w; h; tiles; bank;
__asm
    ldh a, (__current_bank)
    ld  (#__save), a

    ldhl  sp, #8
    ld  a, (hl)
    ldh	(__current_bank), a
    ld  (_rROMB0), a

    pop bc
    call  _set_bkg_tiles    ; preserves BC

    ld  a, (#__save)
    ldh (__current_bank), a
    ld  (_rROMB0), a
    ld  h, b
    ld  l, c
    jp  (hl)
__endasm;
}

void SetBankedWinTiles(UINT8 x, UINT8 y, UINT8 w, UINT8 h, const unsigned char *tiles, UBYTE bank) OLDCALL NONBANKED NAKED {
    x; y; w; h; tiles; bank;
__asm
    ldh a, (__current_bank)
    ld  (#__save), a

    ldhl  sp, #8
    ld  a, (hl)
    ldh	(__current_bank), a
    ld  (_rROMB0), a

    pop bc
    call  _set_win_tiles    ; preserves BC

    ld  a, (#__save)
    ldh (__current_bank), a
    ld  (_rROMB0), a
    ld  h, b
    ld  l, c
    jp  (hl)
__endasm;
}

void ReadBankedFarPtr(far_ptr_t * dest, const unsigned char *ptr, UBYTE bank) OLDCALL NONBANKED PRESERVES_REGS(b, c) NAKED {
    dest; ptr; bank;
__asm
    ldh a, (__current_bank)
    ld  (#__save), a

    ldhl  sp, #6
    ld  a, (hl)
    ldh	(__current_bank), a
    ld  (_rROMB0), a

    ldhl  sp, #2
    ld  a, (hl+)
    ld  e, a
    ld  a, (hl+)
    ld  d, a
    ld  a, (hl+)
    ld  h, (hl)
    ld  l, a

    .rept 2
      ld  a, (hl+)
      ld  (de), a
      inc de
    .endm
    ld  a, (hl)
    ld  (de), a

    ld  a, (#__save)
    ldh (__current_bank), a
    ld  (_rROMB0), a
    ret
__endasm;
}

UWORD ReadBankedUWORD(const unsigned char *ptr, UBYTE bank) OLDCALL NONBANKED PRESERVES_REGS(b, c) NAKED {
    ptr; bank;
__asm
    ldh a, (__current_bank)
    ld  (#__save), a

    ldhl  sp, #4
    ld  a, (hl-)
    ldh	(__current_bank), a
    ld  (_rROMB0), a

    ld  a, (hl-)
    ld  l, (hl)
    ld  h, a
    ld  a, (hl+)
    ld  e, a
    ld  d, (hl)

    ld  a, (#__save)
    ldh (__current_bank), a
    ld  (_rROMB0), a
    ret
__endasm;
}

void MemcpyBanked(void* to, const void* from, size_t n, UBYTE bank) OLDCALL NONBANKED NAKED {
    to; from; n; bank;
__asm
    ldh a, (__current_bank)
    ld  (#__save), a

    ldhl  sp, #8
    ld  a, (hl)
    ldh	(__current_bank), a
    ld  (_rROMB0), a

    pop bc
    call  _memcpy           ; preserves BC

    ld  a, (#__save)
    ldh (__current_bank), a
    ld  (_rROMB0), a
    ld  h, b
    ld  l, c
    jp  (hl)
__endasm;
}

void MemcpyVRAMBanked(void* to, const void* from, size_t n, UBYTE bank) OLDCALL NONBANKED NAKED {
    to; from; n; bank;
__asm
    ldh a, (__current_bank)
    ld  (#__save), a

    ldhl  sp, #8
    ld  a, (hl)
    ldh	(__current_bank), a
    ld  (_rROMB0), a

    pop bc
    call  _set_data         ; preserves BC

    ld  a, (#__save)
    ldh (__current_bank), a
    ld  (_rROMB0), a
    ld  h, b
    ld  l, c
    jp  (hl)
__endasm;
}

UBYTE IndexOfFarPtr(const far_ptr_t * list, UBYTE bank, UBYTE count, const far_ptr_t * item) NONBANKED {
    far_ptr_t v;
    for (UBYTE i = 0; i != count; i++, list++) {
        ReadBankedFarPtr(&v, (void *)list, bank);
        if ((v.bank == item->bank) && (v.ptr == item->ptr)) return i;
    }
    return count;
}
