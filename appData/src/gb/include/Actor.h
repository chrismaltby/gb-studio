#ifndef ACTOR_H
#define ACTOR_H

#include <gb/gb.h>

#include "BankData.h"
#include "Math.h"
#include "Sprite.h"

#define ACTOR_BANK 1
#define MAX_ACTORS 31
#define MAX_ACTIVE_ACTORS 11

#define ACTOR_MOVE_ENABLED 0x80
#define ACTOR_NOCLIP 0x40

#define ACTOR_MIN_X 0
#define ACTOR_MIN_Y 8

#define NO_ACTOR_COLLISON 0xFF

#define player (actors[0])

#define ACTOR_ON_TILE_X(i) ((actors[(i)].pos.x & 7) == 0)
#define ACTOR_ON_TILE_Y(i) ((actors[(i)].pos.y & 7) == 0)
#define ACTOR_ON_TILE(i) ((ACTOR_ON_TILE_X(i)) && (ACTOR_ON_TILE_Y(i)))

typedef struct {
  Pos pos;  // 0
  UBYTE move_speed; // 4
  Vector2D dir; // 5
  UBYTE moving; // 7
  UBYTE sprite; // 8       // Offset into scene sprites image data
  UBYTE sprite_index; // 9  // Sprite pool index
  UBYTE palette_index; // 10
  Pos start_pos; // 11
  UBYTE frame; // 15
  UBYTE frames_len; // 16
  UBYTE animate; // 17
  UBYTE enabled; // 18
  UBYTE frame_offset; // 19
  UBYTE rerender; // 20
  UBYTE anim_speed; // 21
  UBYTE pinned; // 22
  UBYTE collisionsEnabled; // 23
  UBYTE collision_group; // 24
  SPRITE_TYPE sprite_type; // 25
  UBYTE hit_actor; // 26
  UBYTE script_control; // 27
  UWORD script_ptr; // 28
  BankPtr events_ptr; // 30
  BankPtr movement_ptr; // 33
  BankPtr hit_1_ptr; // 36
  BankPtr hit_2_ptr; // 39
  BankPtr hit_3_ptr; // 42  
  UBYTE movement_ctx; // 45
} Actor;

typedef enum {
  CHECK_DIR_LEFT = 1,
  CHECK_DIR_RIGHT,
  CHECK_DIR_UP,
  CHECK_DIR_DOWN,
} COL_CHECK_DIR;

extern Actor actors[MAX_ACTORS];
extern Actor* actor_ptrs[MAX_ACTORS];
extern UBYTE actors_active_delete[MAX_ACTIVE_ACTORS];
extern UBYTE actors_active_delete_count;
extern UBYTE actors_active[MAX_ACTIVE_ACTORS];
extern UBYTE actors_active_size;
extern Pos map_next_pos;
extern Vector2D map_next_dir;
extern UWORD map_next_sprite;
extern UBYTE actor_move_settings;
extern Pos actor_move_dest;
extern UBYTE player_iframes;

/**
 * Initialise actor pointers
 */
void ActorsInit();

/**
 * Initialise player actor ready for new scene
 */
void InitPlayer();

/**
 * Update all actors frames and their corresponding sprites
 * (defined in Actor_b.s)
 */
void UpdateActors();

/**
 * Activate the actor from actors array at index
 *
 * @param i index of actor
 */
void ActivateActor(UBYTE i);

/**
 * Deactivate currently active actor
 *
 * @param i index of actor in actors_active array
 */
void DeactivateActiveActor(UBYTE i);

/**
 * Return index of actor at given tile coordinates
 *
 * @param tx Left tile
 * @param ty Top tile
 * @return index of actor at tile in actors array
 */
UBYTE ActorAtTile(UBYTE tx, UBYTE ty, UBYTE inc_noclip);

/**
 * Return index of actor at given tile coordinates (check 1 tile wide, 3 tiles high)
 *
 * @param tx Left tile
 * @param ty Top tile
 * @return index of actor at tile in actors array
 */
UBYTE ActorAt1x3Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip);

/**
 * Return index of actor at given tile coordinates (check 3 tiles wide, 1 tile high)
 *
 * @param tx Left tile
 * @param ty Top tile
 * @return index of actor at tile in actors array
 */
UBYTE ActorAt3x1Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip);

/**
 * Return index of actor at given tile coordinates (check 3 tiles wide, 3 tile high)
 *
 * @param tx Left tile
 * @param ty Top tile
 * @return index of actor at tile in actors array
 */
UBYTE ActorAt3x3Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip);

/**
 * Return index of actor at given tile coordinates (check 2 tiles wide, 3 tile high)
 *
 * @param tx Left tile
 * @param ty Top tile
 * @return index of actor at tile in actors array
 */
UBYTE ActorAt2x3Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip);

/**
 * Return index of actor at given tile coordinates (check 1 tile wide, 2 tiles high)
 *
 * @param tx Left tile
 * @param ty Top tile
 * @return index of actor at tile in actors array
 */
UBYTE ActorAt1x2Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip);

/**
 * Return index of actor currently overlapping player
 *
 * @return index of overlapping actor in actors array
 */
UBYTE ActorOverlapsPlayer(UBYTE inc_noclip);

/**
 * Return index of actor currently in front of player
 *
 * @param grid_size 8 or 16px grid size
 * @return index of overlapping actor in actors array
 */
UBYTE ActorInFrontOfPlayer(UBYTE grid_size, UBYTE inc_noclip);

/**
 * Return index of actor in front of given actor relative to the actor's current direction
 *
 * @param i index of actor in actors array
 * @return index of in front actor in actors array
 */
UBYTE ActorInFrontOfActor(UBYTE i);

/**
 * Activate the actor from actors array at given index
 *
 * @param i index of actor in actors array
 */
void ActivateActor(UBYTE i);

/**
 * Deactivate the actor from actors array at given index
 *
 * @param i index of actor in actors array
 */
void DeactivateActor(UBYTE i);

/**
 * Deactivate the actor from active actors array at given index
 *
 * @param i index of actor in active actors array
 */
void DeactivateActiveActor(UBYTE i);

/**
 * Check for tile or actor collisions in specified direction from a starting tile
 * 
 * @param start_x Left tile
 * @param start_y Top tile
 * @param end_tile Destination x or y tile depending on check direction
 * @param check_dir One of CHECK_DIR_LEFT/CHECK_DIR_RIGHT/CHECK_DIR_UP/CHECK_DIR_DOWN
 */
UBYTE CheckCollisionInDirection(UBYTE start_x, UBYTE start_y, UBYTE end_tile, COL_CHECK_DIR check_dir);

/**
 * Run the script for the selected actor on the main script context
 *
 * @param i index of actor in actors array
 */
void ActorRunScript(UBYTE i);

/**
 * Check if player has collided with any actors since last call and if so
 * start all relevant collision scripts
 */
void ActorRunCollisionScripts();

#endif
