#pragma bank 1

#include <gb/gb.h>

#include "interrupts.h"

#include "scroll.h"
#include "parallax.h"
#include "ui.h"

#define LYC_SYNC_VALUE 153u

UBYTE hide_sprites = FALSE;
UBYTE show_actors_on_overlay = FALSE;

void remove_LCD_ISRs() CRITICAL BANKED {
    remove_LCD(parallax_LCD_isr);
    remove_LCD(simple_LCD_isr);
    remove_LCD(fullscreen_LCD_isr);
    LCDC_REG &= ~LCDCF_BG8000;
}

void simple_LCD_isr() NONBANKED {
    if (LYC_REG == LYC_SYNC_VALUE) {
        SCX_REG = draw_scroll_x;
        SCY_REG = draw_scroll_y;
        if (WY_REG) {
            if (!hide_sprites) SHOW_SPRITES;
            LYC_REG = WY_REG - 1; 
        } else if ((WX_REG == 7u) && (show_actors_on_overlay == FALSE)) HIDE_SPRITES;
    } else {
        if ((LY_REG < SCREENHEIGHT) && (WX_REG == 7u) && (show_actors_on_overlay == FALSE)) {
            while (STAT_REG & STATF_BUSY) ;
            HIDE_SPRITES;
        }
        LYC_REG = LYC_SYNC_VALUE;
    }
}

void fullscreen_LCD_isr() NONBANKED {
    if (LYC_REG == LYC_SYNC_VALUE) {
        LCDC_REG &= ~LCDCF_BG8000;
        SCX_REG = draw_scroll_x;
        SCY_REG = draw_scroll_y;
        if (!hide_sprites) SHOW_SPRITES;
        LYC_REG = (9 * 8) - 1;    
    } else {
        while (STAT_REG & STATF_BUSY) ;
        LCDC_REG |= LCDCF_BG8000;
        LYC_REG = LYC_SYNC_VALUE;
    }
}

void VBL_isr() NONBANKED {
    if ((win_pos_y < MAXWNDPOSY) && (win_pos_x < SCREENWIDTH - 1)) {
        WX_REG = win_pos_x + 7u;
        WY_REG = win_pos_y;
        SHOW_WIN;
    } else {
        HIDE_WIN;
    }
    scroll_shadow_update();
}
