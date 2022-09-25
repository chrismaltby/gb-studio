#pragma bank 255

#ifdef CGB
    #include <gb/cgb.h>
#endif

#include "system.h"
#include "gbs_types.h"
#include "vm_palette.h"

#include "vm.h"
#include "bankdata.h"

BANKREF(VM_PALETTE)

void vm_load_palette(SCRIPT_CTX * THIS, UBYTE mask, UBYTE options) OLDCALL BANKED {
    UBYTE bank = THIS->bank;
    #ifdef SGB
        UBYTE sgb_changes = SGB_PALETTES_NONE;
    #endif
    UBYTE is_commit = (options & PALETTE_COMMIT), is_bkg = (options & PALETTE_BKG), is_spr = (options & PALETTE_SPRITE);
    const palette_entry_t * sour = (const palette_entry_t *)THIS->PC;
    palette_entry_t * dest = (is_bkg) ? BkgPalette : SprPalette;
    for (UBYTE i = mask, nb = 0; (i != 0); dest++, nb++, i >>= 1) {
        if ((i & 1) == 0) continue;
        if ((_is_CGB) || (nb > 1)) {
            MemcpyBanked(dest, sour, sizeof(palette_entry_t), bank);
        } else {
            UBYTE DMGPal;
            switch (nb) {
                case 0:
                    DMGPal = ReadBankedUBYTE((void *)sour, bank);
                    if (is_bkg) {
                        DMG_palette[0] = DMGPal;
                        if (is_commit) BGP_REG = DMGPal;
                    }
                    if (is_spr) {
                        DMG_palette[1] = DMGPal;
                        if (is_commit) OBP0_REG = DMGPal;
                    }
                    break;
                case 1:
                    if (is_spr) {
                        DMGPal = ReadBankedUBYTE((void *)sour, bank);
                        DMG_palette[2] = DMGPal;
                        if (is_commit) OBP1_REG = DMGPal;
                    }
                    break;
            }
        }
        if (is_commit) {
            #ifdef CGB
                if (_is_CGB) {
                    if (is_bkg) set_bkg_palette(nb, 1, (void *)dest);
                    if (is_spr) set_sprite_palette(nb, 1, (void *)dest);
                    sour++;
                    continue;
                }
            #endif
            #ifdef SGB
                if (is_bkg) {
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
