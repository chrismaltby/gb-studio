#include "Actor.h"
#include "Sprite.h"
#include "Scroll.h"
#include "Math.h"
#include "Time.h"

#define SCREENWIDTH_PLUS_32 192  //160 + 32
#define SCREENHEIGHT_PLUS_32 176 //144 + 32

Actor actors[MAX_ACTORS];
UBYTE actors_active[MAX_ACTORS];

void UpdateActors() {
	UBYTE i, k, frame; //, flip, fo;
	UINT16 screen_x;
	UINT16 screen_y;

    for(i=0; i!=MAX_ACTORS; i++) {

        actors[i].pos.x = (WORD) actors[i].pos.x + (BYTE) actors[i].vel.x;
        actors[i].pos.y = (WORD) actors[i].pos.y + (BYTE) actors[i].vel.y;

        screen_x = actors[i].pos.x - scroll_x;
        screen_y = actors[i].pos.y - scroll_y;

        k = 0;

        if (IS_FRAME_8)
        {
            actors[i].frame_offset++;
            if (actors[i].frame_offset == actors[i].frames_len)
            {
                actors[i].frame_offset = 0;
            }
        }

    }

    // //It might sound stupid adding 32 in both sides but remember the values are unsigned! (and maybe truncated after substracting scroll_)
    // if ((screen_x + 32u < SCREENWIDTH_PLUS_32) && (screen_y + 32 < SCREENHEIGHT_PLUS_32))
    // {
    //     move_sprite(k, screen_x + 8, screen_y + 8);
    //     move_sprite(k + 1, screen_x + 16, screen_y + 8);

    //     frame = MUL_4(actors[0].frame + actors[0].frame_offset);
    //     set_sprite_tile(k, frame);
    //     set_sprite_tile(k + 1, frame + 2);
    //     k+=2;
    // }
    // else
    // {
    //         // move_sprite(k, 0, 0);
    //         // move_sprite(k + 1, 0, 0);			
    //     // if ((screen_x + 64) > (16 + SCREENWIDTH) ||
    //     // 	(screen_y + 64) > (16 + SCREENHEIGHT))
    //     // {
    //     // 	move_sprite(k, 0, 0);
    //     // 	move_sprite(k + 1, 0, 0);
    //     // }
    // }


    // sprites[0].pos.y = 0;
    // sprites[0].pos.x = 0;

    // x = actors[0].pos.x;
    // y = actors[0].pos.y;

    // sprites[0].pos.y = (UWORD) y + (UWORD) 8u;
    // sprites[0].pos.x = (UWORD) x + (UWORD) 8u;

	// for (i = 0; i != MAX_ACTORS; i++)
	// {    
    //     sprites[actors[0].sprite].pos.x = actors[0].pos.x;
    //     sprites[actors[0].sprite].pos.y = actors[0].pos.y;
    // }
}


void MoveActors() {
	UBYTE i, k, frame; //, flip, fo;
	UINT16 screen_x;
	UINT16 screen_y;

    k = 0;

    for(i=0; i!=MAX_ACTORS; i++) {

        screen_x = actors[i].pos.x - scroll_x;
        screen_y = actors[i].pos.y - scroll_y;

        //It might sound stupid adding 32 in both sides but remember the values are unsigned! (and maybe truncated after substracting scroll_)
        if ((screen_x + 32u < SCREENWIDTH_PLUS_32) && (screen_y + 32 < SCREENHEIGHT_PLUS_32))
        {
            move_sprite(k, screen_x + 8, screen_y + 8);
            move_sprite(k + 1, screen_x + 16, screen_y + 8);

            frame = MUL_4(actors[i].frame + actors[i].frame_offset);
            set_sprite_tile(k, frame);
            set_sprite_tile(k + 1, frame + 2);
            k+=2;
        }
        else
        {
                // move_sprite(k, 0, 0);
                // move_sprite(k + 1, 0, 0);			
            // if ((screen_x + 64) > (16 + SCREENWIDTH) ||
            // 	(screen_y + 64) > (16 + SCREENHEIGHT))
            // {
            	move_sprite(k, 0, 0);
            	move_sprite(k + 1, 0, 0);
            // }
        }
    }

    // for(k <)


    // sprites[0].pos.y = 0;
    // sprites[0].pos.x = 0;

    // x = actors[0].pos.x;
    // y = actors[0].pos.y;

    // sprites[0].pos.y = (UWORD) y + (UWORD) 8u;
    // sprites[0].pos.x = (UWORD) x + (UWORD) 8u;

	// for (i = 0; i != MAX_ACTORS; i++)
	// {    
    //     sprites[actors[0].sprite].pos.x = actors[0].pos.x;
    //     sprites[actors[0].sprite].pos.y = actors[0].pos.y;
    // }
}
