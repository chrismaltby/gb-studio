#pragma bank=18

#include "TopDown.h"
#include "assets.h"
#include "Scroll.h"
#include "DataManager.h"
#include "BankManager.h"
#include "TopDown.h"
#include "Sprite.h"
#include "Data.h"
#include "Core_Main.h"

INT16 my_scroll_x = 0;
INT16 my_scroll_y = 0;
UBYTE img_index = 6;
UBYTE last_joy = 0;

#define RGB_RED        RGB(31,  0,  0)
#define RGB_BLUE       RGB( 0,  0, 31)
#define RGB_PURPLE     RGB(21,  0, 21)
#define RGB_LIGHTFLESH RGB(30, 20, 15)

UWORD spritePalette[] = {
	0, RGB_RED, RGB_ORANGE, RGB_YELLOW,
	0, RGB_GREEN, RGB_BLUE, RGB_PURPLE,
	0, RGB_BLACK, RGB_BLUE, RGB_WHITE,
};

void Start_TopDown()
{
    UBYTE i;

    img_index = 0;

    // LoadImage(img_index);
    LoadScene(0);

    // k = 0;

    for(i=0; i!=MAX_SPRITES + 1; i++) {
        // set_sprite_tile((i<<1), k);
        // set_sprite_tile((i<<1)+1, k+2);        
        // k += LoadSprite(i,k);
        sprites[i].sprite = (i<<1);
        // sprites[i].pos.x = 64 + (i<<4);
        // sprites[i].pos.y = 64 + (i<<4);
    }

    // sprites[4].pos.x = 320;
    // sprites[3].pos.y = 320;

    // LoadSprite(0,0);

    // sprites[0].pos.x = 32;
    // sprites[0].pos.y = 64;

    set_sprite_palette(0, 7, spritePalette);

	set_sprite_tile(0, 0);
	set_sprite_tile(1, 2);
    set_sprite_tile(2, 4);
    set_sprite_tile(3, 6);

	set_sprite_prop(0, 0);
	set_sprite_prop(1, 0);
	set_sprite_prop(2, 1);
	set_sprite_prop(3, 2);

    scroll_target = &sprites[0].pos;
}

void Update_TopDown()
{
    UBYTE joy;

    joy = joypad();

    // Controls
    if (joy & J_LEFT)
    { // Left pressed
        // my_scroll_x -= 1;
        sprites[0].pos.x -= 1;
    }
    else if (joy & J_RIGHT)
    { // Right pressed
        // my_scroll_x += 1;
        sprites[0].pos.x += 1;
    }
    if (joy & J_UP)
    { // Up pressed
        // my_scroll_y -= 1;
        sprites[0].pos.y -= 1;
    }
    else if (joy & J_DOWN)
    { // Down pressed
        // my_scroll_y += 1;
        sprites[0].pos.y += 1;
    }

    if((joy & J_START) && !(last_joy & J_START)) {
        if(img_index == 7) {
            img_index = 6;
        } else {
            img_index = 7;
        }
        my_scroll_x = 0;
        my_scroll_y = 0;

        // SetState(0);
        DISPLAY_OFF
        LoadImage(img_index);
        DISPLAY_ON;
    }

    if (my_scroll_x < 0)
    {
        my_scroll_x = 0;
    }
    if (my_scroll_y < 0)
    {
        my_scroll_y = 0;
    }

    RefreshScroll();

    UpdateSprites();

    last_joy = joy;
}
