/** @file time.h
    Sort of ANSI compliant time functions.
*/
#ifndef TIME_INCLUDE
#define TIME_INCLUDE

#include <types.h>
#include <stdint.h>

#define CLOCKS_PER_SEC 60

typedef uint16_t time_t;

/** Returns an approximation of processor time used by the program in Clocks

    The value returned is the CPU time (ticks) used so far as a @ref clock_t.

    To get the number of seconds used, divide by @ref CLOCKS_PER_SEC.

    This is based on @ref sys_time, which will wrap around every ~18 minutes.
    (unsigned 16 bits = 65535 / 60 / 60 = 18.2)

    @see sys_time, time()
*/
clock_t clock() OLDCALL;

/** Converts clock() time to Seconds

    @param t If pointer __t__ is not NULL, it's value will be set to the same seconds calculation as returned by the function.

    The calculation is clock() / CLOCKS_PER_SEC

    Returns: time in seconds
    @see sys_time, clock()
*/
time_t time(time_t *t);

#endif
