#ifndef MACROS_H
#define MACROS_H

#define MIN(a,b) (((a)<(b))?(a):(b))
#define MAX(a,b) (((a)>(b))?(a):(b))

#define JOY(a) (joy & (a))
#define JOY_PRESSED(a) ((joy & (a)) && !(prev_joy & (a)))
#endif
