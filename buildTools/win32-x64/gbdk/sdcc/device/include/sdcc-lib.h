/** Top level header file for the sdcc libraries that enables target
    specific features.
*/
#ifndef __SDC51_SDCC_LIB_H
#define __SDC51_SDCC_LIB_H	1

#if defined(__z80)
#include <asm/z80/features.h>

#elif defined(__gbz80)
#include <asm/gbz80/features.h>

#else
/* PENDING */
#include <asm/default/features.h>

#endif

#endif
