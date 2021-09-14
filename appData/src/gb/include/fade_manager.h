#ifndef FADE_MANAGER_H
#define FADE_MANAGER_H

#include <gb/gb.h>

#define FADE_SPEED_MASK 0x3F
#define FADE_IN_FLAG 0x40
#define FADE_ENABLED_FLAG 0x80

typedef enum { FADE_IN, FADE_OUT } FADE_DIRECTION;

extern UBYTE fade_running;
extern UBYTE fade_frames_per_step;
extern UBYTE fade_black;
extern UBYTE fade_timer;
extern UBYTE fade_style;

#define BCPS_REG_ADDR 0x68
#define OCPS_REG_ADDR 0x6A

/**
 * Initialise fade variables
 */
void fade_init() __banked;

/**
 * Start Fade In
 */
void fade_in() __banked;

/**
 * Start Fade Out
 */
void fade_out() __banked;

/**
 * Update current fade
 */
void fade_update() __banked;

/**
 * Refresh tile coloring to reflect changes in palette
 * Call after LoadPalette etc.
 */
void fade_applypalettechange() __banked;

/**
 * Change current fade speed
 * 
 * @param speed new fade speed
 */
void fade_setspeed(UBYTE speed) __banked;

/**
 * Check if fade is currently running
 * 
 * @return TRUE if fade is currently running
 */
inline UBYTE fade_isfading() {
  return fade_running;
}

/**
 * Fade in and wait until complete
 */
void fade_in_modal() __banked;

/**
 * Fade out and wait until complete
 */
void fade_out_modal() __banked;

#endif
