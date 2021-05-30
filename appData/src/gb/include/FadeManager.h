#ifndef FADE_MANAGER_H
#define FADE_MANAGER_H

#include <gb/gb.h>

#define FADE_BANK 1
#define FADE_SPEED_MASK 0x3F
#define FADE_IN_FLAG 0x40
#define FADE_ENABLED_FLAG 0x80

typedef enum { FADE_IN, FADE_OUT } FADE_DIRECTION;

extern UBYTE fade_running;
extern UBYTE fade_frames_per_step;

/**
 * Initialise fade variables
 */
void FadeInit();

/**
 * Start Fade In
 */
void FadeIn();

/**
 * Start Fade Out
 */
void FadeOut();

/**
 * Update current fade
 */
void FadeUpdate();

/**
 * Refresh tile coloring to reflect changes in palette
 * Call after LoadPalette etc.
 */
void ApplyPaletteChange();

/**
 * Change current fade speed
 * 
 * @param speed new fade speed
 */
void FadeSetSpeed(UBYTE speed);

/**
 * Check if fade is currently running
 * 
 * @return TRUE if fade is currently running
 */
UBYTE IsFading();
extern UBYTE fade_running;
extern UBYTE fade_frames_per_step;
extern UBYTE fade_black;
extern UBYTE fade_timer;

#endif
