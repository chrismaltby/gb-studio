#pragma bank 1

#include "UI.h"
#include "BankData.h"
#include "GameTime.h"
#include "Math.h"
#include "Scroll.h"
#include "Input.h"
#include "data_ptrs.h"
#include "Math.h"
#include <string.h>
#include <stdlib.h>

#define FRAME_CENTER_OFFSET 64

#define ui_frame_tl_tiles 0xC0u
#define ui_frame_bl_tiles 0xC6u
#define ui_frame_tr_tiles 0xC2u
#define ui_frame_br_tiles 0xC8u
#define ui_frame_t_tiles  0xC1u
#define ui_frame_b_tiles  0xC7u
#define ui_frame_l_tiles  0xC3u
#define ui_frame_r_tiles  0xC5u
#define ui_frame_bg_tiles 0xC4u

#define ui_bkg_tile 0x07u
#define ui_while_tile 0xC9u
#define ui_black_tile 0xCAu

const unsigned char ui_white[16] = {0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                                    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
const unsigned char ui_black[16] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
                                    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

#define ui_cursor_tiles 0xCBu
#define ui_bg_tiles 0xC4u

const UBYTE text_draw_speeds[] = {0x0, 0x1, 0x3, 0x7, 0xF, 0x1F};

// The current in progress text speed.
// Reset to global value from text_speed each time a dialogue window is opened but can be controlled
// by using '!S[text-speed]!' commands in text, such as '!S0!' for instant '!S5!' for slow text.
UBYTE current_text_speed;

void UIDrawTextBufferChar_b();
void UIDrawMenuCursor_b();
UBYTE GetToken_b(unsigned char * src, unsigned char term, UWORD* res) __preserves_regs(b, c);

void UIInit_b() __banked {
  UBYTE* ptr;

#ifdef CGB
  VBK_REG = 1;
  fill_win_rect(0, 0, 20, 18, ui_bkg_tile);
  VBK_REG = 0;
#endif

  UISetPos(0, 144);

  // Load frame tiles from data bank
  ptr = (BankDataPtr(FRAME_BANK)) + FRAME_BANK_OFFSET;
  SetBankedBkgData(192, 9, ptr, FRAME_BANK);

  set_bkg_data(ui_while_tile, 1, ui_white);
  set_bkg_data(ui_black_tile, 1, ui_black);

  ptr = (BankDataPtr(CURSOR_BANK)) + CURSOR_BANK_OFFSET;
  SetBankedBkgData(0xCB, 1, ptr, CURSOR_BANK);
}

void UIReset_b() __banked {
  UISetPos(0, 144);
}

void UIUpdate_b() __banked {
  UBYTE interval;

  if (win_speed == 5 && ((game_time & 0x7) != 0)) {
    return;
  } else if (win_speed == 4 && ((game_time & 0x3) != 0)) {
    return;
  } else if (win_speed == 3 && ((game_time & 0x1) != 0)) {
    return;
  } else if (win_speed == 0xFF) {
    // UIIsClosed = true, but Wait for next frame to close
    win_speed = 0;
    return;
  }

  if (win_speed == 1) {
    interval = 2;
  } else {
    interval = 1;
  }

  if (win_pos_x != win_dest_pos_x) {
    if (win_pos_x < win_dest_pos_x) {
      win_pos_x += interval;
    } else {
      win_pos_x -= interval;
    }
  }

  if (win_pos_y != win_dest_pos_y) {
    if (win_pos_y < win_dest_pos_y) {
      win_pos_y += interval;
    } else {
      win_pos_y -= interval;
    }
  } else if(!text_drawn) {
    if ( (joy & text_ff_joypad) | ((game_time & current_text_speed) == 0) ) {
      UIDrawTextBufferChar_b();
    }
  }

  WX_REG = win_pos_x + 7;
  WY_REG = win_pos_y;
}

void UIDrawFrame_b(UBYTE x, UBYTE y, UBYTE width, UBYTE height) __banked {
  fill_win_rect(x,         y,              1,         1,      ui_frame_tl_tiles);  // top-left
  fill_win_rect(x + 1,     y,              width - 1, 1,      ui_frame_t_tiles);   // top
  fill_win_rect(x + width, y,              1,         1,      ui_frame_tr_tiles);  // top-right
  fill_win_rect(x,         y + 1,          1,         height, ui_frame_l_tiles);   // left
  fill_win_rect(x + width, y + 1,          1,         height, ui_frame_r_tiles);   // right
  fill_win_rect(x,         y + height + 1, 1,         1,      ui_frame_bl_tiles);  // bottom-left
  fill_win_rect(x + 1,     y + height + 1, width - 1, 1,      ui_frame_b_tiles);   // bottom
  fill_win_rect(x + width, y + height + 1, 1,         1,      ui_frame_br_tiles);  // bottom-right
  fill_win_rect(x + 1,     y + 1,          width - 1, height, ui_frame_bg_tiles);  // background
}

void UIDrawDialogueFrame_b(UBYTE h) __banked {
  UIDrawFrame_b(0, 0, 19, h);
}

void UISetColor_b(UBYTE color) __banked {
  UBYTE id = ((color) ? ui_while_tile : ui_black_tile);

  // Not sure why need to set_bkg_data again but this doesn't
  // work in rom without reseting here
  set_bkg_data(ui_while_tile, 1, ui_white);
  set_bkg_data(ui_black_tile, 1, ui_black);
  fill_win_rect(0, 0, 20, 18, id);
}

void UIShowText_b() __banked {
  UWORD var_index;
  UBYTE i, l;

  ui_block = TRUE;
  current_text_speed = text_draw_speed;

  static unsigned char * src, * dest;
  src = tmp_text_lines + 1, dest = text_lines;
  for (i = 0; (*src) && (i != 80u); i++) {
    switch (*src) {
      case '$':
        l = GetToken_b(src + 1, '$', &var_index);
        if (l) {
          dest += strlen(itoa(script_variables[var_index], dest));
          src += l + 1; 
          continue;
        }
        break;

      case '#':
        l = GetToken_b(src + 1, '#', &var_index);
        if (l) {
          *dest++ = script_variables[var_index] + 0x20u; 
          src += l + 1; 
          continue;
        }
        break;

      case '!':
        if (*(src+1) == 'S') {
          l = GetToken_b(src + 2, '!', &var_index);
          if (l) {
            *dest++ = var_index + 0x10u;
            src += l + 2;
            continue;
          }
        }
        break;
    }
    *dest++ = *src++;
  }
  *dest = 0;

  if (menu_layout) {
    text_num_lines = tmp_text_lines[0];
    UIDrawFrame(0, 0, 8, text_num_lines);
    UISetPos(MENU_LAYOUT_INITIAL_X, MENU_CLOSED_Y);
    UIMoveTo(MENU_LAYOUT_INITIAL_X, MENU_CLOSED_Y - ((text_num_lines + 2) << 3), text_in_speed);
  } else {
    text_num_lines = MIN(tmp_text_lines[0], 4);
    UIDrawDialogueFrame(text_num_lines);
    UISetPos(0, MENU_CLOSED_Y);
    UIMoveTo(0, MENU_CLOSED_Y - ((text_num_lines + 2) << 3), text_in_speed);
  }

  text_drawn = FALSE;
  text_x = 0;
  text_y = 0;
  text_count = 0;
  text_tile_count = 0;

  // If draw set to instant start drawing characters straight away
  if (text_draw_speed == 0) {
    UIDrawTextBufferChar_b();
  }
}

void UIDrawTextBufferChar_b() {
  UBYTE letter;
  UBYTE i, text_remaining, word_len;
  UBYTE text_size;
  UBYTE tile;
  UBYTE* ptr;
  UINT16 id;

  if (text_wait != 0) {
    text_wait--;
    return;
  }

  text_size = strlen(text_lines);

  if (UBYTE_LESS_THAN(text_count, text_size)) {
    text_drawn = FALSE;

    if (text_count == 0) {
      text_x = 0;
      text_y = 0;
    }

    letter = text_lines[text_count] - 32;

    // Clear tile data ready for text
    ptr = BankDataPtr(FONT_BANK) + FONT_BANK_OFFSET;

    // Determine if text can fit on line
    text_remaining = 18 - text_x;
    word_len = 0;
    for (i = text_count; i != text_size; i++) {
      // Skip special characters when calculating word length
      if (text_lines[i] < ' ') {
        break;
      }
      word_len++;
    }
    if (UBYTE_LESS_THAN(text_remaining, word_len) && UBYTE_LESS_THAN(word_len, 18u)) {
      text_x = 0;
      text_y++;
    }

    // Skip special characters when drawing text
    if (text_lines[text_count] >= ' ') {
      i = text_tile_count + avatar_enabled * 4;

      SetBankedBkgData(TEXT_BUFFER_START + i, 1, ptr + ((UWORD)letter * 16), FONT_BANK);
      tile = TEXT_BUFFER_START + i;
      id = (UINT16)GetWinAddr() +
           MOD_32((text_x + 1 + avatar_enabled * 2 + menu_enabled +
                   (text_y >= text_num_lines ? 9 : 0))) +
           ((UINT16)MOD_32((text_y % text_num_lines) + 1) << 5);
      SetTile(id, tile);

      text_tile_count++;
    }

    // Dynamic switch text speed
    if (text_lines[text_count] >= 0x10 && text_lines[text_count] < 0x16) {
      current_text_speed = text_draw_speeds[text_lines[text_count] - 0x10];
      text_x--;
    }

    text_count++;
    text_x++;
    if (text_lines[text_count] == '\n') {
      text_x = 0;
      text_y++;
      text_count++;
    } else if (UBYTE_GT_THAN(text_x, 17u)) {
      text_x = 0;
      text_y++;
    }

    if (current_text_speed == 0) {
      UIDrawTextBufferChar_b();
    }
  } else {
    text_drawn = TRUE;
  }
}

void UICloseDialogue_b() {
  UIMoveTo(menu_layout ? MENU_LAYOUT_INITIAL_X : 0, MENU_CLOSED_Y, text_out_speed);

  // Reset variables
  text_count = 0;
  text_lines[0] = '\0';
  text_tile_count = 0;
  text_num_lines = 3;
  menu_enabled = FALSE;
  menu_layout = 0;
  avatar_enabled = FALSE;
  ui_block = FALSE;
}

void UIOnInteract_b() __banked {
  if (INPUT_A_PRESSED) {
    if (text_drawn && text_count != 0) {
      if (menu_enabled) {
        if (menu_cancel_on_last_option && menu_index + 1 == menu_num_options) {
          script_variables[menu_flag] = 0;
        } else {
          script_variables[menu_flag] = menu_index + 1;
        }
        UICloseDialogue_b();
      } else {
        UICloseDialogue_b();
      }
    }
  } else if (menu_enabled) {
    if (INPUT_UP_PRESSED) {
      menu_index = MAX(menu_index - 1, 0);
      UIDrawMenuCursor_b();
    } else if (INPUT_DOWN_PRESSED) {
      menu_index = MIN(menu_index + 1, menu_num_options - 1);
      UIDrawMenuCursor_b();
    } else if (INPUT_LEFT_PRESSED) {
      if (menu_layout == 0) {
        menu_index = MAX(menu_index - 4, 0);
      } else {
        menu_index = 0;
      }
      UIDrawMenuCursor_b();
    } else if (INPUT_RIGHT_PRESSED) {
      if (menu_layout == 0) {
        menu_index = MIN(menu_index + 4, menu_num_options - 1);
      } else {
        menu_index = menu_num_options - 1;
      }
      UIDrawMenuCursor_b();
    } else if (menu_cancel_on_b && INPUT_B_PRESSED) {
      script_variables[menu_flag] = 0;
      UICloseDialogue_b();
    }
  }
}

void UIShowMenu_b(UWORD flag_index,
                  UBYTE bank,
                  UWORD bank_offset,
                  UBYTE layout,
                  UBYTE cancel_config) __banked {

  UBYTE tmp_text_draw_speed;

  menu_index = 0;
  menu_flag = flag_index;
  menu_enabled = TRUE;
  menu_cancel_on_last_option = cancel_config & MENU_CANCEL_ON_LAST_OPTION;
  menu_cancel_on_b = cancel_config & MENU_CANCEL_ON_B_PRESSED;
  menu_layout = layout;
  tmp_text_draw_speed = text_draw_speed;
  text_draw_speed = 0;

  UIShowText(bank, bank_offset);

  text_draw_speed = tmp_text_draw_speed;
  menu_num_options = tmp_text_lines[0];

  UIDrawMenuCursor_b();
}

void UIDrawMenuCursor_b() {
  UBYTE i;
  UINT16 addr;
  for (i = 0; i != menu_num_options; i++) {
      addr = (UINT16)GetWinAddr() +
             (i >= text_num_lines ? 10 : 1) +
             (((i % text_num_lines) + 1) << 5);
      SetTile(addr, menu_index == (BYTE)i ? ui_cursor_tiles : ui_bg_tiles);
  }
}
