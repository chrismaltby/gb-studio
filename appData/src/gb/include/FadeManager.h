#ifndef FADE_MANAGER_H
#define FADE_MANAGER_H

#include <gb/gb.h>
#include <gbdkjs.h>

#define FADE_BANK 1
#define FADE_SPEED_MASK 0x3F
#define FADE_IN_FLAG 0x40
#define FADE_ENABLED_FLAG 0x80

typedef enum { FADE_IN, FADE_OUT } FADE_DIRECTION;

void FadeInit();
void FadeIn();
void FadeOut();
void FadeUpdate();
void ApplyPaletteChange();
void FadeSetSpeed(UBYTE speed);
UBYTE IsFading();

extern UBYTE fade_running;
extern UBYTE fade_frames_per_step;

#endif
