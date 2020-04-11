#include "UI.h"

#include "BankData.h"
#include "BankManager.h"
#include "GameTime.h"
#include "Input.h"
#include "Math.h"
#include "data_ptrs.h"

void UIInit_b();
void UIUpdate_b();
void UIDrawFrame_b(UBYTE x, UBYTE y, UBYTE width, UBYTE height);
void UIDrawDialogueFrame_b(UBYTE h);
void UIDrawTextBufferChar_b();
void UISetColor_b(UWORD image_index);
void UIShowText_b();
void UIOnInteract_b();

UBYTE win_pos_x;
UBYTE win_pos_y;
UBYTE win_dest_pos_x;
UBYTE win_dest_pos_y;
UBYTE win_speed;
UBYTE hide_sprites_under_win = FALSE;

UBYTE text_x;
UBYTE text_y;
UBYTE text_drawn;
UBYTE text_count;
UBYTE text_tile_count;
UBYTE text_wait;
UBYTE text_in_speed = 1;
UBYTE text_out_speed = 1;
UBYTE text_draw_speed = 1;
UBYTE tmp_text_in_speed = 1;
UBYTE tmp_text_out_speed = 1;
UBYTE tmp_text_draw_speed = 1;
UBYTE text_num_lines = 0;

UBYTE avatar_enabled = 0;
UBYTE menu_enabled = FALSE;
BYTE menu_index = 0;
UWORD menu_flag;
UBYTE menu_num_options = 2;
UBYTE menu_cancel_on_last_option = TRUE;
UBYTE menu_cancel_on_b = TRUE;
UBYTE menu_layout = FALSE;

const unsigned char ui_cursor_tiles[1] = {0xCB};
const unsigned char ui_bg_tiles[1] = {0xC4};

unsigned char text_lines[80] = "";
unsigned char tmp_text_lines[80] = "";

void UIInit() {
  PUSH_BANK(UI_BANK);
  UIInit_b();
  POP_BANK;
}

void UIDebugLog(UBYTE val, UBYTE x, UBYTE y) {
  UBYTE tile1;
  tile1 = val + 203;
  set_win_tiles(x, y, 1, 1, &tile1);
}

void UIUpdate() {
  PUSH_BANK(UI_BANK);
  UIUpdate_b();
  POP_BANK;
}

void UIDrawFrame(UBYTE x, UBYTE y, UBYTE width, UBYTE height) {
  PUSH_BANK(UI_BANK);
  UIDrawFrame_b(x, y, width, height);
  POP_BANK;
}

void UIDrawDialogueFrame(UBYTE h) {
  PUSH_BANK(UI_BANK);
  UIDrawDialogueFrame_b(h);
  POP_BANK;
}

void UIShowText(UWORD line) {
  BANK_PTR bank_ptr;
  UBYTE *ptr;

  hide_sprites_under_win = TRUE;

  strcpy(tmp_text_lines, "");

  ReadBankedBankPtr(DATA_PTRS_BANK, &bank_ptr, &string_bank_ptrs[line]);
  ptr = ((UBYTE *)bank_data_ptrs[bank_ptr.bank]) + bank_ptr.offset;

  PUSH_BANK(bank_ptr.bank);
  strcat(tmp_text_lines, ptr);
  POP_BANK;

  PUSH_BANK(UI_BANK);
  UIShowText_b();
  POP_BANK;
}

void UIShowAvatar(UBYTE avatar_index) {
  BANK_PTR avatar_bank_ptr;
  UBYTE *avatar_ptr;
  UBYTE avatar_len;
  UBYTE tile1, tile2, tile3, tile4;

  unsigned char *tmp_avatar_ptr[100];

  ReadBankedBankPtr(DATA_PTRS_BANK, &avatar_bank_ptr, &avatar_bank_ptrs[avatar_index]);
  avatar_ptr = ((UBYTE *)bank_data_ptrs[avatar_bank_ptr.bank]) + avatar_bank_ptr.offset;
  avatar_len = MUL_4(ReadBankedUBYTE(avatar_bank_ptr.bank, avatar_ptr));

  PUSH_BANK(avatar_bank_ptr.bank);
  memcpy(tmp_avatar_ptr, avatar_ptr + 1, avatar_len * 16);
  POP_BANK
  SetBankedBkgData(FONT_BANK, TEXT_BUFFER_START, avatar_len, tmp_avatar_ptr);

  tile1 = TEXT_BUFFER_START;
  tile2 = TEXT_BUFFER_START + 1;
  tile3 = TEXT_BUFFER_START + 2;
  tile4 = TEXT_BUFFER_START + 3;

  set_win_tiles(1, 1, 1, 1, &tile1);
  set_win_tiles(2, 1, 1, 1, &tile2);
  set_win_tiles(1, 2, 1, 1, &tile3);
  set_win_tiles(2, 2, 1, 1, &tile4);

  avatar_enabled = TRUE;
}

void UIShowChoice(UWORD flag_index, UWORD line) {
  hide_sprites_under_win = TRUE;
  UIShowMenu(flag_index, line, 0, MENU_CANCEL_ON_B_PRESSED | MENU_CANCEL_ON_LAST_OPTION);
}

void UIShowMenu(UWORD flag_index, UWORD line, UBYTE layout, UBYTE cancel_config) {
  menu_index = 0;
  menu_flag = flag_index;
  menu_enabled = TRUE;
  menu_cancel_on_last_option = cancel_config & MENU_CANCEL_ON_LAST_OPTION;
  menu_cancel_on_b = cancel_config & MENU_CANCEL_ON_B_PRESSED;
  menu_layout = layout;
  tmp_text_draw_speed = text_draw_speed;
  text_draw_speed = 0;
  UIShowText(line);
  hide_sprites_under_win = layout == 0;
  menu_num_options = tmp_text_lines[0];
  UIDrawMenuCursor();
}

void UISetTextBuffer(unsigned char *text) {
  UIDrawFrame(0, 2, 20, 4);
  text_drawn = FALSE;
  strcpy(text_lines, text);
  text_x = 0;
  text_y = 0;
  text_count = 0;
  text_tile_count = 0;
}

void UIDrawTextBuffer() {
  PUSH_BANK(UI_BANK);
  if (IS_FRAME_2) {
    UIDrawTextBufferChar_b();
  }
  POP_BANK;
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
  } else {
    win_speed = speed;
  }
}

UBYTE UIIsClosed() { return win_pos_y == MENU_CLOSED_Y && win_dest_pos_y == MENU_CLOSED_Y; }

void UIDrawMenuCursor() {
  UBYTE i;
  for (i = 0; i < menu_num_options; i++) {
    set_win_tiles(i >= text_num_lines ? 10 : 1, (i % text_num_lines) + 1, 1, 1,
                  menu_index == i ? ui_cursor_tiles : ui_bg_tiles);
  }
}

void UIOnInteract() {
  PUSH_BANK(UI_BANK);
  UIOnInteract_b();
  POP_BANK;
}

UBYTE UIAtDest() { return win_pos_x == win_dest_pos_x && win_pos_y == win_dest_pos_y; }

void UISetColor(UBYTE color) {
  PUSH_BANK(UI_BANK);
  UISetColor_b(color);
  POP_BANK;
}
