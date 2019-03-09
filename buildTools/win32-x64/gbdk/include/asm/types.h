/** @file asm/types.h
    Shared types definitions.
*/
#ifndef ASM_TYPES_INCLUDE
#define ASM_TYPES_INCLUDE

#if SDCC_PORT == gbz80
#include <asm/gbz80/types.h>
#elif SDCC_PORT == z80
#include <asm/z80/types.h>
#else
#error Unrecognised port
#endif

#ifndef NONBANKED
#define NONBANKED
#endif

#ifndef BANKED
#define BANKED
#endif

/** TRUE or FALSE.
 */
typedef INT8		BOOLEAN;

#if BYTE_IS_UNSIGNED

typedef UINT8		BYTE;
typedef UINT16		WORD;
typedef UINT32		DWORD;

#else

/** Signed 8 bit.
 */
typedef INT8         	BYTE;
/** Unsigned 8 bit.
 */
typedef UINT8        	UBYTE;
/** Signed 16 bit */
typedef INT16      	WORD;
/** Unsigned 16 bit */
typedef UINT16       	UWORD;
/** Signed 32 bit */
typedef INT32       	LWORD;
/** Unsigned 32 bit */
typedef UINT32      	ULWORD;
/** Signed 32 bit */
typedef INT32	   	DWORD;
/** Unsigned 32 bit */
typedef UINT32	   	UDWORD;

/** Useful definition for fixed point values */
typedef union _fixed {
  struct {
    UBYTE l;
    UBYTE h;
  } b;
  UWORD w;
} fixed;

#endif

#endif
