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
#include "GameTime.h"

void Start_TopDown()
{
    scroll_target = &actors[0].pos;
    game_time = 0;
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

        if (INPUT_LEFT)
        {
            UBYTE tile_left = tile_x - 1;
            if (!TileAt(tile_left, tile_y) && !ActorOverlapsActorTile(tile_left, tile_y)) {
                actors[0].vel.x -= 1;
            }
        }
        else if (INPUT_RIGHT)
        {
            UBYTE tile_right = tile_x + 1;
            if (!TileAt(tile_right + 1, tile_y) && !ActorOverlapsActorTile(tile_right, tile_y)) {
                actors[0].vel.x += 1;
            }
        }
        else {
            if (INPUT_UP)
            {
                UBYTE tile_up = tile_y - 1;
                if (!TileAt(tile_x, tile_up) && !TileAt(tile_x + 1, tile_up) && !ActorOverlapsActorTile(tile_x, tile_up)) {
                    actors[0].vel.y -= 1;
                }
            }
            else if (INPUT_DOWN)
            {
                UBYTE tile_down = tile_y + 1;
                if (!TileAt(tile_x, tile_down) && !TileAt(tile_x + 1, tile_down) && !ActorOverlapsActorTile(tile_x, tile_down)) {
                    actors[0].vel.y += 1;
                }
            }
        }
    }

    if(INPUT_START_PRESSED) {
        actors[0].pos.x = 32;
        actors[0].pos.y = 32;
    }
}
