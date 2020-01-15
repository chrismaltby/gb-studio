#include "Sprite.h"
#include "Scroll.h"
#include "Math.h"
#include "Time.h"

#define SCREENWIDTH_PLUS_32 192  //160 + 32
#define SCREENHEIGHT_PLUS_32 176 //144 + 32

Sprite sprites[MAX_SPRITES];

void UpdateSprites()
{
	/*
	UBYTE i, k, frame; //, flip, fo;
	UINT16 screen_x;
	UINT16 screen_y;

	k = 0;
	for (i = 0; i != MAX_SPRITES; i++)
	{
		screen_x = sprites[i].pos.x - scroll_x;
		screen_y = sprites[i].pos.y - scroll_y;

		if (IS_FRAME_8)
		{
			sprites[i].frame_offset++;
			if (sprites[i].frame_offset == sprites[i].frames_len)
			{
				sprites[i].frame_offset = 0;
			}
		}

		// flip = actors[i].flip;

		// if (actors[i].sprite_type != SPRITE_STATIC)
		// {
		// 	flip = FALSE;

		// 	// Increase frame based on facing direction
		// 	if (IS_NEG(actors[i].dir.y))
		// 	{
		// 		fo = 1 + (actors[i].sprite_type == SPRITE_ACTOR_ANIMATED);
		// 	}
		// 	else if (actors[i].dir.x != 0)
		// 	{
		// 		fo = 2 + MUL_2(actors[i].sprite_type == SPRITE_ACTOR_ANIMATED);
		// 		// Facing left so flip sprite
		// 		if (IS_NEG(actors[i].dir.x))
		// 		{
		// 			flip = TRUE;
		// 		}
		// 	}
		// 	else
		// 	{
		// 		fo = 0;
		// 	}

		// 	actors[i].flip = FALSE;
		// 	actors[i].flip = flip;
		// }

		//It might sound stupid adding 32 in both sides but remember the values are unsigned! (and maybe truncated after substracting scroll_)
		if ((screen_x + 32u < SCREENWIDTH_PLUS_32) && (screen_y + 32 < SCREENHEIGHT_PLUS_32))
		{
			move_sprite(k, screen_x, screen_y);
			move_sprite(k + 1, screen_x + 8, screen_y);

			frame = MUL_4(sprites[i].frame + sprites[i].frame_offset);
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
			// 	move_sprite(k, 0, 0);
			// 	move_sprite(k + 1, 0, 0);
			// }
		}
	}
	*/
}
