#ifndef MACROS_H
#define MACROS_H

#define MIN(a,b) (((a)<(b))?(a):(b))
#define MAX(a,b) (((a)>(b))?(a):(b))

#define JOY(a) (joy & (a))
#define JOY_PRESSED(a) ((joy & (a)) && !(prev_joy & (a)))

#define ACTOR_BETWEEN_TILES(i) (((actors[(i)].pos.x & 7) != 0) || ((actors[(i)].pos.y & 7) != 0))
#define ACTOR_ON_TILE(i) (((actors[(i)].pos.x & 7) == 0) && ((actors[(i)].pos.y & 7) == 0))

#define MOD_2(a)    ((a)&1)
#define MOD_4(a)    ((a)&3)
#define MOD_8(a)    ((a)&7)
#define MOD_32(a)   ((a)&31)

#define MUL_16(a)   ((a)<<4)
#define MUL_8(a)    ((a)<<3)
#define MUL_4(a)    ((a)<<2)
#define MUL_2(a)    ((a)<<1)

#define DIV_16(a)   ((a)>>4)
#define DIV_8(a)    ((a)>>3)
#define DIV_4(a)    ((a)>>2)
#define DIV_2(a)    ((a)>>1)

#define hide_sprite(a)    (move_sprite((a), 0, 0))

#endif
