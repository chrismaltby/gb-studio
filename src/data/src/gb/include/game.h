#ifndef GAME_H
#define GAME_H

#include <gbdkjs.h>
#include <gb/gb.h>
#include <stdio.h>
#include <stdarg.h>
#include <string.h>
#include "BankManager.h"
#include "banks.h"
#include "script_cmds.h"
#include "data_ptrs.h"

#define MAX_ACTORS 9
#define MAX_TRIGGERS 8

#define SCREEN_WIDTH 160
#define SCREEN_HEIGHT 144
#define SCREEN_WIDTH_HALF 80
#define SCREEN_HEIGHT_HALF 72
#define MENU_OPEN_Y 112
#define MENU_CLOSED_Y (MAXWNDPOSY + 1)

#define CAMERA_SPEED_MASK 0xF
#define CAMERA_SPEED_1 0x0F
#define CAMERA_SPEED_2 0x07
#define CAMERA_SPEED_3 0x03
#define CAMERA_SPEED_4 0x01
#define CAMERA_SPEED_5 0x00
#define CAMERA_LOCK_FLAG 0x10
#define CAMERA_TRANSITION_FLAG 0x20

#define ACTOR_MOVE_ENABLED 0x80

#define FADE_SPEED_MASK 0x3F
#define FADE_IN_FLAG 0x40
#define FADE_ENABLED_FLAG 0x80

#define IS_FRAME_16 ((time & 0xF)==0)
#define IS_FRAME_8 ((time & 0x7)==0)
#define IS_FRAME_4 ((time & 0x3)==0)
#define IS_FRAME_2 ((time & 0x1)==0)

#define ACTOR_BETWEEN_TILES(i) (((actors[(i)].pos.x & 7) != 0) || ((actors[(i)].pos.y & 7) != 0))
#define ACTOR_ON_TILE(i) (((actors[(i)].pos.x & 7) == 0) && ((actors[(i)].pos.y & 7) == 0))

#define MOD_2(a)    ((a)&1)
#define MOD_4(a)    ((a)&3)
#define MOD_8(a)    ((a)&7)
#define MOD_32(a)   ((a)&31)
#define MUL_8(a)    ((a)<<3)

typedef enum {
  TITLE = 1,
  LOGO,
  MAP,
  BATTLE,
  CUTSCENE,
  PONG
} STAGE_TYPE;

typedef enum {
  NONE = 1,
  PLAYER_INPUT,
  AI_RANDOM_FACE,
  AI_INTERACT_FACE,
  AI_RANDOM_WALK,
} MOVEMENT_TYPE;

typedef struct _POS {
  UBYTE x;
  UBYTE y;
} POS;

typedef struct _SIZE {
  UBYTE w;
  UBYTE h;
} SIZE;

typedef struct _VEC2D {
  BYTE x;
  BYTE y;
} VEC2D;

typedef struct _ACTORSPRITE {
  UBYTE sprite;
  POS pos;
  VEC2D dir;
  UBYTE redraw;
  UBYTE enabled;
  UBYTE moving;
  UBYTE animated;
  UWORD script_ptr;
  BANK_PTR events_ptr;
  MOVEMENT_TYPE movement_type;

} ACTOR;

typedef struct _TRIGGER {
  POS pos;
  UBYTE w;
  UBYTE h;
  UWORD script_ptr;
} TRIGGER;

void game_loop();
void game_over();
void init_sprites();

void shoot();

void update_sprites();
void update_bullets();
void update_enemies();
void spawn_enemy();

void hide_sprite(UBYTE i);

UBYTE is_collision(POS *a, POS *b, UBYTE size);

void position_player();
void position_enemies();
void position_bullets();

void handle_input();
void update_actors();
void move_actors();

void position_camera();
void position_actors();

void handle_wait();
void reposition_camera();
UBYTE npc_at(UBYTE actor_i, UBYTE tx_a, UBYTE ty_a);
UBYTE trigger_at(UBYTE tx_a, UBYTE ty_a);
void draw_ui_frame(UBYTE x, UBYTE y, UBYTE width, UBYTE height);
void update_window();
void set_text_line(UWORD line);
void draw_text(UBYTE force);
void run_script();
void update_actor_movement(UBYTE i);
void load_map();
UBYTE ScriptLastFnComplete();

typedef void (*SCRIPT_CMD_FN) ();

// Globals
extern ACTOR actors[MAX_ACTORS];
extern TRIGGER triggers[MAX_TRIGGERS];
extern UWORD script_ptr;
extern UWORD script_last_ptr;
extern UBYTE script_arg1;
extern UBYTE script_arg2;
extern UBYTE script_arg3;
extern UBYTE script_arg4;
extern UBYTE script_arg5;
extern UBYTE script_continue;
extern UBYTE script_action_complete;
extern UBYTE script_actor;
extern POS camera_dest;
extern UBYTE camera_settings;
extern UBYTE wait_time;
extern UBYTE shake_time;
extern UBYTE fade_settings;
extern UBYTE fade_timer;
extern UBYTE actor_move_settings;
extern POS actor_move_dest;
extern SCRIPT_CMD_FN last_fn;
extern UBYTE time;
extern VEC2D update_actor_dir;
extern UBYTE first_frame_on_tile;
extern UBYTE menu_y;
extern UBYTE menu_dest_y;
extern UBYTE frame_offset;
extern UBYTE joy;
extern UBYTE prev_joy;
extern UBYTE text_drawn;
extern STAGE_TYPE stage_type;
extern STAGE_TYPE stage_next_type;

// ----

extern const unsigned char global_tileset[];
extern const unsigned char village_sprites[];
extern const unsigned char *map_sprites[];
extern const unsigned char map_sprites_len[];

extern const unsigned char btl_monster[];
extern const unsigned char btl_cursor[];
extern const unsigned char btl_menu_cursor[];
extern const unsigned char btl_player1[];
extern const unsigned char btl_player2[];
extern const unsigned char btl_tiles[];
extern const unsigned char btl_bg[];
extern const unsigned char btl_stage[];
extern const unsigned char btl_black[];

// ----

extern UBYTE map_width;
extern UBYTE map_height;
extern UWORD map_index;
extern UBYTE map_actor_num;
extern UBYTE map_trigger_num;
extern const unsigned char *map;
extern const unsigned char *map_col;

extern const unsigned char emotion_sprites[];

#endif
