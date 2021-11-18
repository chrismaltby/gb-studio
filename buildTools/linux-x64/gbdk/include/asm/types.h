/** @file asm/types.h
    Shared types definitions.
*/
#ifndef ASM_TYPES_INCLUDE
#define ASM_TYPES_INCLUDE

#ifdef __PORT_gbz80
  #include <asm/gbz80/types.h>
#else
  #ifdef __PORT_z80
    #include <asm/z80/types.h>
  #else
    #error Unrecognised port
  #endif
#endif

#ifndef OLDCALL
#if __SDCC_REVISION >= 12608
#define OLDCALL __sdcccall(0)
#else
#define OLDCALL
#endif
#endif

#ifndef NONBANKED
#define NONBANKED
#endif
#ifndef BANKED
#define BANKED
#endif
#ifndef CRITICAL
#define CRITICAL
#endif
#ifndef INTERRUPT
#define INTERRUPT
#endif

/** TRUE or FALSE.
    @anchor file_asm_types_h
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

/** Useful definition for working with 8 bit + 8 bit fixed point values

    Use `.w` to access the variable as unsigned 16 bit type.

    Use `.b.h` and `.b.l` (or just `.h` and `.l`) to directly access it's high and low unsigned 8 bit values.
 */
typedef union _fixed {
  struct {
    UBYTE l;
    UBYTE h;
  };
  struct {
    UBYTE l;
    UBYTE h;
  } b;
  UWORD w;
} fixed;

#endif

#endif
