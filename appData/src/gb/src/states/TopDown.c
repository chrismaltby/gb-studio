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
#include "Input.h"

INT16 my_scroll_x = 0;
INT16 my_scroll_y = 0;
UBYTE img_index = 6;

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

	// set_sprite_tile(0, 0);
	// set_sprite_tile(1, 2);
    // set_sprite_tile(2, 4);
    // set_sprite_tile(3, 6);

	// set_sprite_prop(0, 0);
	// set_sprite_prop(1, 0);
	// set_sprite_prop(2, 1);
	// set_sprite_prop(3, 1);

    scroll_target = &sprites[0].pos;
}

void Update_TopDown()
{
    // Controls
    if (joy & J_LEFT)
    { // Left pressed
        sprites[0].pos.x -= 1;
    }
    else if (joy & J_RIGHT)
    { // Right pressed
        sprites[0].pos.x += 1;
    }
    if (joy & J_UP)
    { // Up pressed
        sprites[0].pos.y -= 1;
    }
    else if (joy & J_DOWN)
    { // Down pressed
        sprites[0].pos.y += 1;
    }

    if((joy & J_START) && !(last_joy & J_START)) {
        if(img_index == 7) {
            img_index = 6;
        } else {
            img_index = 7;
        }
        sprites[0].pos.x = 32;
        sprites[0].pos.y = 32;
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
}
