#ifndef FADE_MANAGER_H
#define FADE_MANAGER_H

#include <gb/gb.h>

#define FADE_SPEED_MASK 0x3F
#define FADE_IN_FLAG 0x40
#define FADE_ENABLED_FLAG 0x80

void FadeInit();
void FadeIn();
void FadeOut();
void FadeUpdate();
void FadeSetSpeed(UBYTE speed);
UBYTE IsFading();

extern UBYTE fade_running;

typedef enum
{
  FADE_IN,
  FADE_OUT
} FADE_DIRECTION;

#endif
