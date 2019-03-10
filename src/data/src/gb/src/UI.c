#include "UI.h"
#include "BankManager.h"
#include "game.h"
#include "data_ptrs.h"
#include "Macros.h"

void UIInit_b();
void UIUpdate_b();
void UIDrawFrame_b(UBYTE x, UBYTE y, UBYTE width, UBYTE height);
void UIDrawTextBufferChar();
void UISetColor_b(UWORD image_index);

UBYTE win_pos_x;
UBYTE win_pos_y;
UBYTE win_dest_pos_x;
UBYTE win_dest_pos_y;

UBYTE menu_y = MENU_CLOSED_Y;
UBYTE menu_dest_y = MENU_CLOSED_Y;
UBYTE text_x;
UBYTE text_y;
UBYTE text_drawn;
UBYTE text_count;
UBYTE text_wait;

unsigned char text_lines[80] = "";

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
  UIDrawFrame(0, 0, 20, 4);
  PUSH_BANK(16);
  strcpy(text_lines, "");
  strcat(text_lines, strings_16[line]);
  POP_BANK;
  // menu_dest_y = MENU_OPEN_Y;
  UISetPos(0, MENU_CLOSED_Y);
  UIMoveTo(0, MENU_OPEN_Y);
  text_drawn = FALSE;
  text_x = 0;
  text_y = 0;
  text_count = 0;
}

void UISetTextBuffer(unsigned char *text)
{
  UIDrawFrame(0, 2, 20, 4);
  text_drawn = FALSE;
  strcpy(text_lines, text);
  text_x = 0;
  text_y = 0;
  text_count = 0;
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

  if (text_wait > 0)
  {
    text_wait--;
    return;
  }

  if (text_count < text_size)
  {

    text_drawn = FALSE;

    if (text_count == 0)
    {
      text_x = 0;
      text_y = 0;
    }
    // letter = text_lines[text_count].charCodeAt(0) + 0xA5;
    letter = text_lines[text_count] + 0xA5;

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

    if (text_lines[text_count] != '\b')
    {
      set_win_tiles(text_x + 1, text_y + 1, 1, 1, &letter);
    }

    if (text_lines[text_count] == '\b')
    {
      text_x--;
      text_wait = 10;
    }
    else if (text_lines[text_count] == ' ' && text_x == 0)
    {
      text_x--;
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
  }
  else
  {
    text_drawn = TRUE;
  }
}

void UISetPos(UBYTE x, UBYTE y)
{
  win_pos_x = x;
  win_dest_pos_x = x;
  win_pos_y = y;
  win_dest_pos_y = y;
}

void UIMoveTo(UBYTE x, UBYTE y)
{
  win_dest_pos_x = x;
  win_dest_pos_y = y;
}

UBYTE UIIsClosed()
{
  return win_pos_y == MENU_CLOSED_Y && win_dest_pos_y == MENU_CLOSED_Y;
}

void UIOnInteract()
{
  if (text_drawn && text_count != 0)
  {
    UIMoveTo(0, MENU_CLOSED_Y);
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
