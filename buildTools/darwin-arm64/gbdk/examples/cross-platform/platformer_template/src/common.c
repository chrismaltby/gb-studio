
#include <gbdk/platform.h>
#include <gbdk/metasprites.h>
#include <stdint.h>
#include "common.h"

uint8_t joypadCurrent=0, joypadPrevious=0;

void WaitForStartOrA(void){
    while(1){

        // Get the joypad input
        joypadPrevious = joypadCurrent;
        joypadCurrent = joypad();

        if((joypadCurrent & J_START) && !(joypadPrevious & J_START))break;
        if((joypadCurrent & J_A) && !(joypadPrevious & J_A))break;

        vsync();
        
    }
}

void setBKGPalettes(uint8_t count, const palette_color_t *palettes) NONBANKED{
    // Set up color palettes
    #if defined(SEGA)
        //__WRITE_VDP_REG(VDP_R2, R2_MAP_0x3800);
        //__WRITE_VDP_REG(VDP_R5, R5_SAT_0x3F00);
        set_bkg_palette(0, count, palettes);
    #elif defined(GAMEBOY)
        if (_cpu == CGB_TYPE) {
            set_bkg_palette(OAMF_CGB_PAL0, count, palettes);
        }
    #elif defined(NINTENDO_NES)
        set_bkg_palette(0, count, palettes);
    #endif 
}


void ShowCentered(uint8_t width,uint8_t height,uint8_t bank, uint8_t* tileData, uint8_t tileCount, uint8_t* mapData, const palette_color_t* palettes) NONBANKED{


    DISPLAY_OFF;

    uint8_t _previous_bank = CURRENT_BANK;
    

    // Hide any remainder sprites
    hide_sprites_range(0,MAX_HARDWARE_SPRITES);

    move_bkg(0,0);

    // Make sure the graphic is centered on the screen
    uint8_t titleRow = (DEVICE_SCREEN_HEIGHT-(height>>3))/2;
    uint8_t titleColumn = (DEVICE_SCREEN_WIDTH-(width>>3))/2;

    SWITCH_ROM(bank);

    setBKGPalettes(1,palettes);

    set_native_tile_data(0,tileCount,tileData);
    fill_bkg_rect(0,0,DEVICE_SCREEN_WIDTH,DEVICE_SCREEN_HEIGHT,0);
    set_bkg_tiles(titleColumn,titleRow,width>>3,height>>3,mapData);
    SWITCH_ROM(_previous_bank);

    DISPLAY_ON;
}