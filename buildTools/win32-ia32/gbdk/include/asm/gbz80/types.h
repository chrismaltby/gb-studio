/** @file asm/gbz80/types.h
    @anchor file_asm_gbz80_types_h
    Types definitions for the gb.
*/
#ifndef ASM_GBZ80_TYPES_INCLUDE
#define ASM_GBZ80_TYPES_INCLUDE

#if SDCC_PORT!=gbz80
#error gbz80 only.
#endif

#define NONBANKED		__nonbanked
#define BANKED			__banked
#define CRITICAL		__critical
#define INTERRUPT		__interrupt

/** Signed eight bit.
 */
typedef signed char     INT8;
/** Unsigned eight bit.
 */
typedef unsigned char 	UINT8;
/** Signed sixteen bit.
 */
typedef signed int      INT16;
/** Unsigned sixteen bit.
 */
typedef unsigned int  	UINT16;
/** Signed 32 bit.
 */
typedef signed long     INT32;
/** Unsigned 32 bit.
 */
typedef unsigned long 	UINT32;

#ifndef __SIZE_T_DEFINED
#define __SIZE_T_DEFINED
typedef int	      	size_t;
#endif

/** Returned from clock
    @see clock
*/
typedef UINT16		clock_t;

#endif
