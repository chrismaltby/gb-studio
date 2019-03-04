#ifndef UI_H
#define UI_H

#include <gb/gb.h>
#include "game.h";

#define HP_SYMBOL "\""
#define AP_SYMBOL "#"
#define MENU_OPEN_Y 112
#define MENU_CLOSED_Y (MAXWNDPOSY + 1)

extern UINT8 ui_bank;
extern unsigned char text_lines[80];

extern UBYTE menu_y;
extern UBYTE menu_dest_y;

extern UBYTE win_pos_x;
extern UBYTE win_pos_y;
extern UBYTE win_dest_pos_x;
extern UBYTE win_dest_pos_y;

void UIInit();
void UIUpdate();
void UIDrawFrame(UBYTE x, UBYTE y, UBYTE width, UBYTE height);
void UIDrawText(char *str, UBYTE x, UBYTE y);
void UIDrawTextBkg(char *str, UBYTE x, UBYTE y);
void UIShowText(UWORD line);
void UISetTextBuffer(unsigned char *text);
void UIDrawTextBuffer();
void UISetPos(UBYTE x, UBYTE y);
void UIMoveTo(UBYTE x, UBYTE y);
UBYTE UIIsClosed();
void UIOnInteract();
UBYTE UIAtDest();
void UISetColor(UBYTE color);

#endif
