#include "Sprite.h"
#include "Stack.h"

Sprite sprites[MAX_SPRITES];

DECLARE_STACK(sprite_pool, MAX_SPRITES);
UINT8 sprite_active_pool[MAX_SPRITES];
UBYTE sprite_active_pool_size = 0;

void SpritePoolReset()
{
	UBYTE i, k;
	for (i = MAX_SPRITES; i != 0; i--)
	{
		k = i << 1;
		sprite_pool[i] = MAX_SPRITES - i;
		move_sprite(k, 0, 0);
		move_sprite(k + 1, 0, 0);
	}
	sprite_pool[0] = MAX_SPRITES;
	sprite_active_pool[0] = 0;
	sprite_active_pool_size = 0;
}

void SpritePoolReturn(UINT8 i)
{
	UBYTE j, a, k;

	a = 0; // Required to fix GBDK bug

	// UIDebugLog(i, 18, 0);
	// LOG("SPRITE:: returntopool %u\n", i);

	StackPush(sprite_pool, i);

    for(j=0; j != sprite_active_pool_size; j++) {
		// UIDebugLog(j, j, 1);
        if(sprite_active_pool[j] == i) {
            a = j;
			break;
			// UIDebugLog(a, a, 2);
        }
    }

	// UIDebugLog(i, 19, 0);
	// UIDebugLog(a, 17, 0);

    if(a) {
		// LOG("SPRITE:: returntopool a= %u\n", a);

        sprite_active_pool[a] = sprite_active_pool[--sprite_active_pool_size];
		k = i << 1;
		// LOG("SPRITE:: hide %u and %u\n", k, k + 1);
		move_sprite(k, 0, 0);
		move_sprite(k + 1, 0, 0);		
    }
}

UINT8 SpritePoolNext()
{
	UINT8 next = StackPop(sprite_pool);
	sprite_active_pool[sprite_active_pool_size++] = next;
	sprites[next].rerender = TRUE;
	LOG("SPRITE:: gotfrompool %u\n", next);
	return next;
}

void UpdateSprites()
{
	UBYTE i, s, k, frame; //, flip, fo;
	UINT16 screen_x;
	UINT16 screen_y;

	k = 0;

	// for(j=0; j != 8; j++) {
	// 	if(j < sprite_active_pool_size) {
	// 		UIDebugLog(sprite_active_pool[j], j, 0);
	// 	} else {
	// 		UIDebugLog(0, j, 0);
	// 	}
	// 	    // for(j=0; j != sprite_active_pool_size; j++) {


	// }


	// LOG_VALUE("sprite_active_pool_size", sprite_active_pool_size);
	// LOG_VALUE("sprite_active_pool[0]", sprite_active_pool[0]);
	// LOG_VALUE("sprite_active_pool[1]", sprite_active_pool[1]);
	// LOG_VALUE("sprite_active_pool[2]", sprite_active_pool[2]);
	// LOG_VALUE("sprite_active_pool[3]", sprite_active_pool[3]);
	// LOG_VALUE("sprite_active_pool[4]", sprite_active_pool[4]);
	// LOG_VALUE("sprite_active_pool[5]", sprite_active_pool[5]);
	// LOG_VALUE("sprite_active_pool[6]", sprite_active_pool[6]);
	// LOG_VALUE("sprite_active_pool[7]", sprite_active_pool[7]);
	// LOG_VALUE("sprite_active_pool[8]", sprite_active_pool[8]);
	// LOG_VALUE("sprite_active_pool[9]", sprite_active_pool[9]);

	// LOG_VALUE("sprite_pool[0]", sprite_pool[0]);
	// LOG_VALUE("sprite_pool[1]", sprite_pool[1]);
	// LOG_VALUE("sprite_pool[2]", sprite_pool[2]);
	// LOG_VALUE("sprite_pool[3]", sprite_pool[3]);
	// LOG_VALUE("sprite_pool[4]", sprite_pool[4]);
	// LOG_VALUE("sprite_pool[5]", sprite_pool[5]);
	// LOG_VALUE("sprite_pool[6]", sprite_pool[6]);
	// LOG_VALUE("sprite_pool[7]", sprite_pool[7]);
	// LOG_VALUE("sprite_pool[8]", sprite_pool[8]);
	// LOG_VALUE("sprite_pool[9]", sprite_pool[9]);

	for (i = 0; i != sprite_active_pool_size; i++)
	{
		s = sprite_active_pool[i];
		k = s << 1;
		screen_x = sprites[s].pos.x;
		screen_y = sprites[s].pos.y;

		// LOG("MOVE SPRITE %u to %u %u\n", k, screen_x, screen_y);


		// if (IS_FRAME_8)
		// {
		// 	sprites[s].frame_offset++;
		// 	if (sprites[s].frame_offset == sprites[s].frames_len)
		// 	{
		// 		sprites[s].frame_offset = 0;
		// 	}
		// }

		if(sprites[s].rerender) {
			// LOG("SPRITE RERENDER %u\n", s);
			frame = MUL_4(sprites[s].frame + sprites[s].frame_offset);

		    if (sprites[s].flip)
		    {
		        set_sprite_prop(k, S_FLIPX);
		        set_sprite_prop(k + 1, S_FLIPX);
		        set_sprite_tile(k, frame + 2);
		        set_sprite_tile(k + 1, frame);
		    }
		    else
		    {
		        set_sprite_prop(k, 0);
		        set_sprite_prop(k + 1, 0);
		        set_sprite_tile(k, frame);
		        set_sprite_tile(k + 1, frame + 2);
		    }

			sprites[s].rerender = FALSE;
		}

		move_sprite(k, screen_x, screen_y);
		move_sprite(k + 1, screen_x + 8, screen_y);

		// frame = MUL_4(sprites[i].frame + sprites[i].frame_offset);
		// set_sprite_tile(k, frame);
		// set_sprite_tile(k + 1, frame + 2);
		// k+=2;

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
		// if ((screen_x + 32u < SCREENWIDTH_PLUS_32) && (screen_y + 32 < SCREENHEIGHT_PLUS_32))
		// {
		// 	move_sprite(k, screen_x, screen_y);
		// 	move_sprite(k + 1, screen_x + 8, screen_y);

		// 	frame = MUL_4(sprites[i].frame + sprites[i].frame_offset);
		// 	set_sprite_tile(k, frame);
		// 	set_sprite_tile(k + 1, frame + 2);
		// 	k+=2;
		// }
		// else
		// {
		// 		move_sprite(k, 0, 0);
		// 		move_sprite(k + 1, 0, 0);
		// 	// if ((screen_x + 64) > (16 + SCREENWIDTH) ||
		// 	// 	(screen_y + 64) > (16 + SCREENHEIGHT))
		// 	// {
		// 	// 	move_sprite(k, 0, 0);
		// 	// 	move_sprite(k + 1, 0, 0);
		// 	// }
		// }
	}
}
