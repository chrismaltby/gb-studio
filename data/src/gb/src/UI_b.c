// clang-format off
#pragma bank=4
// clang-format on

#include "UI.h"
#include "BankData.h"
#include "game.h"

UINT8 ui_bank = 4;

#define FRAME_CENTER_OFFSET 64

const unsigned char ui_frame_tl_tiles[1] = {0xD0};
const unsigned char ui_frame_bl_tiles[1] = {0xD6};
const unsigned char ui_frame_tr_tiles[1] = {0xD2};
const unsigned char ui_frame_br_tiles[1] = {0xD8};
const unsigned char ui_frame_t_tiles[1] = {0xD1};
const unsigned char ui_frame_b_tiles[1] = {0xD7};
const unsigned char ui_frame_l_tiles[1] = {0xD3};
const unsigned char ui_frame_r_tiles[1] = {0xD5};
const unsigned char ui_frame_bg_tiles[1] = {0xD4};
const unsigned char ui_colors[2][1] = {{0xDA}, {0xD9}};
const unsigned char ui_white[16] = {0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
const unsigned char ui_black[16] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

void UIInit_b()
{
  UWORD ptr;

  UISetPos(160, 144);

  // Load frame tiles from data bank
  ptr = ((UWORD)bank_data_ptrs[FRAME_BANK]) + FRAME_BANK_OFFSET;
  SetBankedBkgData(UI_BANK, 208, 9, ptr);

  set_bkg_data(0xD9, 1, ui_white);
  set_bkg_data(0xDA, 1, ui_black);
}

void UIUpdate_b()
{
  if (win_pos_x != win_dest_pos_x)
  {
    if (win_pos_x < win_dest_pos_x)
    {
      win_pos_x += 2;
    }
    else
    {
      win_pos_x -= 2;
    }
  }

  if (win_pos_y != win_dest_pos_y)
  {
    if (win_pos_y < win_dest_pos_y)
    {
      win_pos_y += 2;
    }
    else
    {
      win_pos_y -= 2;
    }
  }
  else
  {
    UIDrawTextBuffer();
  }

  WX_REG = win_pos_x + 7;
  WY_REG = win_pos_y;
}

void UIDrawFrame_b(UBYTE x, UBYTE y, UBYTE width, UBYTE height)
{
  UBYTE i, j;
  set_win_tiles(x, y, 1, 1, ui_frame_tl_tiles);
  set_win_tiles(x, y + height - 1, 1, 1, ui_frame_bl_tiles);
  set_win_tiles(x + width - 1, y, 1, 1, ui_frame_tr_tiles);
  set_win_tiles(x + width - 1, y + height - 1, 1, 1, ui_frame_br_tiles);

  for (i = x + 1; i < (x + width - 1); i++)
  {
    set_win_tiles(i, y, 1, 1, ui_frame_t_tiles);
    set_win_tiles(i, y + height - 1, 1, 1, ui_frame_b_tiles);
    for (j = y + 1; j < (y + height - 1); j++)
    {
      set_win_tiles(i, j, 1, 1, ui_frame_bg_tiles);
    }
  }
  for (i = y + 1; i < (y + height - 1); i++)
  {
    set_win_tiles(x, i, 1, 1, ui_frame_l_tiles);
    set_win_tiles(x + width - 1, i, 1, 1, ui_frame_r_tiles);
  }
}

void UIDrawDialogueFrame_b()
{
  UBYTE i, x, y;

  set_win_tiles(0, 0, 1, 1, ui_frame_tl_tiles);
  set_win_tiles(0, 3, 1, 1, ui_frame_bl_tiles);
  set_win_tiles(19, 0, 1, 1, ui_frame_tr_tiles);
  set_win_tiles(19, 3, 1, 1, ui_frame_br_tiles);
  set_win_tiles(0, 1, 1, 1, ui_frame_l_tiles);
  set_win_tiles(0, 2, 1, 1, ui_frame_l_tiles);
  set_win_tiles(19, 1, 1, 1, ui_frame_r_tiles);
  set_win_tiles(19, 2, 1, 1, ui_frame_r_tiles);

  for (x = 1; x != 19; ++x)
  {
    set_win_tiles(x, 0, 1, 1, ui_frame_t_tiles);
    set_win_tiles(x, 3, 1, 1, ui_frame_b_tiles);
    set_win_tiles(x, 1, 1, 1, ui_frame_bg_tiles);
    set_win_tiles(x, 2, 1, 1, ui_frame_bg_tiles);
  }
}

void UISetColor_b(UBYTE color)
{
  UBYTE i, j;

  for (i = 0; i != 20; i++)
  {
    for (j = 0; j != 18; j++)
    {
      set_win_tiles(i, j, 1, 1, ui_colors[color]);
    }
  }
}
