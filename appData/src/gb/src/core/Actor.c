#include "Actor.h"
#include "Sprite.h"
#include "Scroll.h"
#include "Math.h"
#include "Time.h"

#define SCREENWIDTH_PLUS_32 192  //160 + 32
#define SCREENHEIGHT_PLUS_32 176 //144 + 32

void ActivateActor(UBYTE i);
void DeactivateActiveActor(UBYTE i);

Actor actors[MAX_ACTORS];
UBYTE actors_active[MAX_ACTIVE_ACTORS];
UBYTE actors_active_delete[MAX_ACTIVE_ACTORS];
UBYTE actors_active_size = 0;

void UpdateActors() {
	UBYTE i, k, a; //, flip, fo;

    for(i=0; i!=actors_active_size; i++) {
        a = actors_active[i];

        actors[a].pos.x = (WORD) actors[a].pos.x + (BYTE) actors[a].vel.x;
        actors[a].pos.y = (WORD) actors[a].pos.y + (BYTE) actors[a].vel.y;

        k = 0;

        if (IS_FRAME_8)
        {
            actors[a].frame_offset++;
            if (actors[a].frame_offset == actors[a].frames_len)
            {
                actors[a].frame_offset = 0;
            }
        }
    }
}

void MoveActors() {
	UBYTE i, k, a, frame; //, flip, fo;
	UINT16 screen_x;
	UINT16 screen_y;
    UBYTE del_count = 0;

    k = 0;

    for(i=0; i!=actors_active_size; i++) {
        a = actors_active[i];

        screen_x = actors[a].pos.x - scroll_x;
        screen_y = actors[a].pos.y - scroll_y;

        //It might sound stupid adding 32 in both sides but remember the values are unsigned! (and maybe truncated after substracting scroll_)
        if ((screen_x + 32u < SCREENWIDTH_PLUS_32) && (screen_y + 32 < SCREENHEIGHT_PLUS_32))
        {
            move_sprite(k, screen_x + 8, screen_y + 8);
            move_sprite(k + 1, screen_x + 16, screen_y + 8);

            frame = MUL_4(actors[a].frame + actors[a].frame_offset);
            set_sprite_tile(k, frame);
            set_sprite_tile(k + 1, frame + 2);
            k+=2;
        }
        else
        {
            move_sprite(k, 0, 0);
            move_sprite(k + 1, 0, 0);			
            // if ((screen_x + 64) > (16 + SCREENWIDTH) ||
            // 	(screen_y + 64) > (16 + SCREENHEIGHT))
            // {
            	// move_sprite(k, 0, 0);
            	// move_sprite(k + 1, 0, 0);
            // }

            // Mark off screen actor for removal
            actors_active_delete[del_count] = i;
            del_count++;
        }
    }

    // Remove all offscreen actors
    for(i=0; i!=del_count; i++) {
        a = actors_active_delete[i];
        DeactivateActiveActor(a);
    }
}

UBYTE ActorIsActive(UBYTE i)
{
    UBYTE j;
    for(j = 0; j != actors_active_size; j++)
    {
        if(actors_active[j] == i) {
            return TRUE;
        }
    }
    return FALSE;
}

void ActivateActor(UBYTE i)
{    
    UBYTE j;
    if(actors_active_size == MAX_ACTIVE_ACTORS) {
        return;
    }
    // Stop if actor already active
    for(j = 0; j != actors_active_size; j++)
    {
        if(actors_active[j] == i) {
            return;
        }
    }    
    actors_active[actors_active_size++] = i;
}

void DeactivateActiveActor(UBYTE i)
{
    actors_active[i] = actors_active[actors_active_size--];
}
