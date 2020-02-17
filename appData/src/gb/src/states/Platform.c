#pragma bank=18

#include "Platform.h"
#include "Scroll.h"
#include "DataManager.h"
#include "BankManager.h"
#include "Sprite.h"
#include "Data.h"
#include "Core_Main.h"
#include "Input.h"
#include "GameTime.h"
#include "Actor.h"
#include "Math.h"
#include "Collision.h"
#include "ScriptRunner.h"

#define MIN_WALK_VEL 0x130
#define WALK_ACC 0x98
#define RUN_ACC 0xe4
#define RELEASE_DEC 0xd0
#define SKID_DEC 0x1a0
#define MAX_WALK_VEL 0x1900
#define MAX_RUN_VEL 0x2900
#define SKID_TURN_VEL 0x900
#define JUMP_MOMENTUM 0x98
#define JUMP_VEL 0x4000
#define HOLD_GRAV 0x200
#define GRAV 0x700
#define MAX_FALL_VEL 0x4E20
#define PLATFORM_CAMERA_OFFSET_Y 48

UBYTE grounded = FALSE;
UBYTE GROUND = 136;
WORD vel_x = 0;
WORD vel_y = 0;
WORD pos_x = 16512;
WORD pos_y = 1024;
Pos cam_pos = {0, 0};
UINT16 pos_y_delayed = 1024;
UINT16 platform_y = 1024;

void Start_Platform()
{
    LOG("START PLATFORM\n");
    // p_time = 0;
    cam_pos.x = player.pos.x;
    cam_pos.y = player.pos.y - PLATFORM_CAMERA_OFFSET_Y;
    pos_y_delayed = player.pos.y;
    platform_y = player.pos.y;
    // cam_pos_offset.x = cam_pos.x;
    // cam_pos_offset.y = cam_pos.y - PLATFORM_CAMERA_OFFSET_Y;

    scroll_target = &cam_pos;
    game_time = 0;
    LOG("END START PLATFORM\n");
}

void Update_Platform()
{
    WORD tile_x, tile_y;
    UBYTE camera_y, player_y, i, a;
    UINT16 tmp_y;
    UBYTE hit_actor = 0;

    // Move NPCs
    for (i = 1; i < actors_active_size; i++)
    {
        a = actors_active[i];    
        switch (actors[a].movement_type)
        {
            case 0:
                actors[a].pos.x -= actors[a].move_speed;
                break;
            case 1:
                actors[a].pos.y--;
        }
    }

    // Move
    if (INPUT_LEFT)
    {
        player.dir.x = -1;
        if (INPUT_A)
        {
            vel_x -= RUN_ACC;
            vel_x = CLAMP(vel_x, -MAX_RUN_VEL, -MIN_WALK_VEL);
        }
        else
        {
            vel_x -= WALK_ACC;
            vel_x = CLAMP(vel_x, -MAX_WALK_VEL, -MIN_WALK_VEL);
        }
    }
    else if (INPUT_RIGHT)
    {
        player.dir.x = 1;
        if (INPUT_A)
        {
            vel_x += RUN_ACC;
            vel_x = CLAMP(vel_x, MIN_WALK_VEL, MAX_RUN_VEL);
        }
        else
        {
            vel_x += WALK_ACC;
            vel_x = CLAMP(vel_x, MIN_WALK_VEL, MAX_WALK_VEL);
        }
    }
    else if (grounded)
    {
        if (vel_x < 0)
        {
            vel_x += RELEASE_DEC;
            if (vel_x > 0)
            {
                vel_x = 0;
            }
        }
        else if (vel_x > 0)
        {
            vel_x -= RELEASE_DEC;
            if (vel_x < 0)
            {
                vel_x = 0;
            }
        }
    }

    pos_x += vel_x >> 8;
    tile_x = pos_x >> 7;
    tile_y = pos_y >> 7;

    if(grounded && INPUT_A_PRESSED) {
        if(player.dir.x == 1) {
            hit_actor = ActorAtTile(tile_x + 2, tile_y);
        } else {
            hit_actor = ActorAtTile(tile_x - 1, tile_y);
        }
        if (hit_actor)
        {
            ScriptStart(&actors[hit_actor].events_ptr);
        }
    }

    // Jump
    if (INPUT_B_PRESSED && grounded)
    {
        vel_y = -JUMP_VEL;
        grounded = FALSE;
    }

    // Gravity
    if (INPUT_B && vel_y < 0)
    {
        vel_y += HOLD_GRAV;
    }
    else
    {
        vel_y += GRAV;
    }

    vel_y = MIN(vel_y, MAX_FALL_VEL);
    pos_y += vel_y >> 8;
    tile_y = pos_y >> 7;

    // Left Collision
    if (vel_x < 0)
    {
        if (TileAt(tile_x, tile_y) || TileAt(tile_x, tile_y - 1))
        {
            vel_x = 0;
            pos_x = ((tile_x + 1) * 8) << 4;
            tile_x = pos_x >> 7;
        }
    }

    // Right Collision
    if (vel_x > 0)
    {
        if (TileAt(tile_x + 1, tile_y) || TileAt(tile_x + 1, tile_y - 1))
        {
            vel_x = 0;
            pos_x = (tile_x * 8) << 4;
            tile_x = pos_x >> 7;
        }
    }

    // Ground Collision
    if (
        vel_y >= 0 &&
        (TileAt(tile_x, tile_y + 1) ||                                  // Left Edge
         (((pos_x >> 4) & 0x7) != 0 && TileAt(tile_x + 1, tile_y + 1))) // Right edge
    )
    {
        grounded = TRUE;
        vel_y = 0;
        pos_y = (tile_y * 8) << 4;
    }
    else
    {
        grounded = FALSE;

        // Ceiling Collision
        if (vel_y < 0)
        {
            if (
                TileAt(tile_x, tile_y - 2) ||                                 // Left Edge
                (((pos_x >> 4) & 0x7) != 0 && TileAt(tile_x + 1, tile_y - 2)) // Right edge
            )
            {
                vel_y = 0;
                pos_y = ((tile_y * 8) << 4);
            }
        }
    }

    LOG_VALUE("pos_y", pos_y);
    // LOG("pos_y=%d pos_y>>4=%d vel_y=%d\n", pos_y, pos_y >> 4, vel_y);
    // LOG("pos_x=%d pos_x>>4=%d vel_x=%d tile_x=%u\n", pos_x, pos_x >> 4, vel_x, tile_x);
    // LOG("pos_x=%d pos_x>>4=%d vel_x=%d tile_x=%u\n", pos_x, pos_x >> 4, vel_x, tile_x);

    player.pos.x = (pos_x >> 4) - 4u;
    player.pos.y = pos_y >> 4;
    player.animate = grounded && vel_x != 0;

    tmp_y = player.pos.y;
    if (grounded || (platform_y != player.pos.y && platform_y < player.pos.y))
    {
        platform_y = player.pos.y;
    }

    LOG_VALUE("platform_y", platform_y);

    /*
    // Actor Collision
    hit_actor = ActorOverlapsPlayer();

    // LOG_VALUE("hit_actor", hit_actor);
    if (hit_actor)
    {
        // LOG("A HIT ACTOR %u\n", hit_actor);
        vel_y = -JUMP_VEL;
        // ScriptStart(&actors[hit_actor].events_ptr);
    }
    */

    // Handle Camera Position
    cam_pos.x = player.pos.x;
    if (pos_y_delayed < platform_y)
    {
        pos_y_delayed = platform_y;
    }
    else if (pos_y_delayed > platform_y)
    {
        pos_y_delayed--;
    }
    else
    {
        pos_y_delayed = platform_y;
    }
    cam_pos.y = pos_y_delayed - PLATFORM_CAMERA_OFFSET_Y;

    LOG_VALUE("pos_y_delayed", pos_y_delayed);
    LOG_VALUE("cam_pos.y", cam_pos.y);

    if (INPUT_SELECT_PRESSED)
    {
        pos_x = 32;
        pos_y = 32;
    }

    if (INPUT_START_PRESSED)
    {
        pos_x = 0x421B;
        pos_y = 32;
    }
}
