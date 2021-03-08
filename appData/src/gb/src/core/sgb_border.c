#pragma bank 1

#include <gb/gb.h>
#include <gb/sgb.h>
#include <string.h>

#include "sgb_border.h"
#include "bankdata.h"

#define SGB_CHR_BLOCK0 0
#define SGB_CHR_BLOCK1 1

#define SGB_SCR_FREEZE 1
#define SGB_SCR_UNFREEZE 0

#define SGB_TRANSFER(A,B) map_buf[0]=(A),map_buf[1]=(B),sgb_transfer(map_buf) 

void transfer_tiles(unsigned char * data, size_t size, UBYTE bank) {
    UBYTE ntiles;
    unsigned char map_buf[20];
    memset(map_buf, 0, sizeof(map_buf));
    if (size > 256 * 32) ntiles = 0; else ntiles = size >> 5;
    
    if ((!ntiles) || (ntiles > 128U)) { 
        SetBankedBkgData(0, 0, data, bank); 
        if (ntiles) ntiles -= 128U; 
        data += (128 * 32);
    } else { 
        SetBankedBkgData(0, ntiles << 1, data, bank); 
        SGB_TRANSFER((SGB_CHR_TRN << 3) | 1, SGB_CHR_BLOCK0);
        return;
    }
    SGB_TRANSFER((SGB_CHR_TRN << 3) | 1, SGB_CHR_BLOCK0);

    SetBankedBkgData(0, ntiles << 1, data, bank); 
    SGB_TRANSFER((SGB_CHR_TRN << 3) | 1, SGB_CHR_BLOCK1);
}

void set_sgb_border(unsigned char * tiledata, size_t tiledata_size, UBYTE tiledata_bank,
                    unsigned char * tilemap,  size_t tilemap_size,  UBYTE tilemap_bank,
                    unsigned char * palette,  size_t palette_size,  UBYTE palette_bank) __banked {
    if (!sgb_check()) return;

    unsigned char map_buf[20];
    memset(map_buf, 0, sizeof(map_buf));

    SGB_TRANSFER((SGB_MASK_EN << 3) | 1, SGB_SCR_FREEZE); 

    BGP_REG = OBP0_REG = OBP1_REG = 0xE4U;
    SCX_REG = SCY_REG = 0U;

    UBYTE tmp_lcdc = LCDC_REG;

    HIDE_SPRITES, HIDE_WIN, SHOW_BKG;
    DISPLAY_ON;
    // prepare tilemap for SGB_BORDER_CHR_TRN (should display all 256 tiles)
    UBYTE i = 0U;
    for (UBYTE y = 0; y != 14U; ++y) {
        UBYTE * dout = map_buf;
        for(UBYTE x = 0U; x != 20U; ++x, *dout++ = i++);
        set_bkg_tiles(0, y, 20, 1, map_buf);
    }

    transfer_tiles(tiledata, tiledata_size, tiledata_bank);

    // transfer map and palettes
    SetBankedBkgData(0, (UBYTE)(tilemap_size >> 4), tilemap, tilemap_bank);
    SetBankedBkgData(128, (UBYTE)(palette_size >> 4), palette, palette_bank);
    SGB_TRANSFER((SGB_PCT_TRN << 3) | 1, 0);

    LCDC_REG = tmp_lcdc;

    // clear SCREEN
    memset(map_buf, 0, 16);
    set_bkg_data(0, 1, map_buf);
    fill_bkg_rect(0, 0, 20, 18, 0);
    
    SGB_TRANSFER((SGB_MASK_EN << 3) | 1, SGB_SCR_UNFREEZE); 
}
