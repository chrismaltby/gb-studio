#ifndef UI_H
#define UI_H

#include <gb/gb.h>
#include "game.h"

#define HP_SYMBOL "\""
#define AP_SYMBOL "#"
#define MENU_OPEN_Y 112
#define MENU_CLOSED_Y (MAXWNDPOSY + 1)
#define TEXT_BUFFER_START 0xCC
#define MENU_LAYOUT_INITIAL_X 88

#define MENU_CANCEL_ON_LAST_OPTION  0x01U
#define MENU_CANCEL_ON_B_PRESSED    0x02U

extern UINT8 ui_bank;
extern unsigned char text_lines[80];
extern unsigned char tmp_text_lines[80];

extern UBYTE win_pos_x;
extern UBYTE win_pos_y;
extern UBYTE win_dest_pos_x;
extern UBYTE win_dest_pos_y;
extern UBYTE win_speed;
extern UBYTE text_in_speed;
extern UBYTE text_out_speed;
extern UBYTE text_draw_speed;
extern UBYTE tmp_text_in_speed;
extern UBYTE tmp_text_out_speed;

void UIInit();
void UIUpdate();
void UIDrawFrame(UBYTE x, UBYTE y, UBYTE width, UBYTE height);
void UIDrawDialogueFrame(UBYTE h);
void UIDrawText(char *str, UBYTE x, UBYTE y);
void UIDrawTextBkg(char *str, UBYTE x, UBYTE y);
void UIShowText(UWORD line);
void UIShowChoice(UWORD flag_index, UWORD line);
void UISetTextBuffer(unsigned char *text);
void UIDrawTextBuffer();
void UISetPos(UBYTE x, UBYTE y);
void UIMoveTo(UBYTE x, UBYTE y, UBYTE speed);
UBYTE UIIsClosed();
void UIOnInteract();
UBYTE UIAtDest();
void UISetColor(UBYTE color);
void UISetTextSpeed(UBYTE in, UBYTE out);
void UIShowAvatar(UBYTE avatar_index);
void UIShowMenu(UWORD flag_index, UWORD line, UBYTE layout, UBYTE cancel_config);
void UIDrawMenuCursor();

#endif
