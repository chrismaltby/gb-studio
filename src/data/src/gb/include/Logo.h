#ifndef LOGO_H
#define LOGO_H

#include <gb/gb.h>

extern UINT8 logo_bank;

typedef enum {
  INTRO_NINTENDO = 1,
  INTRO_LOGO
} INTRO_STATE;

void LogoInit();
void LogoUpdate();

#endif
