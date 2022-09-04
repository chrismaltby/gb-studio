// must be in the same bank with ui_a.s
#pragma bank 1

#include <string.h>

#include "system.h"
#include "ui.h"
#include "game_time.h"
#include "data/data_bootstrap.h"
#include "data/frame_image.h"
#include "data/cursor_image.h"
#include "bankdata.h"
#include "camera.h"
#include "scroll.h"
#include "input.h"
#include "math.h"
#include "actor.h"
#include "projectiles.h"
#include "shadow.h"
#include "music_manager.h"

#define ui_frame_tl_tiles 0xC0u
#define ui_frame_bl_tiles 0xC6u
#define ui_frame_tr_tiles 0xC2u
#define ui_frame_br_tiles 0xC8u
#define ui_frame_t_tiles  0xC1u
#define ui_frame_b_tiles  0xC7u
#define ui_frame_l_tiles  0xC3u
#define ui_frame_r_tiles  0xC5u
#define ui_frame_bg_tiles 0xC4u

UBYTE win_pos_x, win_dest_pos_x;
UBYTE win_pos_y, win_dest_pos_y;
UBYTE win_speed;

UBYTE text_drawn;
UBYTE current_text_speed;
UBYTE text_wait;

UBYTE text_options;
UBYTE text_in_speed;
UBYTE text_out_speed;
UBYTE text_draw_speed;
UBYTE text_ff_joypad;
UBYTE text_ff;
UBYTE text_bkg_fill;

unsigned char ui_text_data[TEXT_MAX_LENGTH];

// char printer internals
static UBYTE * ui_text_ptr;
static UBYTE * ui_dest_ptr;
static UBYTE * ui_dest_base;
static UBYTE ui_current_tile;
static UBYTE ui_current_tile_bank;
static UBYTE ui_prev_tile;
static UBYTE ui_prev_tile_bank;
static UBYTE vwf_current_offset;
//UBYTE vwf_tile_data[16 * 2]; // moved into absolute.c to free 64 bytes of WRAM (move after shadow_OAM[] which is 256-boundary aligned)
UBYTE vwf_current_mask;
UBYTE vwf_current_rotate;
UBYTE vwf_inverse_map;
UBYTE vwf_direction;

font_desc_t vwf_current_font_desc;
UBYTE vwf_current_font_bank;
UBYTE vwf_current_font_idx;

UBYTE * text_render_base_addr;

UBYTE * text_scroll_addr;
UBYTE text_scroll_width, text_scroll_height;
UBYTE text_scroll_fill;

UBYTE text_sound_mask;
UBYTE text_sound_bank;
const UBYTE * text_sound_data;

#ifdef CGB
UBYTE overlay_priority;
#endif

void ui_init() BANKED {
    vwf_direction               = UI_PRINT_LEFTTORIGHT;
    vwf_current_font_idx        = 0;
    vwf_current_font_bank       = ui_fonts[0].bank;
    MemcpyBanked(&vwf_current_font_desc, ui_fonts[0].ptr, sizeof(font_desc_t), vwf_current_font_bank);

    text_options                = TEXT_OPT_DEFAULT;
    text_in_speed               = 0;
    text_out_speed              = 0;
    text_ff_joypad              = TRUE;
    text_bkg_fill               = TEXT_BKG_FILL_W;

    ui_text_ptr                 = 0;

    vwf_current_offset          = 0;

    ui_current_tile             = TEXT_BUFFER_START;
    ui_current_tile_bank        = 0;
    ui_prev_tile                = TEXT_BUFFER_START;
    ui_prev_tile_bank           = 0;

    ui_set_pos(0, MENU_CLOSED_Y);

    win_speed                   = 1;
    text_drawn                  = TRUE;
    text_draw_speed             = 1;
    current_text_speed          = 0;

    ui_dest_ptr = ui_dest_base  = (text_render_base_addr = GetWinAddr()) + 32 + 1;

    text_scroll_addr            = GetWinAddr();
    text_scroll_width           = 20;
    text_scroll_height          = 8;
    text_scroll_fill            = ui_while_tile;

    text_sound_bank             = SFX_STOP_BANK;

    ui_load_tiles();

#ifdef CGB
    overlay_priority            = S_PRIORITY;
#endif
}

void ui_load_tiles() BANKED {
    // load frame
    SetBankedBkgData(ui_frame_tl_tiles, 9, frame_image, BANK(frame_image));
    // load cursor
    SetBankedBkgData(ui_cursor_tile, 1, cursor_image, BANK(cursor_image));

    memset(vwf_tile_data, TEXT_BKG_FILL_W, 16);
    set_bkg_data(ui_while_tile, 1, vwf_tile_data);
    memset(vwf_tile_data, TEXT_BKG_FILL_B, 16);
    set_bkg_data(ui_black_tile, 1, vwf_tile_data);
}

void ui_draw_frame_row(void * dest, UBYTE tile, UBYTE width) OLDCALL;

void ui_draw_frame(UBYTE x, UBYTE y, UBYTE width, UBYTE height) BANKED {
    if (height == 0) return;
#ifdef CGB
    if (_is_CGB) {
        VBK_REG = 1;
        fill_win_rect(x, y, width, height, overlay_priority | (UI_PALETTE & 0x07u));
        VBK_REG = 0;
    }
#endif
    UBYTE * base_addr = GetWinAddr() + (y << 5) + x;
    ui_draw_frame_row(base_addr, ui_frame_tl_tiles, width);
    if (--height == 0) return;
    if (height > 1)
        for (UBYTE i = height - 1; i != 0; i--) {
            base_addr += 32;
            ui_draw_frame_row(base_addr, ui_frame_l_tiles, width);
        }
    base_addr += 32;
    ui_draw_frame_row(base_addr, ui_frame_bl_tiles, width);
}

inline void ui_load_tile(const UBYTE * tiledata, UBYTE bank) {
#ifdef CGB
    VBK_REG = ui_current_tile_bank;
#endif
    SetBankedBkgData(ui_current_tile, 1, tiledata, bank);
#ifdef CGB
    VBK_REG = 0;
#endif
}
inline void ui_load_wram_tile(const UBYTE * tiledata) {
#ifdef CGB
    VBK_REG = ui_current_tile_bank;
#endif
    set_bkg_data(ui_current_tile, 1, tiledata);
#ifdef CGB
    VBK_REG = 0;
#endif
}

inline void ui_next_tile() {
    ui_prev_tile_bank = ui_current_tile_bank;
    ui_prev_tile = ui_current_tile++;
    if (ui_current_tile) return;
#ifdef CGB
    if (_is_CGB) {
        ui_current_tile_bank++;
        ui_current_tile_bank &= 1;
        ui_current_tile = (ui_current_tile_bank) ? TEXT_BUFFER_START_BANK1 : TEXT_BUFFER_START;
    } else {
        ui_current_tile = TEXT_BUFFER_START;
    }
#else
    ui_current_tile = TEXT_BUFFER_START;
#endif
}

void ui_print_reset() {
    if (vwf_current_offset) ui_next_tile();
    vwf_current_offset = 0;
    memset(vwf_tile_data, text_bkg_fill, sizeof(vwf_tile_data));
}

void ui_set_start_tile(UBYTE start_tile, UBYTE start_tile_bank) BANKED {
    ui_prev_tile = ui_current_tile = start_tile;
    ui_prev_tile_bank = ui_current_tile_bank = start_tile_bank;
    vwf_current_offset = 0;
    memset(vwf_tile_data, text_bkg_fill, sizeof(vwf_tile_data));
}

void ui_print_shift_char(void * dest, const void * src, UBYTE bank) OLDCALL;
UWORD ui_print_make_mask_lr(UBYTE width, UBYTE ofs) OLDCALL;
UWORD ui_print_make_mask_rl(UBYTE width, UBYTE ofs) OLDCALL;
void ui_swap_tiles();

UBYTE ui_print_render(const unsigned char ch) {
    UBYTE letter = (vwf_current_font_desc.attr & FONT_RECODE) ? ReadBankedUBYTE(vwf_current_font_desc.recode_table + (ch & vwf_current_font_desc.mask), vwf_current_font_bank) : ch;
    const UBYTE * bitmap = vwf_current_font_desc.bitmaps + letter * 16u;
    if (vwf_current_font_desc.attr & FONT_VWF) {
        vwf_inverse_map = (vwf_current_font_desc.attr & FONT_VWF_1BIT) ? text_bkg_fill : 0u;
        UBYTE width = ReadBankedUBYTE(vwf_current_font_desc.widths + letter, vwf_current_font_bank);
        if (vwf_direction == UI_PRINT_LEFTTORIGHT) {
            vwf_current_rotate = vwf_current_offset;
            UWORD masks = ui_print_make_mask_lr(width, vwf_current_offset);
            vwf_current_mask = (UBYTE)masks;
            ui_print_shift_char(vwf_tile_data, bitmap, vwf_current_font_bank);

            if ((UBYTE)(vwf_current_offset + width) > 8u) {
                vwf_current_rotate = (8u - vwf_current_offset) | 0x80u;
                vwf_current_mask = (UBYTE)(masks >> 8u);
                ui_print_shift_char(vwf_tile_data + 16u, bitmap, vwf_current_font_bank);
            }
        } else {
            UBYTE dx = (8u - vwf_current_offset);
            vwf_current_rotate =  (width < dx) ? (dx - width) : (width - dx) | 0x80u;
            UWORD masks = ui_print_make_mask_rl(width, vwf_current_offset);
            vwf_current_mask = (UBYTE)masks;
            ui_print_shift_char(vwf_tile_data, bitmap, vwf_current_font_bank);

            if ((UBYTE)(vwf_current_offset + width) > 8u) {
                vwf_current_rotate = 16u - (UBYTE)(vwf_current_offset + width);
                vwf_current_mask = (UBYTE)(masks >> 8u);
                ui_print_shift_char(vwf_tile_data + 16u, bitmap, vwf_current_font_bank);
            }
        }
        vwf_current_offset += width;

        ui_load_wram_tile(vwf_tile_data);
        if (vwf_current_offset > 7u) {
            ui_swap_tiles();
            vwf_current_offset -= 8u;
            ui_next_tile();
            if (vwf_current_offset) ui_load_wram_tile(vwf_tile_data);
            return TRUE;
        }
        return FALSE;
    } else {
        if (vwf_current_offset) ui_next_tile();
        ui_load_tile(bitmap, vwf_current_font_bank);
        ui_next_tile();
        vwf_current_offset = 0u;
        return TRUE;
    }
}

inline void ui_set_tile(UBYTE * addr, UBYTE tile, UBYTE bank) {
#ifdef CGB
    if (_is_CGB) {
        VBK_REG = 1;
        SetTile(addr, overlay_priority | ((bank) ? ((UI_PALETTE & 0x07u) | 0x08u) : (UI_PALETTE & 0x07u)));
        VBK_REG = 0;
    }
#else
    bank;
#endif
    SetTile(addr, tile);
}

UBYTE ui_draw_text_buffer_char() BANKED {
    static UBYTE current_font_idx, current_text_bkg_fill, current_vwf_direction, current_text_ff_joypad, current_text_draw_speed;

    if ((text_ff_joypad) && (INPUT_A_OR_B_PRESSED)) text_ff = TRUE;

    if ((!text_ff) && (text_wait)) {
        text_wait--;
        return FALSE;
    }

    if (ui_text_ptr == 0) {
        // set the delay mask
        current_text_speed = ui_time_masks[text_draw_speed];
        // save font and color global properties
        current_font_idx        = vwf_current_font_idx;
        current_text_bkg_fill   = text_bkg_fill;
        current_vwf_direction   = vwf_direction;
        current_text_ff_joypad  = text_ff_joypad;
        current_text_draw_speed = text_draw_speed;
        // reset to first line
        // current char pointer
        ui_text_ptr = ui_text_data;
        // VRAM destination
        if ((text_options & TEXT_OPT_PRESERVE_POS) == 0) {
            ui_dest_base = text_render_base_addr + 32 + 1;                  // gotoxy(1,1)
            if (vwf_direction == UI_PRINT_RIGHTTOLEFT) ui_dest_base += 17;  // right_to_left initial pos correction
            // initialize current pointer with corrected base value
            ui_dest_ptr = ui_dest_base;
        }
        // tileno destination
        ui_print_reset();
    }

    // normally runs once, but if control code encountered, then process them until printable symbol or terminator
    while (TRUE) {
        switch (*ui_text_ptr) {
            case 0x00: {
                ui_text_ptr = 0;
                text_drawn = TRUE;
                if (vwf_current_font_idx != current_font_idx) {
                    const far_ptr_t * font = ui_fonts + vwf_current_font_idx;
                    MemcpyBanked(&vwf_current_font_desc, font->ptr, sizeof(font_desc_t), vwf_current_font_bank = font->bank);
                }
                text_bkg_fill = current_text_bkg_fill;
                vwf_direction = current_vwf_direction;
                text_ff_joypad = current_text_ff_joypad;
                text_draw_speed = current_text_draw_speed;
                return FALSE;
            }
            case 0x01:
                // set text speed
                text_draw_speed = (*(++ui_text_ptr) - 1u) & 0x07u;
                current_text_speed = ui_time_masks[text_draw_speed];
                break;
            case 0x02: {
                // set current font
                current_font_idx = *(++ui_text_ptr) - 1u;
                const far_ptr_t * font = ui_fonts + current_font_idx;
                UBYTE old_flags = vwf_current_font_desc.attr;
                MemcpyBanked(&vwf_current_font_desc, font->ptr, sizeof(font_desc_t), vwf_current_font_bank = font->bank);
                if ((vwf_current_offset) && ((old_flags & FONT_VWF) != 0) && ((vwf_current_font_desc.attr & FONT_VWF) == 0)) {
                    ui_dest_ptr++;
                }
                break;
            }
            case 0x03:
                // gotoxy
                ui_dest_ptr = ui_dest_base = text_render_base_addr + (*++ui_text_ptr - 1u) + (*++ui_text_ptr - 1u) * 32u;
                if (vwf_current_offset) ui_print_reset();
                break;
            case 0x04: {
                // relative gotoxy
                BYTE dx = (BYTE)(*++ui_text_ptr);
                if (dx > 0) dx--;
                BYTE dy = (BYTE)(*++ui_text_ptr);
                if (dy > 0) dy--;
                ui_dest_base = ui_dest_ptr += dx + dy * 32u;
                if (vwf_current_offset) ui_print_reset();
                break;
            }
            case 0x06:
                // wait for input cancels fast forward
                if (text_ff) {
                    text_ff = FALSE;
                    text_ff_joypad = FALSE;
                    INPUT_RESET;
                }
                // if high speed then skip waiting
                if (text_draw_speed == 0) {
                    ui_text_ptr++;
                    break;
                }
                // wait for key press (parameter is a mask)
                if ((joy & ~last_joy) & *++ui_text_ptr) {
                    text_ff_joypad = current_text_ff_joypad;
                    INPUT_RESET;
                    break;
                }
                ui_text_ptr--;
                return FALSE;
            case 0x07:
                // set text color
                text_bkg_fill = (*++ui_text_ptr & 1u) ? TEXT_BKG_FILL_W : TEXT_BKG_FILL_B;
                break;
            case 0x08:
                // text direction (left-to-right or right-to-left)
                vwf_direction = (*++ui_text_ptr & 1u) ? UI_PRINT_LEFTTORIGHT : UI_PRINT_RIGHTTOLEFT;
                break;
            case 0x09:
                break;
            case '\r':
                // line feed
                if ((ui_dest_ptr + 32u) > (UBYTE *)((((UWORD)text_scroll_addr + ((UWORD)text_scroll_height << 5)) & 0xFFE0) - 1)) {
                    scroll_rect(text_scroll_addr, text_scroll_width, text_scroll_height, text_scroll_fill);
#ifdef CGB
                    if (_is_CGB) {
                        VBK_REG = 1;
                        scroll_rect(text_scroll_addr, text_scroll_width, text_scroll_height, overlay_priority | (UI_PALETTE & 0x07u));
                        VBK_REG = 0;
                    }
#endif
                    ui_dest_ptr = ui_dest_base;
                } else {
                    ui_dest_ptr = ui_dest_base += 32u;
                }
                if (vwf_current_offset) ui_print_reset();
                break;
            case '\n':
                // carriage return
                ui_dest_ptr = ui_dest_base += 32u;
                if (vwf_current_offset) ui_print_reset();
                break;
            case 0x05:
                // escape symbol
                ui_text_ptr++;
                // fall down to default
            default:
                if (ui_print_render(*ui_text_ptr)) {
                    ui_set_tile(ui_dest_ptr, ui_prev_tile, ui_prev_tile_bank);
                    if (vwf_direction == UI_PRINT_LEFTTORIGHT)  ui_dest_ptr++; else ui_dest_ptr--;
                }
                if (vwf_current_offset) ui_set_tile(ui_dest_ptr, ui_current_tile, ui_current_tile_bank);
                ui_text_ptr++;
                return TRUE;
        }
        ui_text_ptr++;
    }
}

void ui_update() NONBANKED {
    UBYTE is_moving = FALSE;

    // y should always move first
    if (win_pos_y != win_dest_pos_y) {
        if ((game_time & ui_time_masks[win_speed]) == 0) {
            UBYTE interval = (win_speed == 0) ? 2u : 1u;
            // move window up/down
            if (win_pos_y < win_dest_pos_y) win_pos_y += interval; else win_pos_y -= interval;
        }
        is_moving = TRUE;
    }
    if (win_pos_x != win_dest_pos_x) {
        if ((game_time & ui_time_masks[win_speed]) == 0) {
            UBYTE interval = (win_speed == 0) ? 2u : 1u;
            // move window left/right
            if (win_pos_x < win_dest_pos_x) win_pos_x += interval; else win_pos_x -= interval;
        }
        is_moving = TRUE;
    }

    // don't draw text while moving
    if (is_moving) return;
    // all drawn - nothing to do
    if (text_drawn) return;
    // too fast - wait
    if ((!INPUT_A_OR_B_PRESSED) && (game_time & current_text_speed)) return;
    // render next char
    UBYTE letter_drawn;
    do {
        letter_drawn = ui_draw_text_buffer_char();
    } while (((text_ff) || (text_draw_speed == 0)) && (!text_drawn));
    // play sound
    if ((letter_drawn) && (text_sound_bank != SFX_STOP_BANK)) music_play_sfx(text_sound_bank, text_sound_data, text_sound_mask, MUSIC_SFX_PRIORITY_NORMAL);
}

UBYTE ui_run_menu(menu_item_t * start_item, UBYTE bank, UBYTE options, UBYTE count, UBYTE start_index) BANKED {
    menu_item_t current_menu_item;
    UBYTE current_index = ((options & MENU_SET_START) ? start_index : 1u), next_index = 0u;
    // copy first menu item
    MemcpyBanked(&current_menu_item, start_item + (current_index - 1u), sizeof(menu_item_t), bank);

    // draw menu cursor
#ifdef CGB
    if (_is_CGB) {
        VBK_REG = 1;
        set_win_tile_xy(current_menu_item.X, current_menu_item.Y, overlay_priority | (UI_PALETTE & 0x07u));
        VBK_REG = 0;
    }
#endif
    set_win_tile_xy(current_menu_item.X, current_menu_item.Y, ui_cursor_tile);

    // menu loop
    while (TRUE) {
        input_update();
        ui_update();

        toggle_shadow_OAM();
        camera_update();
        scroll_update();
        actors_update();
        projectiles_render();
        activate_shadow_OAM();

        game_time++;
        wait_vbl_done();

        if (INPUT_UP_PRESSED) {
            next_index = current_menu_item.iU;
        } else if (INPUT_DOWN_PRESSED) {
            next_index = current_menu_item.iD;
        } else if (INPUT_LEFT_PRESSED) {
            next_index = current_menu_item.iL;
        } else if (INPUT_RIGHT_PRESSED) {
            next_index = current_menu_item.iR;
        } else if (INPUT_A_PRESSED) {
            return ((current_index == count) && (options & MENU_CANCEL_LAST)) ? 0u : current_index;
        } else if ((INPUT_B_PRESSED) && (options & MENU_CANCEL_B))  {
            return 0u;
        } else {
            continue;
        }

        if (!next_index) continue;

        // update current index
        current_index = next_index;
        // erase old cursor
#ifdef CGB
        if (_is_CGB) {
            VBK_REG = 1;
            set_win_tile_xy(current_menu_item.X, current_menu_item.Y, overlay_priority | (UI_PALETTE & 0x07u));
            VBK_REG = 0;
        }
#endif
        set_win_tile_xy(current_menu_item.X, current_menu_item.Y, ui_bg_tile);
        // read menu data
        MemcpyBanked(&current_menu_item, start_item + current_index - 1u, sizeof(menu_item_t), bank);
        // put new cursor
#ifdef CGB
        if (_is_CGB) {
            VBK_REG = 1;
            set_win_tile_xy(current_menu_item.X, current_menu_item.Y, overlay_priority | (UI_PALETTE & 0x07u));
            VBK_REG = 0;
        }
#endif
        set_win_tile_xy(current_menu_item.X, current_menu_item.Y, ui_cursor_tile);
        // reset next index
        next_index = 0;
    };
}

void ui_run_modal(UBYTE wait_flags) BANKED {
    UBYTE fail;
    do {
        fail = FALSE;

        if (wait_flags & UI_WAIT_WINDOW)
            if ((win_pos_x != win_dest_pos_x) || (win_pos_y != win_dest_pos_y)) fail = TRUE;
        if (wait_flags & UI_WAIT_TEXT)
            if (!text_drawn) fail = TRUE;
        if (wait_flags & UI_WAIT_BTN_A)
            if (!INPUT_A_PRESSED) fail = TRUE;
        if (wait_flags & UI_WAIT_BTN_B)
            if (!INPUT_B_PRESSED) fail = TRUE;
        if (wait_flags & UI_WAIT_BTN_ANY)
            if (!INPUT_ANY_PRESSED) fail = TRUE;

        if (!fail) return;

        ui_update();

        toggle_shadow_OAM();
        camera_update();
        scroll_update();
        actors_update();
        projectiles_render();
        activate_shadow_OAM();

        game_time++;
        wait_vbl_done();
        input_update();
    } while (fail);
}
