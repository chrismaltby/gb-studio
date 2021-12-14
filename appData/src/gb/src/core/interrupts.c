#pragma bank 1

#include <gb/gb.h>

#include "interrupts.h"

#include "scroll.h"
#include "parallax.h"
#include "ui.h"

UBYTE hide_sprites = 0;

void remove_LCD_ISRs() CRITICAL BANKED {
    remove_LCD(parallax_LCD_isr);
    remove_LCD(simple_LCD_isr);
    remove_LCD(fullscreen_LCD_isr);
    LCDC_REG &= ~LCDCF_BG8000;
}

void simple_LCD_isr() NONBANKED {
    if (LYC_REG == 0) {
        SCX_REG = draw_scroll_x;
        SCY_REG = draw_scroll_y;
        if (!hide_sprites) SHOW_SPRITES;
        if (win_pos_y) LYC_REG = win_pos_y - 1; else LYC_REG = 0;
    } else {
        LYC_REG = 0;
        if (hide_sprites) return;
        if ((LY_REG < SCREENHEIGHT) && (WX_REG == 7u)) HIDE_SPRITES;
    }
}

void fullscreen_LCD_isr() NONBANKED {
    if (LYC_REG == 0) {
        LCDC_REG &= ~LCDCF_BG8000;
        SCX_REG = draw_scroll_x;
        SCY_REG = draw_scroll_y;
        if (!hide_sprites) SHOW_SPRITES;
        LYC_REG = (9 * 8) - 1;    
    } else {
        LCDC_REG |= LCDCF_BG8000;
        LYC_REG = 0;
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
