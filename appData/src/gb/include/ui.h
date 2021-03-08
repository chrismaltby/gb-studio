#ifndef UI_H
#define UI_H

#include <gb/gb.h>

#include "bankdata.h"

#define MENU_ENABLE 1
#define MENU_LAYOUT 2
#define MENU_CANCEL_LAST 1
#define MENU_CANCEL_B 2

#define TEXT_BUFFER_START 0xCCU
#define TEXT_BKG_FILL_W 0x00u
#define TEXT_BKG_FILL_B 0xffu
#define TEXT_MAX_LENGTH 220

#define AVATAR_WIDTH 2
#define SELECTOR_WIDTH 1
#define AVATAR_TILE_SIZE 4
#define MENU_OPEN_Y 112
#define WIN_LEFT_X 7
#define MENU_CLOSED_Y (MAXWNDPOSY + 1U)
#define TEXT_BUFFER_START 0xCCU
#define MENU_LAYOUT_INITIAL_X 88
#define MENU_CANCEL_ON_LAST_OPTION 0x01U
#define MENU_CANCEL_ON_B_PRESSED 0x02U
#define MENU_LAYOUT_2_COLUMN 1
#define MENU_LAYOUT_1_COLUMN 0

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
extern UBYTE text_line_count;

extern UBYTE avatar_enabled;
extern UBYTE menu_enabled;
extern UBYTE menu_item_count;
extern UBYTE menu_layout;
extern UBYTE menu_cancel_on_last_option;
extern UBYTE menu_cancel_on_b;
extern UBYTE current_text_speed;
extern UBYTE text_in_speed;
extern UBYTE text_out_speed;
extern UBYTE text_draw_speed;
extern UBYTE text_ff_joypad;
extern UBYTE text_ff;
extern UBYTE text_bkg_fill;

extern unsigned char ui_text_data[TEXT_MAX_LENGTH];

extern far_ptr_t font_image_ptr;

void ui_init() __banked;
void ui_update() __nonbanked;  // critical path, __nonbanked for speed

void ui_load_tiles() __banked; 

#define UI_WAIT_WINDOW  1
#define UI_WAIT_TEXT    2
#define UI_WAIT_BTN_A   4
#define UI_WAIT_BTN_B   8
#define UI_WAIT_BTN_ANY 16

void ui_run_modal(UBYTE wait_flags) __banked;  // process UI until closed

inline void ui_set_pos(UBYTE x, UBYTE y) {
    win_pos_y = win_dest_pos_y = y;
    win_pos_x = win_dest_pos_x = x;
}

inline void ui_move_to(UBYTE x, UBYTE y, UBYTE speed) {
    win_dest_pos_y = y;
    win_dest_pos_x = x;
    if (speed == 0) win_pos_y = y, win_pos_x = x; else win_speed = speed;
}

UBYTE ui_run_menu() __banked;

inline void ui_load_frame_tiles(const UBYTE * offset, UBYTE bank) {
    SetBankedBkgData(192, 9, offset, bank);
}

inline void ui_load_cursor_tile(const UBYTE * offset, UBYTE bank) {
    SetBankedBkgData(ui_cursor_tile, 1, offset, bank);
}

#endif
