#include "Sprite.h"
#include "Scroll.h"

#define SCREENWIDTH_PLUS_32 192 //160 + 32
#define SCREENHEIGHT_PLUS_32 176 //144 + 32

Sprite sprites[MAX_SPRITES];

void UpdateSprites() {
    UBYTE i;
	UINT16 screen_x;
	UINT16 screen_y;

    for(i=0; i!=MAX_SPRITES; i++) {
        // move_sprite(sprites[i].sprite, sprites[i].pos.x - scroll_x, sprites[i].pos.y - scroll_y);  
        // move_sprite(sprites[i].sprite+1, sprites[i].pos.x + 8 - scroll_x, sprites[i].pos.y - scroll_y);
    
		screen_x = sprites[i].pos.x - scroll_x;
		screen_y = sprites[i].pos.y - scroll_y;

		//It might sound stupid adding 32 in both sides but remember the values are unsigned! (and maybe truncated after substracting scroll_)
		if((screen_x + 32u < SCREENWIDTH_PLUS_32) && (screen_y + 32 < SCREENHEIGHT_PLUS_32)) {
			move_sprite(sprites[i].sprite, screen_x, screen_y);  
			move_sprite(sprites[i].sprite+1, screen_x + 8, screen_y);
		} else {
			if((screen_x + 64) > (16 + SCREENWIDTH) ||
					(screen_y+ 64) > (16 + SCREENHEIGHT)
			) {
				move_sprite(sprites[i].sprite, 0, 0);  
				move_sprite(sprites[i].sprite+1, 0, 0);
			}
		}
    }
}
