#include "FadeManager.h"

#include "BankManager.h"

UBYTE fade_running;
UBYTE fade_frames_per_step;
UBYTE fade_black = 0;
UBYTE fade_timer = 0;

const UBYTE fade_speeds[] = {0x0, 0x1, 0x3, 0x7, 0xF, 0x1F, 0x3F};

void FadeIn_b() __banked;
void FadeOut_b() __banked;
void FadeUpdate_b() __banked;
void ApplyPaletteChange_b() __banked;

void FadeInit() {
  fade_frames_per_step = fade_speeds[2];
}

void FadeIn() {
  FadeIn_b();
}

void FadeOut() {
  FadeOut_b();
}

void FadeUpdate() {
  FadeUpdate_b();
}

void ApplyPaletteChange() {
  ApplyPaletteChange_b();
}

void FadeSetSpeed(UBYTE speed) {
  fade_frames_per_step = fade_speeds[speed];
}

UBYTE IsFading() {
  return fade_running;
}
