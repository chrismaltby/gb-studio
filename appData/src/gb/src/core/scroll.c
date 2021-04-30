#pragma bank 1

#include "scroll.h"

#include <string.h>

#include "system.h"
#include "actor.h"
#include "camera.h"
#include "data_manager.h"
#include "game_time.h"
#include "math.h"
#include "fade_manager.h"
#include "parallax.h"
#include "palette.h"

// put submap of a large map to screen
void set_bkg_submap(UINT8 x, UINT8 y, UINT8 w, UINT8 h, const unsigned char *map, UINT8 map_w);

void scroll_queue_row(UBYTE x, UBYTE y);
void scroll_queue_col(UBYTE x, UBYTE y);
void scroll_load_pending_row();
void scroll_load_pending_col();
void scroll_load_row(UBYTE x, UBYTE y);
void scroll_load_col(UBYTE x, UBYTE y, UBYTE height);
void scroll_render_rows(INT16 scroll_x, INT16 scroll_y, BYTE row_offset, BYTE n_rows);
UBYTE scroll_viewport(parallax_row_t * port);

INT16 scroll_x;
INT16 scroll_y;
INT16 draw_scroll_x;
INT16 draw_scroll_y;
UINT16 scroll_x_max;
UINT16 scroll_y_max;
BYTE scroll_offset_x;
BYTE scroll_offset_y;
UBYTE pending_h_x, pending_h_y;
UBYTE pending_h_i;
UBYTE pending_w_x, pending_w_y;
UBYTE pending_w_i;
INT16 current_row, new_row;
INT16 current_col, new_col;

void scroll_init() __banked {
    draw_scroll_x   = 0;
    draw_scroll_y   = 0;
    scroll_x_max    = 0;
    scroll_y_max    = 0;
    scroll_offset_x = 0;
    scroll_offset_y = 0;
    scroll_reset();
}

void scroll_reset() __banked {
    pending_w_i     = 0;
    pending_h_i     = 0;
    scroll_x        = 0x7FFF;
    scroll_y        = 0x7FFF;
}

void scroll_update() __banked {
    INT16 x, y;
    UBYTE render = FALSE;

    x = camera_x - (SCREENWIDTH >> 1);
    y = camera_y - (SCREENHEIGHT >> 1);

    if (x & 0x8000u) {  // check for negative signed bit
        x = 0u;
    } else if (x > scroll_x_max) {
        x = scroll_x_max;
    }
    if (y & 0x8000u) {
        y = 0u;
    } else if (y > scroll_y_max) {
        y = scroll_y_max;
    }

    current_col = scroll_x >> 3;
    current_row = scroll_y >> 3;
    new_col = x >> 3;
    new_row = y >> 3;

    scroll_x = x;
    scroll_y = y;
    draw_scroll_x = x + scroll_offset_x;
    draw_scroll_y = y + scroll_offset_y;

    if (scroll_viewport(parallax_rows)) return;
    if (scroll_viewport(parallax_rows + 1)) return;
    scroll_viewport(parallax_rows + 2);
}

UBYTE scroll_viewport(parallax_row_t * port) {
    if (port->shift) {
        // Parallax
        UINT16 shift_scroll_x;
        if (port->shift == 127) {
            shift_scroll_x = 0;
        } else if (port->shift < 0) {
            shift_scroll_x = draw_scroll_x << (-port->shift);
        } else {
            shift_scroll_x = draw_scroll_x >> port->shift;
        }

        port->scx = shift_scroll_x;
        UBYTE shift_col = shift_scroll_x >> 3;

        // If column is +/- 1 just render next column
        if (current_col == new_col - 1) {
            // Render right column
            UBYTE x = shift_col - SCREEN_PAD_LEFT + SCREEN_TILE_REFRES_W - 1;
            scroll_load_col(x, port->start_tile, port->tile_height);
        } else if (current_col == new_col + 1) {
            // Render left column
            UBYTE x = MAX(0, shift_col - SCREEN_PAD_LEFT);
            scroll_load_col(x, port->start_tile, port->tile_height);
        } else if (current_col != new_col) {
            // If column differs by more than 1 render entire viewport
            scroll_render_rows(shift_scroll_x, 0, port->start_tile, port->tile_height);
        }     
    } else {
        // No Parallax
        port->scx = draw_scroll_x;

        // If column is +/- 1 just render next column
        if (current_col == new_col - 1) {
            // Queue right column
            UBYTE x = new_col - SCREEN_PAD_LEFT + SCREEN_TILE_REFRES_W - 1;
            UBYTE y = MAX(0, MAX((new_row - SCREEN_PAD_TOP), port->start_tile));
            UBYTE full_y = MAX(0, (new_row - SCREEN_PAD_TOP));
            scroll_queue_col(x, y);
            activate_actors_in_col(x, full_y);
        } else if (current_col == new_col + 1) {
            // Queue left column
            UBYTE x = MAX(0, new_col - SCREEN_PAD_LEFT);
            UBYTE y = MAX(0, MAX((new_row - SCREEN_PAD_TOP), port->start_tile));
            UBYTE full_y = MAX(0, (new_row - SCREEN_PAD_TOP));
            scroll_queue_col(x, y);
            activate_actors_in_col(x, full_y);
        } else if (current_col != new_col) {
            // If column differs by more than 1 render entire screen
            scroll_render_rows(draw_scroll_x, draw_scroll_y, -SCREEN_PAD_TOP, SCREEN_TILE_REFRES_H);
            return !(port->next_y);
        }

        // If row is +/- 1 just render next row
        if (current_row == new_row - 1) {
            // Queue bottom row
            UBYTE x = MAX(0, new_col - SCREEN_PAD_LEFT);
            UBYTE y = new_row - SCREEN_PAD_TOP + SCREEN_TILE_REFRES_H - 1;
            scroll_queue_row(x, y);
            activate_actors_in_row(x, y);
        } else if (current_row == new_row + 1) {
            // Queue top row
            UBYTE x = MAX(0, new_col - SCREEN_PAD_LEFT);
            UBYTE y = MAX(0, new_row - SCREEN_PAD_TOP);
            scroll_queue_row(x, y);
            activate_actors_in_row(x, y);
        } else if (current_row != new_row) {
            // If row differs by more than 1 render entire screen
            scroll_render_rows(draw_scroll_x, draw_scroll_y, -SCREEN_PAD_TOP, SCREEN_TILE_REFRES_H);
            return !(port->next_y);
        }

        if (IS_FRAME_2) {
            if (pending_h_i) scroll_load_pending_col();
            if (pending_w_i) scroll_load_pending_row();
        }
    }

    return !(port->next_y);
}

void scroll_render_rows(INT16 scroll_x, INT16 scroll_y, BYTE row_offset, BYTE n_rows) {
    if (!fade_style) {
        DISPLAY_OFF;
    } else if (!fade_timer == 0) {
        // Immediately set all palettes black while screen renders.
#ifdef CGB
        if (_is_CGB) {
            CGBZeroPalette((UBYTE)(&BCPS_REG));
            CGBZeroPalette((UBYTE)(&OCPS_REG));
        } else
#endif
        OBP0_REG = 0xFF, BGP_REG = 0xFF;
    }

    // Clear pending rows/ columns
    pending_w_i = 0;
    pending_h_i = 0;

    UBYTE x = MAX(0, (scroll_x >> 3) - SCREEN_PAD_LEFT);
    UBYTE y = MAX(0, (scroll_y >> 3) + row_offset);

    for (BYTE i = 0; i != n_rows && y != image_tile_height; ++i, y++) {
        scroll_load_row(x, y);
        activate_actors_in_row(x, y);
    }

    game_time = 0;

    DISPLAY_ON;

    if (!fade_timer == 0) {
        // Screen palate to nornmal if not fading
        fade_applypalettechange();
    }
}

void scroll_queue_row(UBYTE x, UBYTE y) {
    while (pending_w_i) {
        // If previous row wasn't fully rendered
        // render it now before starting next row        
        scroll_load_pending_row();
    }

    // Don't queue rows past image height
    if (y >= image_tile_height) {
        return;
    }

    pending_w_x = x;
    pending_w_y = y;
    pending_w_i = SCREEN_TILE_REFRES_W;
}

void scroll_queue_col(UBYTE x, UBYTE y) {
    while (pending_h_i) {
        // If previous column wasn't fully rendered
        // render it now before starting next column
        scroll_load_pending_col();
    }

    pending_h_x = x;
    pending_h_y = y;
    pending_h_i = MIN(SCREEN_TILE_REFRES_H, image_tile_height - y);
}

/* Update pending (up to 5) rows */
void scroll_load_pending_row() __nonbanked {
    UINT8 _save = _current_bank;
    UBYTE width = MIN(pending_w_i, PENDING_BATCH_SIZE);

#ifdef CGB
    if (_is_CGB) {  // Color Row Load
        SWITCH_ROM_MBC1(image_attr_bank);
        VBK_REG = 1;
        set_bkg_submap(pending_w_x, pending_w_y, width, 1, image_attr_ptr, image_tile_width);
        VBK_REG = 0;
    }
#endif
    // DMG Row Load
    SWITCH_ROM_MBC1(image_bank);
    set_bkg_submap(pending_w_x, pending_w_y, width, 1, image_ptr, image_tile_width);

    pending_w_x += width;
    pending_w_i -= width;

    SWITCH_ROM_MBC1(_save);
}


void scroll_load_row(UBYTE x, UBYTE y) __nonbanked {
    UINT8 _save = _current_bank;

#ifdef CGB
    if (_is_CGB) {  // Color Column Load
        VBK_REG = 1;
        SWITCH_ROM_MBC1(image_attr_bank);
        set_bkg_submap(x, y, SCREEN_TILE_REFRES_W, 1, image_attr_ptr, image_tile_width);
        VBK_REG = 0;
    }
#endif
    // DMG Row Load
    SWITCH_ROM_MBC1(image_bank);
    set_bkg_submap(x, y, SCREEN_TILE_REFRES_W, 1, image_ptr, image_tile_width);

    SWITCH_ROM_MBC1(_save);
}

void scroll_load_col(UBYTE x, UBYTE y, UBYTE height) __nonbanked {
    UINT8 _save = _current_bank;
 
#ifdef CGB
    if (_is_CGB) {  // Color Column Load
        SWITCH_ROM_MBC1(image_attr_bank);
        VBK_REG = 1;
        set_bkg_submap(x, y, 1, height, image_attr_ptr, image_tile_width);
        VBK_REG = 0;
    }
#endif
    // DMG Column Load
    unsigned char* map = image_ptr + image_tile_width * y + x;
    SWITCH_ROM_MBC1(image_bank);
    set_bkg_submap(x, y, 1, height, image_ptr, image_tile_width);
    SWITCH_ROM_MBC1(_save);
}

void scroll_load_pending_col() __nonbanked {
    UINT8 _save = _current_bank;
    UBYTE height = MIN(pending_h_i, PENDING_BATCH_SIZE);

    SWITCH_ROM_MBC1(image_bank);
#ifdef CGB
    if (_is_CGB) {  // Color Column Load
        SWITCH_ROM_MBC1(image_attr_bank);
        VBK_REG = 1;
        set_bkg_submap(pending_h_x, pending_h_y, 1, height, image_attr_ptr, image_tile_width);
        VBK_REG = 0;
    }
#endif
    // DMG Column Load
    SWITCH_ROM_MBC1(image_bank);
    set_bkg_submap(pending_h_x, pending_h_y, 1, height, image_ptr, image_tile_width);

    pending_h_y += height;
    pending_h_i -= height;

    SWITCH_ROM_MBC1(_save);
}
