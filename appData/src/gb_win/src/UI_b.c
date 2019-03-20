// clang-format off
#pragma bank=4
// clang-format on

#include "UI.h"
#include "BankData.h"
#include "game.h"

UINT8 ui_bank = 4;

const unsigned char ui_frame_tl_tiles[1] = {0xC0};
const unsigned char ui_frame_bl_tiles[1] = {0xE1};
const unsigned char ui_frame_tr_tiles[1] = {0xC2};
const unsigned char ui_frame_br_tiles[1] = {0xE3};
const unsigned char ui_frame_t_tiles[1] = {0xC1};
const unsigned char ui_frame_b_tiles[1] = {0xE2};
const unsigned char ui_frame_l_tiles[1] = {0xC3};
const unsigned char ui_frame_r_tiles[1] = {0xC4};
const unsigned char ui_frame_bg_tiles[1] = {0xC5};
const unsigned char ui_colors[2][1] = {{0xE5}, {0xC5}};

void UIInit_b()
{
  UWORD ptr;

  UISetPos(160, 144);

  // Load global tiles from data bank
  // ptr = ((UWORD)bank_data_ptrs[UI_BANK]) + UI_BANK_OFFSET;
  // SetBankedBkgData(UI_BANK, 192, 64, ptr);
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
