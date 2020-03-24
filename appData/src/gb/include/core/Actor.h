#ifndef ACTOR_H
#define ACTOR_H

#include <gb/gb.h>
#include <gbdkjs.h>

#include "BankData.h"
#include "Math.h"

#define ACTOR_BANK 1
#define MAX_ACTORS 31
#define MAX_ACTIVE_ACTORS 11
#define ACTOR_MOVE_ENABLED 0x80
#define ACTOR_NOCLIP 0x40

#define ACTOR_BETWEEN_TILES(i) (((actors[(i)].pos.x & 7) != 0) || ((actors[(i)].pos.y & 7) != 0))
#define ACTOR_ON_TILE_X(i) ((actors[(i)].pos.x & 7) == 0)
#define ACTOR_ON_TILE_Y(i) (((actors[(i)].pos.y & 7) == 0) || (actors[(i)].pos.y == 254))
#define ACTOR_ON_TILE(i) ((ACTOR_ON_TILE_X(i)) && (ACTOR_ON_TILE_Y(i)))
#define player (actors[0])

typedef enum {
  NONE = 1,
  PLAYER_INPUT,
  AI_RANDOM_FACE,
  AI_INTERACT_FACE,
  AI_RANDOM_WALK,
  AI_ROTATE_TRB
} MOVEMENT_TYPE;

typedef enum { SPRITE_STATIC = 0, SPRITE_ACTOR, SPRITE_ACTOR_ANIMATED } SPRITE_TYPE;

typedef struct {
  UBYTE sprite;
  UBYTE sprite_index;
  Pos pos;
  Vector2D vel;
  Vector2D dir;
  UBYTE redraw;
  UBYTE frame;
  UBYTE frames_len;
  UBYTE animate;
  UBYTE enabled;
  UBYTE flip;
  UBYTE frame_offset;
  UBYTE rerender;
  UBYTE moving;
  BYTE move_speed;
  UBYTE anim_speed;
  UBYTE collisionsEnabled;
  SPRITE_TYPE sprite_type;
  UWORD script_ptr;
  BankPtr events_ptr;
  MOVEMENT_TYPE movement_type;
} Actor;

extern Actor actors[MAX_ACTORS];
extern UBYTE actors_active[MAX_ACTIVE_ACTORS];
extern UBYTE actors_active_size;
extern Pos map_next_pos;
extern Vector2D map_next_dir;
extern UBYTE map_next_sprite;
extern UBYTE actor_move_settings;
extern Pos actor_move_dest;

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
UBYTE ActorAtTile(UBYTE tx, UBYTE ty);

/**
 * Return index of actor that would overlap an actor at the given tile coordinates
 *
 * @param tx Left tile
 * @param ty Top tile
 * @return index of actor at tile in actors array
 */
UBYTE ActorOverlapsActorTile(UBYTE tx_a, UBYTE ty_a);

/**
 * Return index of actor overlapping player
 *
 * @return index of overlapping actor in actors array
 */
UBYTE ActorOverlapsPlayer();

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

#endif
