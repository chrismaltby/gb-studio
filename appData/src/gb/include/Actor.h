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
#define CHECK_DIR_LEFT 1
#define CHECK_DIR_RIGHT 2
#define CHECK_DIR_UP 3
#define CHECK_DIR_DOWN 4

#define player (actors[0])

#define ActorInFrontOfPlayer() (ActorInFrontOfActor(0))

#define ActorOnTileX(i) ((actors[(i)].pos.x & 7) == 0)
#define ActorOnTileY(i) (((actors[(i)].pos.y & 7) == 0))
#define ActorOnTile(i) ((ActorOnTileX(i)) && (ActorOnTileY(i)))
#define ActorBetweenTiles(i) (((actors[(i)].pos.x & 7) != 0) || ((actors[(i)].pos.y & 7) != 0))
#define PlayerOnTile() (ActorOnTile(0))
#define PlayerOnTileX() (ActorOnTileX(0))
#define PlayerOnTileY() (ActorOnTileY(0))
#define PlayerBetweenTiles() (ActorBetweenTiles(0))

#define ActorOnTileX16(i) ((actors[(i)].pos.x & 15) == 0)
#define ActorOnTileY16(i) (((actors[(i)].pos.y & 15) == 0))
#define ActorOnTile16(i) ((ActorOnTileX16(i)) && (ActorOnTileY16(i)))
#define ActorBetweenTiles16(i) (((actors[(i)].pos.x & 15) != 0) || ((actors[(i)].pos.y & 15) != 0))
#define PlayerOnTile16() (ActorOnTile16(0))
#define PlayerBetweenTiles16() (ActorBetweenTiles16(0))

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

void ActorsInit();

/**
 * Move all actors positions based on their current velocities
 */
void MoveActors();

/**
 * Update all actors frames and their corresponding sprites
 */
void UpdateActors();

/**
 * Activate the actor from actors array at index
 *
 * @param i index of actor
 */
void ActivateActor(UBYTE i);

/**
 * Activate all actors within the column [tx, ty] to [tx, ty + 20]
 *
 * @param tx Left tile
 * @param ty Top tile
 */
void ActivateActorColumn(UBYTE tx, UBYTE ty);

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

UBYTE ActorAt1x3Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip);
UBYTE ActorAt3x1Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip);
UBYTE ActorAt1x2Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip);
UBYTE ActorOverlapsPlayer(UBYTE inc_noclip);

/**
 * Return index of actor that would overlap an actor at the given tile coordinates
 *
 * @param tx Left tile
 * @param ty Top tile
 * @return index of actor at tile in actors array
 */
UBYTE ActorOverlapsActorTile(UBYTE tx_a, UBYTE ty_a, UBYTE inc_noclip);

/**
 * Return index of actor overlapping player
 *
 * @return index of overlapping actor in actors array
 */
UBYTE ActorOverlapsPlayer(UBYTE inc_noclip);

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

UBYTE CheckCollisionInDirection(UBYTE start_x, UBYTE start_y, UBYTE end_tile, UBYTE check_dir);

void ActorsUnstick();

void InitPlayer();

void ActorRunScript(UBYTE i);

void ActorRunCollisionScripts();

#endif
