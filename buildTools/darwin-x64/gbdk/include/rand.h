/** @file rand.h
    Random generator using the linear congruential method

    @author	Luc Van den Borre
*/
#ifndef RAND_INCLUDE
#define RAND_INCLUDE

#include <types.h>
#include <stdint.h>

/** Initalise the pseudo-random number generator.

    @param seed    The value for initializing the random number generator.

    The seed should be different each time, otherwise the same pseudo-random
    sequence will be generated.

    The DIV Register (@ref DIV_REG) is sometimes used as a seed,
    particularly if read at some variable point in time (such
    as when the player presses a button).

    Only needs to be called once to initialize, buy may be called
    again to re-initialize with the same or a different seed.
    @see rand(), randw()
*/
#if defined(__PORT_gbz80)
void initrand(uint16_t seed) OLDCALL;
#elif defined(__PORT_z80)
void initrand(uint16_t seed) Z88DK_FASTCALL;
#endif

#define RAND_MAX 255
#define RANDW_MAX 65535

/** Returns a random byte (8 bit) value.

    @ref initrand() should be used to initialize the random number generator before using rand()
 */
uint8_t rand() OLDCALL;

/** Returns a random word (16 bit) value.

    @ref initrand() should be used to initialize the random number generator before using rand()
 */
uint16_t randw() OLDCALL;

/** Random generator using the linear lagged additive method

    @param seed    The value for initializing the random number generator.

    Note: initarand() calls @ref initrand() with the same seed value, and
    uses @ref rand() to initialize the random generator.

    @see initrand() for suggestions about seed values, arand()
*/
#if defined(__PORT_gbz80)
void initarand(uint16_t seed) OLDCALL;
#elif defined(__PORT_z80)
void initarand(uint16_t seed) Z88DK_FASTCALL;
#endif

/** Returns a random number generated with the linear lagged additive method.

    @ref initarand() should be used to initialize the random number generator before using arand()
 */
uint8_t arand() OLDCALL;

#endif
