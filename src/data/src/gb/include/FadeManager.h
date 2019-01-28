#ifndef FADE_MANAGER_H
#define FADE_MANAGER_H

#include <gb/gb.h>

void FadeInit();
void FadeIn();
void FadeOut();
void FadeUpdate();
void FadeSetSpeed(UBYTE speed);
UBYTE IsFading();

typedef enum {
  FADE_IN,
  FADE_OUT
} FADE_DIRECTION;

#endif
