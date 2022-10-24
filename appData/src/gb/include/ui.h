#ifndef UI_H
#define UI_H

#include <gb/gb.h>

#include "gbs_types.h"
#include "bankdata.h"

#define MENU_CANCEL_LAST 1
#define MENU_CANCEL_B    2
#define MENU_SET_START   4

#define TEXT_BUFFER_START 0xCCu
#define TEXT_BUFFER_START_BANK1 0xC0u
#define TEXT_BUFFER_LEN ((UBYTE)(0x100 - TEXT_BUFFER_START))
#define TEXT_BKG_FILL_W 0x00u
#define TEXT_BKG_FILL_B 0xffu
#define TEXT_MAX_LENGTH 255

#define UI_PALETTE 7

#define MENU_OPEN_Y 112
#define WIN_LEFT_X 7
#define MENU_CLOSED_Y (MAXWNDPOSY + 1U)
#define MENU_LAYOUT_INITIAL_X 88
#define MENU_CANCEL_ON_LAST_OPTION 0x01U
#define MENU_CANCEL_ON_B_PRESSED 0x02U

#define ui_bkg_tile   0x07u
#define ui_while_tile 0xC9u
#define ui_black_tile 0xCAu

#define ui_cursor_tile 0xCBu
#define ui_bg_tile 0xC4u

extern UBYTE win_pos_x, win_dest_pos_x;
extern UBYTE win_pos_y, win_dest_pos_y;
extern UBYTE win_speed;

extern UBYTE text_drawn;
extern UBYTE text_wait;

#define TEXT_OPT_DEFAULT 0
#define TEXT_OPT_PRESERVE_POS 1

extern UBYTE text_options;
extern UBYTE text_in_speed;
extern UBYTE text_out_speed;
extern UBYTE text_draw_speed;
extern UBYTE text_ff_joypad;
extern UBYTE text_ff;
extern UBYTE text_bkg_fill;

extern unsigned char ui_text_data[TEXT_MAX_LENGTH];

#define UI_PRINT_LEFTTORIGHT 0
#define UI_PRINT_RIGHTTOLEFT 1

extern UBYTE vwf_direction;
extern font_desc_t vwf_current_font_desc;
extern UBYTE vwf_current_font_bank;
extern UBYTE vwf_current_font_idx;
extern UBYTE vwf_tile_data[16 * 2];

extern UBYTE * text_render_base_addr;

extern UBYTE * text_scroll_addr;
extern UBYTE text_scroll_width, text_scroll_height;
extern UBYTE text_scroll_fill;

extern UBYTE text_sound_mask;
extern UBYTE text_sound_bank;
extern const UBYTE * text_sound_data;

extern const UBYTE ui_time_masks[];

#ifdef CGB
extern UBYTE overlay_priority;
#endif

void ui_init() BANKED;
void ui_update() NONBANKED;  // critical path, NONBANKED for speed

void ui_load_tiles() BANKED;

void ui_set_start_tile(UBYTE start_tile, UBYTE start_tile_bank) BANKED;

#define UI_WAIT_WINDOW  1
#define UI_WAIT_TEXT    2
#define UI_WAIT_BTN_A   4
#define UI_WAIT_BTN_B   8
#define UI_WAIT_BTN_ANY 16

#define UI_DRAW_FRAME   1
#define UI_AUTOSCROLL   2

#define UI_IN_SPEED      -1
#define UI_OUT_SPEED     -2
#define UI_SPEED_INSTANT -3

void ui_run_modal(UBYTE wait_flags) BANKED;  // process UI until closed

inline void ui_set_pos(UBYTE x, UBYTE y) {
    win_pos_y = win_dest_pos_y = y;
    win_pos_x = win_dest_pos_x = x;
}

inline void ui_move_to(UBYTE x, UBYTE y, BYTE speed) {
    win_dest_pos_y = y;
    win_dest_pos_x = x;
    if (speed == UI_SPEED_INSTANT) win_pos_y = y, win_pos_x = x; else win_speed = speed;
}

UBYTE ui_run_menu(menu_item_t * start_item, UBYTE bank, UBYTE options, UBYTE count, UBYTE start_index) BANKED;

#endif
