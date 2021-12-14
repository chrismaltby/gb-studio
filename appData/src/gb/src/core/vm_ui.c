#pragma bank 2

#include <string.h>
#include <stdlib.h>

#include "system.h"
#include "vm.h"
#include "ui.h"
#include "input.h"
#include "scroll.h"
#include "gbs_types.h"
#include "bankdata.h"
#include "data_manager.h"
#include "data/data_bootstrap.h"

void ui_draw_frame(UBYTE x, UBYTE y, UBYTE width, UBYTE height) BANKED;

extern UBYTE _itoa_fmt_len;
UBYTE itoa_fmt(INT16 v, UBYTE * d) OLDCALL BANKED PRESERVES_REGS(b, c);

inline UBYTE itoa_format(INT16 v, UBYTE * d, UBYTE dlen) {
    _itoa_fmt_len = dlen;
    UBYTE len = itoa_fmt(v, d);
    if (vwf_direction != UI_PRINT_LEFTTORIGHT) reverse(d);
    return len;
}

// renders UI text into buffer
void vm_load_text(DUMMY0_t dummy0, DUMMY1_t dummy1, SCRIPT_CTX * THIS, UBYTE nargs) OLDCALL NONBANKED {
    dummy0; dummy1; // suppress warnings

    UBYTE _save = _current_bank;
    SWITCH_ROM(THIS->bank);
    
    const INT16 * args = (INT16 *)THIS->PC;
    const unsigned char * s = THIS->PC + (nargs << 1);
    unsigned char * d = ui_text_data; 
    INT16 idx;

    while (*s) {
        if (*s == '%') {
            idx = *((INT16 *)VM_REF_TO_PTR(*args));
            switch (*++s) {
                // variable value of fixed width, zero padded
                case 'D': 
                    d += itoa_format(idx, d, *++s - '0');
                    break;
                // variable value
                case 'd':
                    d += itoa_format(idx, d, 0);
                    break;
                // char from variable
                case 'c':
                    *d++ = (unsigned char)idx;
                    break;
                // text tempo from variable
                case 't':
                    *d++ = 0x01u;
                    *d++ = (unsigned char)idx + 0x02u;
                    break;
                // font index from variable
                case 'f':
                    *d++ = 0x02u;
                    *d++ = (unsigned char)idx + 0x01u;
                    break;
                // excape % symbol
                case '%':
                    s++;
                default:
                    s--;
                    *d++ = *s++;
                    continue;
            }
        } else {
            *d++ = *s++;
            continue;
        }
        s++; args++;
    }
    *d = 0;

    SWITCH_ROM(_save);
    THIS->PC = s + 1;
}

// start displaying text
void vm_display_text(SCRIPT_CTX * THIS) OLDCALL BANKED {
    THIS;

    INPUT_RESET;
    text_drawn = text_wait = text_ff = FALSE;
}

// switch text rendering to window or background
void vm_switch_text_layer(SCRIPT_CTX * THIS, UBYTE target) OLDCALL BANKED {
    THIS;
    if (target) text_render_base_addr = GetWinAddr(); else text_render_base_addr = GetBkgAddr();
}

// set position of overlayed window
void vm_overlay_setpos(SCRIPT_CTX * THIS, UBYTE pos_x, UBYTE pos_y) OLDCALL BANKED {
    THIS;
    ui_set_pos(pos_x << 3, pos_y << 3);
}

// hides overlayed window
void vm_overlay_hide() OLDCALL BANKED {
    ui_set_pos(0, MENU_CLOSED_Y);
}

// wait until overlay window reaches destination
void vm_overlay_wait(SCRIPT_CTX * THIS, UBYTE is_modal, UBYTE wait_flags) OLDCALL BANKED {
    if (is_modal) {
        ui_run_modal(wait_flags);
        return;
    }

    UBYTE fail = 0;
    if (wait_flags & UI_WAIT_WINDOW)
        if ((win_pos_x != win_dest_pos_x) || (win_pos_y != win_dest_pos_y)) fail = 1;
    if (wait_flags & UI_WAIT_TEXT)
        if (!text_drawn) fail = 1;
    if (wait_flags & UI_WAIT_BTN_A)
        if (!INPUT_A_PRESSED) fail = 1;
    if (wait_flags & UI_WAIT_BTN_B)
        if (!INPUT_B_PRESSED) fail = 1;
    if (wait_flags & UI_WAIT_BTN_ANY)
        if (!INPUT_ANY_PRESSED) fail = 1;

    if (fail) {
        THIS->waitable = 1;
        THIS->PC -= INSTRUCTION_SIZE + sizeof(is_modal) + sizeof(wait_flags);
    }
}

// set position of overlayed window
void vm_overlay_move_to(SCRIPT_CTX * THIS, UBYTE pos_x, UBYTE pos_y, BYTE speed) OLDCALL BANKED {
    THIS;
    if (speed == UI_IN_SPEED) {
        speed = text_in_speed;
    } else if (speed == UI_OUT_SPEED) {
        speed = text_out_speed;
    }
    ui_move_to(pos_x << 3, pos_y << 3, speed);
}

// set autoscroll parameters
void vm_overlay_set_scroll(SCRIPT_CTX * THIS, UBYTE x, UBYTE y, UBYTE w, UBYTE h, UBYTE color) OLDCALL BANKED {
    THIS;
    text_scroll_addr = GetWinAddr() + (y << 5) + x;
    text_scroll_width = w; text_scroll_height = h;
    text_scroll_fill = (color) ? ui_while_tile : ui_black_tile;
}

// clears overlay window
void vm_overlay_clear(SCRIPT_CTX * THIS, UBYTE x, UBYTE y, UBYTE w, UBYTE h, UBYTE color, UBYTE options) OLDCALL BANKED {
    THIS;
    text_bkg_fill = (color) ? TEXT_BKG_FILL_W : TEXT_BKG_FILL_B;
    if (options & UI_DRAW_FRAME) {
        ui_draw_frame(x, y, w, h);
        if (options & UI_AUTOSCROLL) vm_overlay_set_scroll(THIS, x + 1, y + 1, w - 2, h - 2, color);
    } else {
#ifdef CGB
        if (_is_CGB) {
            VBK_REG = 1;
            fill_win_rect(x, y, w, h, (UI_PALETTE & 0x07u));        
            VBK_REG = 0;
        }
#endif    
        fill_win_rect(x, y, w, h, ((color) ? ui_while_tile : ui_black_tile));
        if (options & UI_AUTOSCROLL) vm_overlay_set_scroll(THIS, x, y, w, h, color);
    }
}

// shows overlay
void vm_overlay_show(SCRIPT_CTX * THIS, UBYTE pos_x, UBYTE pos_y, UBYTE color, UBYTE options) OLDCALL BANKED {
    THIS;
    if ((pos_x < 20u) && (pos_y < 18u)) vm_overlay_clear(THIS, 0, 0, 20u - pos_x, 18u - pos_y, color, options);
    ui_set_pos(pos_x << 3, pos_y << 3);
}

void vm_choice(SCRIPT_CTX * THIS, INT16 idx, UBYTE options, UBYTE count) OLDCALL BANKED {
    INT16 * v = VM_REF_TO_PTR(idx);
    *v = (count) ? ui_run_menu((menu_item_t *)(THIS->PC), THIS->bank, options, count) : 0;
    THIS->PC += sizeof(menu_item_t) * count;
}

void vm_load_frame(SCRIPT_CTX * THIS, UBYTE bank, UBYTE * offset) OLDCALL BANKED {
    THIS;
    ui_load_frame_tiles(offset, bank);
}

void vm_load_cursor(SCRIPT_CTX * THIS, UBYTE bank, UBYTE * offset) OLDCALL BANKED {
    THIS;
    ui_load_cursor_tile(offset, bank);
}

void vm_set_font(SCRIPT_CTX * THIS, UBYTE font_index) OLDCALL BANKED {
    THIS;
    vwf_current_font_bank = ui_fonts[font_index].bank;
    MemcpyBanked(&vwf_current_font_desc, ui_fonts[font_index].ptr, sizeof(font_desc_t), vwf_current_font_bank);
}

void vm_set_print_dir(SCRIPT_CTX * THIS, UBYTE print_dir) OLDCALL BANKED {
    THIS;
    vwf_direction = print_dir & 1;
}

void vm_overlay_scroll(SCRIPT_CTX * THIS, UBYTE x, UBYTE y, UBYTE w, UBYTE h, UBYTE color) OLDCALL BANKED {
    THIS;
    UBYTE * base_addr = GetWinAddr() + (y << 5) + x;
    scroll_rect(base_addr, w, h, ((color) ? ui_while_tile : ui_black_tile));
#ifdef CGB
    if (_is_CGB) {
        VBK_REG = 1;
        scroll_rect(base_addr, w, h, (UI_PALETTE & 0x07u));
        VBK_REG = 0;
    }
#endif
}

void set_xy_win_submap(const UBYTE * source, UBYTE bank, UBYTE width, UBYTE x, UBYTE y, UBYTE w, UBYTE h) OLDCALL;

void vm_overlay_set_submap(SCRIPT_CTX * THIS, UBYTE x, UBYTE y, UBYTE w, UBYTE h, UBYTE scene_x, UBYTE scene_y) OLDCALL BANKED {
    THIS;
    UWORD offset = (scene_y * image_tile_width) + scene_x;
#ifdef CGB
    if (_is_CGB) {
        VBK_REG = 1;
        set_xy_win_submap(image_attr_ptr + offset, image_bank, image_tile_width, x, y, w, h);
        VBK_REG = 0;
    }
#endif
    set_xy_win_submap(image_ptr + offset, image_bank, image_tile_width, x, y, w, h);
}