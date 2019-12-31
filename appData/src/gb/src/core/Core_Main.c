#include "game.h"
#include "main.h"
#include "Scroll.h"
#include "BankManager.h"
#include "assets.h"
#include "Fade.h"
#include "Time.h"
#include "Input.h"

UBYTE time;
UINT8 next_state;

UINT8 delta_time;
UINT8 current_state;
UINT8 state_running = 0;

UINT8 vbl_count;
INT16 old_scroll_x, old_scroll_y;
UINT8 music_mute_frames = 0;

#define RGB_RED        RGB(31,  0,  0)
#define RGB_BLUE       RGB( 0,  0, 31)
#define RGB_PURPLE     RGB(21,  0, 21)
#define RGB_LIGHTFLESH RGB(30, 20, 15)

UWORD spritePalette[] = {
	0, RGB_WHITE, RGB_LIGHTFLESH, RGB_BLACK,
	0, RGB_WHITE, RGB_PURPLE, RGB_BLACK,
	0, RGB_BLACK, RGB_BLUE, RGB_WHITE,
};

void SetState(UINT8 state)
{
	state_running = 0;
	next_state = state;
}

void vbl_update()
{
	vbl_count++;

	//Instead of assigning scroll_y to SCX_REG I do a small interpolation that smooths the scroll transition giving the
	//Illusion of a better frame rate
	if (old_scroll_x < scroll_x)
		old_scroll_x += (scroll_x - old_scroll_x + 1) >> 1;
	else if (old_scroll_x > scroll_x)
		old_scroll_x -= (old_scroll_x - scroll_x + 1) >> 1;
	SCX_REG = old_scroll_x;

	if (old_scroll_y < scroll_y)
		old_scroll_y += (scroll_y - old_scroll_y + 1) >> 1;
	else if (old_scroll_y > scroll_y)
		old_scroll_y -= (old_scroll_y - scroll_y + 1) >> 1;
	SCY_REG = old_scroll_y;

	// if(music_mute_frames != 0) {
	// 	music_mute_frames --;
	// 	if(music_mute_frames == 0) {
	// 		gbt_enable_channels(0xF);
	// 	}
	// }
}

UINT16 default_palette[] = {RGB(31, 31, 31), RGB(20, 20, 20), RGB(10, 10, 10), RGB(0, 0, 0)};
int core_start()
{
#ifdef CGB
	cpu_fast();
#endif

	// Init LCD
	LCDC_REG = 0x67;

	add_VBL(vbl_update);
	set_interrupts(VBL_IFLAG | LCD_IFLAG);

	STAT_REG = 0x45;

	// Set palettes
	BGP_REG = OBP0_REG = 0xE4U;
	OBP1_REG = 0xD2U;

	// Position Window Layer
	WX_REG = 7;
	WY_REG = MAXWNDPOSY + 1; // - 23;

	// DISPLAY_ON;
	// SHOW_SPRITES;

    set_sprite_palette(0, 7, spritePalette);

	state_running = 0;
	next_state = 1;
	time = 0;

	while (1)
	{
		while (state_running)
		{
			if (!vbl_count)
				wait_vbl_done();
			delta_time = vbl_count == 1u ? 0u : 1u;
			vbl_count = 0;

			last_joy = joy;	
			joy = joypad();

			// SpriteManagerUpdate();
			PUSH_BANK(stateBanks[current_state]);
			updateFuncs[current_state]();
			POP_BANK;

			time++;
		}

		// FadeIn();
		DISPLAY_OFF

		// gbt_stop();
		// last_music = 0;

		// last_sprite_loaded = 0;
		// SpriteManagerReset();
		state_running = 1;
		current_state = next_state;
		scroll_target = 0;

		// #ifdef CGB
		// 		if (_cpu == CGB_TYPE) {
		// 			SetPalette(BG_PALETTE, 0, 1, default_palette, 1);
		// 			SetPalette(SPRITES_PALETTE, 0, 1, default_palette, 1);
		// 		} else
		// #endif
		// 			BGP_REG = OBP0_REG = OBP1_REG = PAL_DEF(0, 1, 2, 3);

		PUSH_BANK(stateBanks[current_state]);
		(startFuncs[current_state])();
		POP_BANK;
		old_scroll_x = scroll_x;
		old_scroll_y = scroll_y;

		if (state_running)
		{
			DISPLAY_ON;
			// FadeOut();
		}

	}
}
