#include "UI.h"
#include "BankManager.h"
#include "game.h"
#include "data_ptrs.h"
#include "Macros.h"
#include "BankData.h"

void UIInit_b();
void UIUpdate_b();
void UIDrawFrame_b(UBYTE x, UBYTE y, UBYTE width, UBYTE height);
void UIDrawDialogueFrame_b(UBYTE h);
void UIDrawTextBufferChar();
void UISetColor_b(UWORD image_index);

UBYTE win_pos_x;
UBYTE win_pos_y;
UBYTE win_dest_pos_x;
UBYTE win_dest_pos_y;
UBYTE win_speed;

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

void UIInit()
{
  PUSH_BANK(ui_bank);
  UIInit_b();
  POP_BANK;
}

void UIUpdate()
{
  PUSH_BANK(ui_bank);
  UIUpdate_b();
  POP_BANK;
}

void UIDrawFrame(UBYTE x, UBYTE y, UBYTE width, UBYTE height)
{
  PUSH_BANK(ui_bank);
  UIDrawFrame_b(x, y, width, height);
  POP_BANK;
}

void UIDrawDialogueFrame(UBYTE h)
{
  PUSH_BANK(ui_bank);
  UIDrawDialogueFrame_b(h);
  POP_BANK;
}

void UIDrawText(char *str, UBYTE x, UBYTE y)
{
  UBYTE letter, i, len;
  len = strlen(str);
  for (i = 0; i != len; i++)
  {
    letter = str[i] + 0xA5;
    set_win_tiles(x + i, y, 1, 1, &letter);
  }
}

void UIDrawTextBkg(char *str, UBYTE x, UBYTE y)
{
  UBYTE letter, i, len;
  len = strlen(str);
  for (i = 0; i != len; i++)
  {
    letter = str[i] + 0xA5;
    set_bkg_tiles(x + i, y, 1, 1, &letter);
  }
}

void UIShowText(UWORD line)
{
  BANK_PTR bank_ptr;
  UWORD ptr, var_index;
  unsigned char value_string[6];
  UBYTE i, j, k;
  UBYTE value;

  strcpy(tmp_text_lines, "");

  ReadBankedBankPtr(DATA_PTRS_BANK, &bank_ptr, &string_bank_ptrs[line]);
  ptr = ((UWORD)bank_data_ptrs[bank_ptr.bank]) + bank_ptr.offset;

  PUSH_BANK(bank_ptr.bank);
  strcat(tmp_text_lines, ptr);
  POP_BANK;

  for (i = 1, k = 0; i < 81; i++)
  {
    // Replace variable references in text
    if (tmp_text_lines[i] == '$')
    {
      if(tmp_text_lines[i + 3] == '$') {
        var_index = (10 * (tmp_text_lines[i + 1] - '0')) + (tmp_text_lines[i + 2] - '0');
      } else if(tmp_text_lines[i + 4] == '$') {
        var_index = (100 * (tmp_text_lines[i + 1] - '0')) + (10 * (tmp_text_lines[i + 2] - '0')) + (tmp_text_lines[i + 3] - '0');
      } else {
        text_lines[k] = tmp_text_lines[i];
        ++k;
        continue;
      }

      value = script_variables[var_index];
      j = 0;

      if (value == 0)
      {
        text_lines[k] = '0';
      }
      else
      {
        // itoa implementation
        while (value != 0)
        {
          value_string[j++] = '0' + (value % 10);
          value /= 10;
        }
        j--;
        while (j != 255)
        {
          text_lines[k] = value_string[j];
          k++;
          j--;
        }
        k--;
      }
      // Jump though input past variable placeholder
      if(var_index >= 100) {
        i += 4;
      } else {
        i += 3;
      }
    }
    else
    {
      text_lines[k] = tmp_text_lines[i];
    }
    ++k;
  }

  if (menu_layout)
  {
    text_num_lines = tmp_text_lines[0];
    UIDrawFrame(0, 0, 8, text_num_lines);
    UISetPos(MENU_LAYOUT_INITIAL_X, MENU_CLOSED_Y);
    UIMoveTo(MENU_LAYOUT_INITIAL_X, MENU_CLOSED_Y - ((text_num_lines + 2) << 3), text_in_speed);
  }
  else 
  {
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
}

void UIShowAvatar(UBYTE avatar_index) 
{
  BANK_PTR avatar_bank_ptr;
  UWORD avatar_ptr;
  UBYTE avatar_len;
  UBYTE tile1, tile2, tile3, tile4;

  unsigned char *tmp_avatar_ptr[100];

  ReadBankedBankPtr(DATA_PTRS_BANK, &avatar_bank_ptr, &avatar_bank_ptrs[avatar_index]);
  avatar_ptr = ((UWORD)bank_data_ptrs[avatar_bank_ptr.bank]) + avatar_bank_ptr.offset;
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

void UIShowChoice(UWORD flag_index, UWORD line)
{
  UIShowMenu(flag_index, line, 0, MENU_CANCEL_ON_B_PRESSED | MENU_CANCEL_ON_LAST_OPTION);
}

void UIShowMenu(UWORD flag_index, UWORD line, UBYTE layout, UBYTE cancel_config)
{
  menu_index = 0;
  menu_flag = flag_index;
  menu_enabled = TRUE;
  menu_cancel_on_last_option = cancel_config & MENU_CANCEL_ON_LAST_OPTION;
  menu_cancel_on_b = cancel_config & MENU_CANCEL_ON_B_PRESSED;
  menu_layout = layout;
  tmp_text_draw_speed = text_draw_speed;
  text_draw_speed = 0;
  UIShowText(line);
  menu_num_options = tmp_text_lines[0];
  UIDrawMenuCursor();
}

void UISetTextBuffer(unsigned char *text)
{
  UIDrawFrame(0, 2, 20, 4);
  text_drawn = FALSE;
  strcpy(text_lines, text);
  text_x = 0;
  text_y = 0;
  text_count = 0;
  text_tile_count = 0;
}

void UIDrawTextBuffer()
{
  if ((time & 0x1) == 0)
  {
    UIDrawTextBufferChar();
  }
}

void UIDrawTextBufferChar()
{
  UBYTE letter;
  UBYTE i, text_remaining, word_len;
  UBYTE text_size = strlen(text_lines);
  UBYTE tile;
  UWORD ptr;

  if (text_wait > 0)
  {
    text_wait--;
    return;
  }

  if (text_count < text_size)
  {
    win_speed = text_draw_speed;
    text_drawn = FALSE;

    if (text_count == 0)
    {
      text_x = 0;
      text_y = 0;
    }

    letter = text_lines[text_count] - 32;

    // Clear tile data ready for text
    ptr = ((UWORD)bank_data_ptrs[FONT_BANK]) + FONT_BANK_OFFSET;

    // Determine if text can fit on line
    text_remaining = 18 - text_x;
    word_len = 0;
    for (i = text_count; i != text_size; i++)
    {
      if (text_lines[i] == ' ' || text_lines[i] == '\n' || text_lines[i] == '\0')
      {
        break;
      }
      word_len++;
    }
    if (word_len > text_remaining && word_len < 18)
    {
      text_x = 0;
      text_y++;
    }

    if (text_lines[text_count] != '\b' && text_lines[text_count] != '\n')
    {
      i = text_tile_count + avatar_enabled * 4;
      SetBankedBkgData(FONT_BANK, TEXT_BUFFER_START + i, 1, ptr + ((UWORD)letter * 16));
      tile = TEXT_BUFFER_START + i;
      set_win_tiles(text_x + 1 + avatar_enabled * 2 + menu_enabled + (text_y >= text_num_lines ? 9 : 0), (text_y % text_num_lines) + 1, 1, 1, &tile);
      text_tile_count++;
    }

    if (text_lines[text_count] == '\b')
    {
      text_x--;
      text_wait = 10;
    }

    text_count++;
    text_x++;
    if (text_lines[text_count] == '\n')
    {
      text_x = 0;
      text_y++;
      text_count++;
    }
    else if (text_x > 17)
    {
      text_x = 0;
      text_y++;
    }

    if (text_draw_speed == 0)
    {
      UIDrawTextBufferChar();
    }
  }
  else
  {
    text_drawn = TRUE;
    // restore the user selected text draw speed as it 
    // might have been override in UIShowMenu
    text_draw_speed = tmp_text_draw_speed; 
  }
}

void UISetPos(UBYTE x, UBYTE y)
{
  win_pos_x = x;
  win_dest_pos_x = x;
  win_pos_y = y;
  win_dest_pos_y = y;
}

void UIMoveTo(UBYTE x, UBYTE y, UBYTE speed)
{
  win_dest_pos_x = x;
  win_dest_pos_y = y;
  if (speed == 0)
  {
    win_pos_x = x;
    win_pos_y = y;
  }
  else
  {
    win_speed = speed;
  }
}

UBYTE UIIsClosed()
{
  return win_pos_y == MENU_CLOSED_Y && win_dest_pos_y == MENU_CLOSED_Y;
}

void UIDrawMenuCursor() 
{
  UBYTE i;
  for (i = 0; i < menu_num_options; i++) 
  {
    set_win_tiles(i >= text_num_lines ? 10 : 1, (i % text_num_lines) + 1, 1, 1, menu_index == i ? ui_cursor_tiles : ui_bg_tiles);
  }
}

void UICloseDialogue()
{
  UIMoveTo(menu_layout ? MENU_LAYOUT_INITIAL_X : 0, MENU_CLOSED_Y, text_out_speed);

  // Reset variables
  text_count = 0;
  text_lines[0] = '\0';
  text_tile_count = 0;
  text_num_lines = 3;
  menu_enabled = FALSE;
  menu_layout = 0;
  avatar_enabled = FALSE;
}

void UIOnInteract()
{
  if (JOY_PRESSED(J_A))
  {
    if (text_drawn && text_count != 0)
    {
      if (menu_enabled)
      {
        if (menu_cancel_on_last_option && menu_index + 1 == menu_num_options) 
        {
          script_variables[menu_flag] = 0;
        }
        else
        {
          script_variables[menu_flag] = menu_index + 1;
        }
        UICloseDialogue();
      }
      else
      {
        UICloseDialogue();
      }
    }
  }
  else if (menu_enabled)
  {
    if (JOY_PRESSED(J_UP))
    {
      menu_index = MAX(menu_index - 1, 0);
      UIDrawMenuCursor();
    }
    else if (JOY_PRESSED(J_DOWN))
    {
      menu_index = MIN(menu_index + 1, menu_num_options - 1);
      UIDrawMenuCursor();
    }
    else if (JOY_PRESSED(J_LEFT))
    {
      if(menu_layout == 0) {
        menu_index = MAX(menu_index - 4, 0);
      } else {
        menu_index = 0;
      }      
      UIDrawMenuCursor();
    }
    else if (JOY_PRESSED(J_RIGHT))
    {
      if(menu_layout == 0) {
        menu_index = MIN(menu_index + 4, menu_num_options - 1);
      } else {
        menu_index = menu_num_options - 1;
      }
      UIDrawMenuCursor();
    }
    else if (menu_cancel_on_b && JOY_PRESSED(J_B))
    {
      script_variables[menu_flag] = 0;
      UICloseDialogue();
    }
  }
}

UBYTE UIAtDest()
{
  return win_pos_x == win_dest_pos_x && win_pos_y == win_dest_pos_y;
}

void UISetColor(UBYTE color)
{
  PUSH_BANK(ui_bank);
  UISetColor_b(color);
  POP_BANK;
}
