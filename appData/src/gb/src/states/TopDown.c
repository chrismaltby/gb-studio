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
#include "Collision.h"
#include "Actor.h"

void Start_TopDown()
{
    UBYTE i;

    // LoadImage(img_index);
    // LoadScene(0);

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

    scroll_target = &actors[0].pos;
}

void Update_TopDown()
{
    UBYTE tile_x, tile_y;

    tile_x = actors[0].pos.x >> 3;
    tile_y = actors[0].pos.y >> 3;

    // Move
    if(ACTOR_ON_TILE(0)) {
        actors[0].vel.x = 0;
        actors[0].vel.y = 0;

        if (joy & J_LEFT)
        { // Left pressed
            if (!TileAt(tile_x - 1, tile_y)) {
                actors[0].vel.x -= 1;
            }
        }
        else if (joy & J_RIGHT)
        { // Right pressed
            if (!TileAt(tile_x + 2, tile_y)) {
                actors[0].vel.x += 1;
            }
        }
        else {
            if (joy & J_UP)
            { // Up pressed
                if (!TileAt(tile_x, tile_y - 1) && !TileAt(tile_x + 1, tile_y - 1)) {
                    actors[0].vel.y -= 1;
                }
            }
            else if (joy & J_DOWN)
            { // Down pressed
                if (!TileAt(tile_x, tile_y + 1) && !TileAt(tile_x + 1, tile_y + 1)) {
                    actors[0].vel.y += 1;
                }
            }
        }
    }


    // // iT(!TileAt(tx, ty)) {
    // if(ACTOR_ON_TILE(0)) {
    //     // Controls
    //     if (joy & J_LEFT)
    //     { // Left pressed
    //         sprites[0].pos.x -= 1;
    //     }
    //     else if (joy & J_RIGHT)
    //     { // Right pressed
    //         sprites[0].pos.x += 1;
    //     }
    //     if (joy & J_UP)
    //     { // Up pressed
    //         sprites[0].pos.y -= 1;
    //     }
    //     else if (joy & J_DOWN)
    //     { // Down pressed
    //         sprites[0].pos.y += 1;
    //     }
    // }

    if((joy & J_START) && !(last_joy & J_START)) {
        actors[0].pos.x = 32;
        actors[0].pos.y = 32;
    }

    UpdateActors();
    RefreshScroll();
    MoveActors();

    // tx = sprites[0].pos.x >> 3;
    // ty = sprites[0].pos.y >> 3;
}
