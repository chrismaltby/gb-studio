#ifndef MACROS_H
#define MACROS_H

#define LOG(fmt, args...)

#define UNUSED(x) (void)(x)

#define MIN(a, b) (((a) < (b)) ? (a) : (b))
#define MAX(a, b) (((a) > (b)) ? (a) : (b))

#define JOY(a) (joy & (a))
#define JOY_PRESSED(a) ((joy & (a)) && !(prev_joy & (a)))
#define JOY_CHANGED (joy != prev_joy)

#define ACTOR_BETWEEN_TILES(i) (((actors[(i)].pos.x & 7) != 0) || ((actors[(i)].pos.y & 7) != 0))
#define ACTOR_ON_TILE_X(i) ((actors[(i)].pos.x & 7) == 0)
#define ACTOR_ON_TILE_Y(i) (((actors[(i)].pos.y & 7) == 0) || (actors[(i)].pos.y == 254))
#define ACTOR_ON_TILE(i) ((ACTOR_ON_TILE_X(i)) && (ACTOR_ON_TILE_Y(i)))

#define IS_FRAME_128 ((time & 0x7F) == 0)
#define IS_FRAME_64 ((time & 0x3F) == 0)
#define IS_FRAME_32 ((time & 0x1F) == 0)
#define IS_FRAME_16 ((time & 0xF) == 0)
#define IS_FRAME_8 ((time & 0x7) == 0)
#define IS_FRAME_9 ((time & 0x7) == 1)
#define IS_FRAME_4 ((time & 0x3) == 0)
#define IS_FRAME_2 ((time & 0x1) == 0)

#define MOD_2(a) ((a)&1)
#define MOD_4(a) ((a)&3)
#define MOD_8(a) ((a)&7)
#define MOD_32(a) ((a)&31)

#define MUL_16(a) ((a) << 4)
#define MUL_8(a) ((a) << 3)
#define MUL_4(a) ((a) << 2)
#define MUL_2(a) ((a) << 1)

#define DIV_16(a) ((a) >> 4)
#define DIV_8(a) ((a) >> 3)
#define DIV_4(a) ((a) >> 2)
#define DIV_2(a) ((a) >> 1)

#define LT_8(a) (((a) >> 3) == 0)

#define ACTOR_SPRITE(ptr) (*(ptr))
#define ACTOR_X(ptr) (*((ptr) + 1))
#define ACTOR_Y(ptr) (*((ptr) + 2))
#define ACTOR_DX(ptr) (*((ptr) + 3))
#define ACTOR_DY(ptr) (*((ptr) + 4))
#define ACTOR_REDRAW(ptr) (*((ptr) + 5))
#define ACTOR_FRAME(ptr) (*((ptr) + 6))
#define ACTOR_FRAMES_LEN(ptr) (*((ptr) + 7))
#define ACTOR_ANIMATE(ptr) (*((ptr) + 8))
#define ACTOR_ENABLED(ptr) (*((ptr) + 9))
#define ACTOR_FLIP(ptr) (*((ptr) + 10))
#define ACTOR_FRAME_OFFSET(ptr) (*((ptr) + 11))
#define ACTOR_MOVING(ptr) (*((ptr) + 12))
#define ACTOR_MOVE_SPEED(ptr) (*((ptr) + 13))
#define ACTOR_ANIM_SPEED(ptr) (*((ptr) + 14))
#define ACTOR_COLLISIONS_ENABLED(ptr) (*((ptr) + 15))

#define IS_NEG(a) ((UBYTE)(a)&0x80)

#define hide_sprite(a) (move_sprite((a), 0, 0))
#define hide_sprite_pair(a) \
  move_sprite((a), 0, 0);   \
  move_sprite((a) + 1, 0, 0)
#define set_sprite_tile_pair(a, t1, t2) \
  set_sprite_tile((a), (t1));           \
  set_sprite_tile((a) + 1, (t2))
#define set_sprite_prop_pair(a, prop) \
  set_sprite_prop((a), (prop));       \
  set_sprite_prop((a) + 1, (prop))
#define move_sprite_pair(a, x, y) \
  move_sprite((a), (x), (y));     \
  move_sprite((a) + 1, (x) + 8, (y))

#endif
