/** @file time.h
    Sort of ANSI compliant time functions.
*/
#ifndef TIME_INCLUDE
#define TIME_INCLUDE

#include <types.h>

#if SDCC_PLAT==consolez80
#define CLOCKS_PER_SEC		100
#else
/** For now... */
#error
#define CLOCKS_PER_SEC		50
#endif

typedef UINT16	time_t;

/** The clock() function returns an approximation of processor time
    used by the program.  The value returned is the CPU time used so far
    as a clock_t; to get the number of seconds used, divide by
    CLOCKS_PER_SEC.
*/
clock_t clock(void) NONBANKED;

time_t time(time_t *t);

#endif
