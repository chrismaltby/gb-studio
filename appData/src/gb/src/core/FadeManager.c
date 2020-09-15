#include "FadeManager.h"

#include "BankManager.h"

UBYTE fade_running;
UBYTE fade_frames_per_step;
UBYTE fade_black = 0;
UBYTE fade_timer = 0;

const UBYTE fade_speeds[] = {0x0, 0x1, 0x3, 0x7, 0xF, 0x1F, 0x3F};

void FadeIn_b();
void FadeOut_b();
void FadeUpdate_b();
void ApplyPaletteChange_b();

void FadeInit() {
  fade_frames_per_step = fade_speeds[2];
}

void FadeIn() {
  PUSH_BANK(FADE_BANK);
  FadeIn_b();
  POP_BANK;
}

void FadeOut() {
  PUSH_BANK(FADE_BANK);
  FadeOut_b();
  POP_BANK;
}

void FadeUpdate() {
  PUSH_BANK(FADE_BANK);
  FadeUpdate_b();
  POP_BANK;
}

void ApplyPaletteChange() {
  PUSH_BANK(FADE_BANK);
  ApplyPaletteChange_b();
  POP_BANK;  
}

void FadeSetSpeed(UBYTE speed) {
  fade_frames_per_step = fade_speeds[speed];
}

UBYTE IsFading() {
  return fade_running;
}
