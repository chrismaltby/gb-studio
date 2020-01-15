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
#include "Time.h"

INT16 my_scroll_x = 0;
INT16 my_scroll_y = 0;
UBYTE img_index = 6;
BYTE vel_y = 0;
UBYTE grounded = 0;
UBYTE p_time = 0;

#define GROUND 136

void Start_Platform()
{
    // LoadScene(0);
    p_time = 0;
    scroll_target = &sprites[0].pos;
}

void Update_Platform()
{
    // Move 
    if (INPUT_LEFT)
    {
        sprites[0].pos.x -= 2;
    }
    else if (INPUT_RIGHT)
    {
        sprites[0].pos.x += 2;
    }

    // ??? But needed
    INPUT_A;
    INPUT_A_PRESSED;
    
    // Jump
    if (INPUT_A_PRESSED && grounded)
    {
        vel_y = -5;
        grounded = FALSE;
        p_time = 0;
    }

    // Fall
    if(!grounded && vel_y != 8) {
        if(((p_time&0x3)==0) || !(INPUT_A)) {
            vel_y++;
        }
    }

    sprites[0].pos.y = (BYTE) sprites[0].pos.y + vel_y;

    // Ground Collision
    if(sprites[0].pos.y > GROUND) {
        grounded = TRUE;
        vel_y = 0;
        sprites[0].pos.y = GROUND;
    }

    RefreshScroll();
    UpdateSprites();

    p_time++;
}
