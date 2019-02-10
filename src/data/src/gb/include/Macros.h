#ifndef MACROS_H
#define MACROS_H

#define MIN(a,b) (((a)<(b))?(a):(b))
#define MAX(a,b) (((a)>(b))?(a):(b))

#define JOY(a) (joy & (a))
#define JOY_PRESSED(a) ((joy & (a)) && !(prev_joy & (a)))

#define ACTOR_BETWEEN_TILES(i) (((actors[(i)].pos.x & 7) != 0) || ((actors[(i)].pos.y & 7) != 0))
#define ACTOR_ON_TILE(i) (((actors[(i)].pos.x & 7) == 0) && ((actors[(i)].pos.y & 7) == 0))

#endif
