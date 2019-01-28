#ifndef TITLE_H
#define TITLE_H

#include <gb/gb.h>

extern UINT8 title_bank;

extern UBYTE title_bg_timer;
extern BYTE title_inter_i;

void TitleInit();
void TitleUpdate();
void TitleCleanup();
void TitleLCDHandle();

#endif
