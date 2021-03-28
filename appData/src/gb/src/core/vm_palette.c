#pragma bank 2

#include <gb/cgb.h>

#include "vm_palette.h"

#include "vm.h"
#include "bankdata.h"

void vm_load_palette(SCRIPT_CTX * THIS, UBYTE mask, UBYTE options) __banked {
    UBYTE bank = THIS->bank;
    const UWORD * sour = (const UWORD *)THIS->PC;
    UWORD * dest = BkgPalette;
    for (UBYTE i = mask, nb = 0; (i != 0); dest += 4, nb++, i >>= 1) {
        if ((i & 1) == 0) continue;
        MemcpyBanked(dest, sour, sizeof(UWORD) * 4, bank);
        if (options & PALETTE_COMMIT) {
            #ifdef CGB
                if (_cpu == CGB_TYPE) { 
                    if (options & PALETTE_BKG) set_bkg_palette(nb, 1, dest);
                    if (options & PALETTE_SPRITE) set_sprite_palette(nb, 1, dest); 
                    sour += 4;
                    continue;
                }
            #endif
            #ifdef SGB
                // TODO: check and apply SGB palettes here
            #endif
            if (options & PALETTE_BKG) {
                if (nb == 0) BGP_REG = *((UBYTE *)dest);
            }
            if (options & PALETTE_SPRITE) {
                switch (nb) {
                    case 0:
                        OBP0_REG = *((UBYTE *)dest);
                        break;
                    case 1:
                        OBP1_REG = *((UBYTE *)dest);
                        break;
                }
            } 
        } 
        sour += 4; 
    }
    THIS->PC = (UBYTE *)sour;
}
