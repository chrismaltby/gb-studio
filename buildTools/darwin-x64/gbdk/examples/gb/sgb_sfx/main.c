#include <gb/gb.h>
#include <gb/sgb.h>

#include <stdint.h>
#include <stdbool.h>
#include <stdio.h>
#include <gbdk/console.h>

#include "sgb_snd_sfx.h"
#include "sgb_sfx_names.h"


// Stores button presses
uint8_t keys = 0x00, keys_last = 0x00;


// Default SFX attributes
uint8_t sgb_sfx_a_pitch = SGB_SND_PITCH_HI; // Bits 0..1
uint8_t sgb_sfx_a_vol   = SGB_SND_VOL_HI;   // Bits 2..3
uint8_t sgb_sfx_b_pitch = SGB_SND_PITCH_HI; // Bits 4..5
uint8_t sgb_sfx_b_vol   = SGB_SND_VOL_HI;   // Bits 6..7


// Default values for SFX types
uint8_t sfx_num_a = SGB_SND_EFFECT_A_MIN;
uint8_t sfx_num_b = SGB_SND_EFFECT_B_MIN;

static uint8_t sgb_buf[20]; // Should be sized to fit max payload bytes + 1 for command byte


// Play a SGB sound effect
//
// Setting either effect parameter to SGB_SND_EFFECT_EMPTY will skip it.
// The pitch and volume settings are not changed in this example, but could be.
void sgb_sound_effect(uint8_t sfx_a, uint8_t sfx_b) {
    sgb_buf[0] = (SGB_SOUND << 3) | 1;  // 1 is number of packets to transfer
    sgb_buf[1] = sfx_a;  // Effect A
    sgb_buf[2] = sfx_b;  // Effect B
    sgb_buf[3] = sgb_sfx_a_pitch | (sgb_sfx_a_vol << 2) | (sgb_sfx_b_pitch << 4) | (sgb_sfx_b_vol << 6);
    sgb_buf[4] = SGB_MUSIC_SCORE_CODE_NONE; // Must be zero if not used
    sgb_transfer(sgb_buf);
}


#define DISP_SFX_A_START 3
#define DISP_SFX_B_START 10

// Display basic operation info on the screen
void init_display(void) {
    gotoxy(0,1);
    printf("SGB BUILT-IN SFX");

    gotoxy(0,DISP_SFX_A_START);
    printf("SFX A:\n");
    printf(" PLAY: A\n");
    printf(" STOP: SELECT + A\n");
    printf(" TYPE: UP / DOWN\n");

    gotoxy(0,DISP_SFX_B_START);
    printf("SFX B:\n");
    printf(" PLAY: B\n");
    printf(" STOP: SELECT + B\n");
    printf(" TYPE: LEFT / RIGHT\n");
}


// Update the display if either of the sfx types have changed
void update_display(void) {

    gotoxy(7u, DISP_SFX_A_START);
    printf("0x%hx", (uint8_t)sfx_num_a);
    gotoxy(1u, DISP_SFX_A_START + 4u);
    printf("%s", (const char *)sgb_sfx_names_table_a[sfx_num_a]);


    gotoxy(7u, DISP_SFX_B_START);
    printf("0x%hx", (uint8_t)sfx_num_b);
    gotoxy(1u, DISP_SFX_B_START + 4u);
    printf("%s", (const char *)sgb_sfx_names_table_b[sfx_num_b]);
}


// Process button presses
void handle_input(void) {

    bool display_update_queued = false;

    // Filter so only buttons newly pressed have their bits set
    switch ((keys ^ keys_last) & keys) {

        // Effect "A" playback controls
        case J_A: if (keys & J_SELECT) {
                      // Stop the effect
                      sgb_sound_effect(SGB_SND_EFFECT_STOP, SGB_SND_EFFECT_EMPTY);
                  } else {
                      // Start the effect
                      sgb_sound_effect(sfx_num_a, SGB_SND_EFFECT_EMPTY);
                  }
                  break;

        // Effect "B" playback controls
        case J_B: if (keys & J_SELECT) {
                      // Stop the effect
                      sgb_sound_effect(SGB_SND_EFFECT_EMPTY, SGB_SND_EFFECT_STOP);
                  } else {
                      // Start the effect
                      sgb_sound_effect(SGB_SND_EFFECT_EMPTY, sfx_num_b);
                  }
                  break;


        // Effect type selectors
        case (J_UP): sfx_num_a++;
                  if (sfx_num_a > SGB_SND_EFFECT_A_MAX) sfx_num_a = SGB_SND_EFFECT_A_MIN;
                  display_update_queued = true;
                  break;

        case (J_DOWN): sfx_num_a--;
                 if (sfx_num_a < SGB_SND_EFFECT_A_MIN) sfx_num_a = SGB_SND_EFFECT_A_MAX;
                  display_update_queued = true;
                 break;

        case (J_RIGHT): sfx_num_b++;
                  if (sfx_num_b > SGB_SND_EFFECT_B_MAX) sfx_num_b = SGB_SND_EFFECT_B_MIN;
                  display_update_queued = true;
                  break;

        case (J_LEFT): sfx_num_b--;
                  if (sfx_num_b < SGB_SND_EFFECT_B_MIN) sfx_num_b = SGB_SND_EFFECT_B_MAX;
                  display_update_queued = true;
                  break;
    }

    if (display_update_queued)
        update_display();
}


void main(void) {

    // Wait 4 frames
    // For SGB on PAL SNES this delay is required on startup, otherwise borders don't show up
    for (uint8_t i = 4; i != 0; i--) vsync();

    DISPLAY_ON;

    if (sgb_check()) {

        init_display();
        update_display();

        while(1) {
            vsync();

            keys_last = keys;
            keys = joypad();

            handle_input();
       }
    } else {
        printf("NO SGB DETECTED");
    }

}
