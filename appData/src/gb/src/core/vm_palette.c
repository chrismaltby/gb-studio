#pragma bank 2

#include <gb/cgb.h>

#include "system.h"
#include "gbs_types.h"
#include "vm_palette.h"

#include "vm.h"
#include "bankdata.h"

void vm_load_palette(SCRIPT_CTX * THIS, UBYTE mask, UBYTE options) __banked {
    UBYTE bank = THIS->bank;
    #ifdef SGB
        UBYTE sgb_changes = SGB_PALETTES_NONE;
    #endif
    const palette_entry_t * sour = (const palette_entry_t *)THIS->PC;
    palette_entry_t * dest = (options & PALETTE_BKG) ? BkgPalette : SprPalette;
    for (UBYTE i = mask, nb = 0; (i != 0); dest++, nb++, i >>= 1) {
        if ((i & 1) == 0) continue;
        if ((_is_CGB) || (nb > 1)) {
            MemcpyBanked(dest, sour, sizeof(palette_entry_t), bank);
        } else {
            UBYTE DMGPal;
            switch (nb) {
                case 0: 
                    DMGPal = ReadBankedUBYTE((void *)sour, bank);
                    if (options & PALETTE_BKG) {
                        DMG_palette[0] = DMGPal;
                        if (options & PALETTE_COMMIT) BGP_REG = DMGPal;
                    }
                    if (options & PALETTE_SPRITE) {
                        DMG_palette[1] = DMGPal;
                        if (options & PALETTE_COMMIT) OBP0_REG = DMGPal;
                    }
                    break;
                case 1:
                    if (options & PALETTE_SPRITE) {
                        DMGPal = ReadBankedUBYTE((void *)sour, bank);
                        DMG_palette[2] = DMGPal;
                        if (options & PALETTE_COMMIT) OBP1_REG = DMGPal;
                    }
                    break;
            }
        }
        if (options & PALETTE_COMMIT) {
            #ifdef CGB
                if (_is_CGB) { 
                    if (options & PALETTE_BKG) set_bkg_palette(nb, 1, (void *)dest);
                    if (options & PALETTE_SPRITE) set_sprite_palette(nb, 1, (void *)dest); 
                    sour++;
                    continue;
                }
            #endif
            #ifdef SGB
                if (options & PALETTE_BKG) {
                    if ((nb == 4) || (nb == 5)) sgb_changes |= SGB_PALETTES_01;
                    if ((nb == 6) || (nb == 7)) sgb_changes |= SGB_PALETTES_23;
                }
            #endif
        } 
        sour++; 
    }
    #ifdef SGB
        if ((sgb_changes) && (_is_SGB)) SGBTransferPalettes(sgb_changes);
    #endif
    THIS->PC = (UBYTE *)sour;
}
