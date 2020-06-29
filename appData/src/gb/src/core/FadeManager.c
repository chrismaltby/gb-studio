#include "FadeManager.h"

#include "BankManager.h"

UBYTE fade_running;
UBYTE fade_frames_per_step;

const UBYTE fade_speeds[] = {0x0, 0x1, 0x3, 0x7, 0xF, 0x1F, 0x3F};
// static const UBYTE obj_fade_to_black_vals[] = {0xF3, 0xF3, 0xE3, 0xE2, 0xD2, 0xD2};
// static const UBYTE bgp_fade_to_black_vals[] = {0xFF, 0xFF, 0xFE, 0xF9, 0xE9, 0xE4};

void FadeIn_b();
void FadeOut_b();
void FadeUpdate_b();

void FadeInit() {
  fade_frames_per_step = fade_speeds[2];
}

void FadeIn() {
  LOG("FadeIn\n");
  PUSH_BANK(FADE_BANK);
  FadeIn_b();
  POP_BANK;
}

void FadeOut() {
  LOG("FadeOut\n");
  PUSH_BANK(FADE_BANK);
  FadeOut_b();
  POP_BANK;
}

void FadeUpdate() {
  PUSH_BANK(FADE_BANK);
  FadeUpdate_b();
  POP_BANK;
}

void FadeSetSpeed(UBYTE speed) {
  fade_frames_per_step = fade_speeds[speed];
}

UBYTE IsFading() {
  return fade_running;
}
