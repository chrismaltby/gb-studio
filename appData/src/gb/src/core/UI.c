#include "UI.h"

#include <stdio.h>
#include <string.h>

#include "BankData.h"
#include "BankManager.h"
#include "GameTime.h"
#include "Input.h"
#include "Math.h"
#include "data_ptrs.h"

void UIInit_b() __banked;
void UIUpdate_b() __banked;
void UIReset_b() __banked;
void UIDrawFrame_b(UBYTE x, UBYTE y, UBYTE width, UBYTE height) __banked;
void UIDrawDialogueFrame_b(UBYTE h) __banked;
void UISetColor_b(UWORD image_index) __banked;
void UIShowText_b() __banked;
void UIOnInteract_b() __banked;
void UIShowMenu_b(UWORD flag_index,
                  UBYTE bank,
                  UWORD bank_offset,
                  UBYTE layout,
                  UBYTE cancel_config) __banked;

UBYTE ui_block = FALSE;
UBYTE win_pos_x;
UBYTE win_pos_y;
UBYTE win_dest_pos_x;
UBYTE win_dest_pos_y;
UBYTE win_speed;

UBYTE text_x;
UBYTE text_y;
UBYTE text_drawn;
UBYTE text_count = 0;
UBYTE text_tile_count;
UBYTE text_wait = 0;
UBYTE text_in_speed = 1;
UBYTE text_out_speed = 1;
UBYTE text_draw_speed = 1;
UBYTE text_ff_joypad = J_A | J_B;
UBYTE tmp_text_in_speed = 1;
UBYTE tmp_text_out_speed = 1;
UBYTE text_num_lines = 0;

UBYTE avatar_enabled = 0;
UBYTE menu_enabled = FALSE;
BYTE menu_index = 0;
UWORD menu_flag;
UBYTE menu_num_options = 2;
UBYTE menu_cancel_on_last_option = TRUE;
UBYTE menu_cancel_on_b = TRUE;
UBYTE menu_layout = FALSE;

unsigned char text_lines[80] = "";
unsigned char tmp_text_lines[80] = "";

void UIInit() {
  ui_block = FALSE;
  text_drawn = TRUE;
  UIInit_b();
}

void UIUpdate() {
  UIUpdate_b();
}

void UIReset() {
  UIReset_b();
}

void UIDrawFrame(UBYTE x, UBYTE y, UBYTE width, UBYTE height) {
  UIDrawFrame_b(x, y, width, height);
}

void UIDrawDialogueFrame(UBYTE h) {
  UIDrawDialogueFrame_b(h);
}

void UIShowText(UBYTE bank, UWORD bank_offset) {
  UBYTE* ptr;

  strcpy(tmp_text_lines, "");

  ptr = (BankDataPtr(bank)) + bank_offset;

  PUSH_BANK(bank);
  strcat(tmp_text_lines, ptr);
  POP_BANK;

  UIShowText_b();
}

void UIShowAvatar(UBYTE avatar_index) {
  BankPtr avatar_bank_ptr;
  UBYTE* avatar_ptr;
  UBYTE avatar_len;
  UBYTE tile1, tile2, tile3, tile4;

  unsigned char* tmp_avatar_ptr[100];

  ReadBankedBankPtr(DATA_PTRS_BANK, &avatar_bank_ptr, &avatar_bank_ptrs[avatar_index]);
  avatar_ptr = (BankDataPtr(avatar_bank_ptr.bank)) + avatar_bank_ptr.offset;
  avatar_len = MUL_4(ReadBankedUBYTE(avatar_bank_ptr.bank, avatar_ptr));

  PUSH_BANK(avatar_bank_ptr.bank);
  memcpy(tmp_avatar_ptr, avatar_ptr + 1, avatar_len * 16);
  POP_BANK
  SetBankedBkgData(TEXT_BUFFER_START, avatar_len, (unsigned char *)tmp_avatar_ptr, FONT_BANK);

  tile1 = TEXT_BUFFER_START;
  tile2 = TEXT_BUFFER_START + 1U;
  tile3 = TEXT_BUFFER_START + 2U;
  tile4 = TEXT_BUFFER_START + 3U;

  set_win_tiles(1, 1, 1, 1, &tile1);
  set_win_tiles(2, 1, 1, 1, &tile2);
  set_win_tiles(1, 2, 1, 1, &tile3);
  set_win_tiles(2, 2, 1, 1, &tile4);
}

void UIShowChoice(UWORD flag_index, UBYTE bank, UWORD bank_offset) {
  UIShowMenu_b(flag_index, bank, bank_offset, 0,
               /*MENU_CANCEL_ON_B_PRESSED | */MENU_CANCEL_ON_LAST_OPTION);
}

void UIShowMenu(UWORD flag_index,
                UBYTE bank,
                UWORD bank_offset,
                UBYTE layout,
                UBYTE cancel_config) {
  UIShowMenu_b(flag_index, bank, bank_offset, layout, cancel_config);
}

void UISetPos(UBYTE x, UBYTE y) {
  win_pos_x = x;
  win_dest_pos_x = x;
  win_pos_y = y;
  win_dest_pos_y = y;
}

void UIMoveTo(UBYTE x, UBYTE y, UBYTE speed) {
  win_dest_pos_x = x;
  win_dest_pos_y = y;
  if (speed == 0) {
    win_pos_x = x;
    win_pos_y = y;
    if (y == MENU_CLOSED_Y) {
      win_speed = 0xFF;
    }
  } else {
    win_speed = speed;
  }
}

UBYTE UIIsClosed() {
  return win_pos_y == MENU_CLOSED_Y && win_dest_pos_y == MENU_CLOSED_Y;
}

void UIOnInteract() {
  UIOnInteract_b();
}

UBYTE UIAtDest() {
  return win_pos_x == win_dest_pos_x && win_pos_y == win_dest_pos_y;
}

void UISetColor(UBYTE color) {
  UISetColor_b(color);
}
