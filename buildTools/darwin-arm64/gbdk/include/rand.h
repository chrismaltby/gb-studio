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

    One way to do this is sampling (@ref DIV_REG) up to 2 times (high byte of
    seed value then the low byte) at variable, non-deterministic points in time
    (such as when the player presses buttons on the title screen or in a menu).

    It only needs to be called once to be initialized.

    @see rand(), randw()
*/
#if defined(__PORT_sm83) || defined(__PORT_mos6502)
void initrand(uint16_t seed) OLDCALL;
#elif defined(__PORT_z80)
void initrand(uint16_t seed) Z88DK_FASTCALL;
#endif

#define RAND_MAX 255
#define RANDW_MAX 65535

/** The random number seed is stored in __rand_seed and can be
    saved and restored if needed.

    \code{.c}
    // Save
    some_uint16 = __rand_seed;
    ...
    // Restore
    __rand_seed = some_uint16;
    \endcode
*/
extern uint16_t __rand_seed;

/** Returns a random byte (8 bit) value.

    @ref initrand() should be used to initialize the random number generator before using rand()
 */
uint8_t rand(void) OLDCALL;

/** Returns a random word (16 bit) value.

    @ref initrand() should be used to initialize the random number generator before using rand()
 */
uint16_t randw(void) OLDCALL;

/** Random generator using the linear lagged additive method

    @param seed    The value for initializing the random number generator.

    Note: initarand() calls @ref initrand() with the same seed value, and
    uses @ref rand() to initialize the random generator.

    @see initrand() for suggestions about seed values, arand()
*/
#if defined(__PORT_sm83) || defined(__PORT_mos6502)
void initarand(uint16_t seed) OLDCALL;
#elif defined(__PORT_z80)
void initarand(uint16_t seed) Z88DK_FASTCALL;
#endif

/** Returns a random number generated with the linear lagged additive method.

    @ref initarand() should be used to initialize the random number generator before using arand()
 */
uint8_t arand(void) OLDCALL;

#endif
