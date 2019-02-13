#ifndef UI_H
#define UI_H

#include <gb/gb.h>

#define HP_SYMBOL "\""
#define AP_SYMBOL "#"
#define MENU_OPEN_Y 112
#define MENU_CLOSED_Y (MAXWNDPOSY + 1)

extern UINT8 ui_bank;
extern unsigned char text_lines[80];

void UIInit();
void UIUpdate();
void UIDrawFrame(UBYTE x, UBYTE y, UBYTE width, UBYTE height);
void UIDrawText(char *str, UBYTE x, UBYTE y);
void UIDrawTextBkg(char *str, UBYTE x, UBYTE y);
void UISetTextBuffer(unsigned char *text);
void UIDrawTextBuffer();

#endif
