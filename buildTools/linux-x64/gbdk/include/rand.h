/** @file rand.h
    Random generator using the linear congruential method

    @author	Luc Van den Borre
*/
#ifndef RAND_INCLUDE
#define RAND_INCLUDE

#include <types.h>

/** Initalise the random number generator.
    seed needs to be different each time, else the same sequence will be 
    generated.  A good source is the DIV register.
*/
void
initrand(UINT16 seed) NONBANKED; /* Non-banked as called from asm in arand.s */

/** Returns a random value.
 */
INT8
rand(void);

/** Returns a random word.
 */
UINT16
randw(void);

/** Random generator using the linear lagged additive method
    Note that 'initarand()' calls 'initrand()' with the same seed value, and
    uses 'rand()' to initialize the random generator.

    @author	Luc Van den Borre
*/
void
initarand(UINT16 seed);

/** Generates a random number using the linear lagged additive method.
 */
INT8
arand(void);

#endif
