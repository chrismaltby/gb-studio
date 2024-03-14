/** @file asm/types.h
    Shared types definitions.
*/
#ifndef ASM_TYPES_INCLUDE
#define ASM_TYPES_INCLUDE

#if defined(__PORT_sm83)
#include <asm/sm83/types.h>
#elif defined(__PORT_z80)
#include <asm/z80/types.h>
#elif defined(__PORT_mos6502)
#include <asm/mos6502/types.h>
#else
#error Unrecognised port
#endif

#ifndef OLDCALL
#if __SDCC_REVISION >= 12608
#define OLDCALL __sdcccall(0)
#else
#define OLDCALL
#endif
#endif

#ifdef __SDCC
#define PRESERVES_REGS(...) __preserves_regs(__VA_ARGS__)
#define NAKED    __naked
#define SFR      __sfr
#define AT(A)    __at(A)
#define NORETURN _Noreturn
#else
#define PRESERVES_REGS(...)
#define NAKED
#define SFR
#define AT(A)
#define NORETURN
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
typedef INT8    BOOLEAN;

/** Signed 8 bit.
 */
typedef INT8    BYTE;
/** Unsigned 8 bit.
 */
typedef UINT8   UBYTE;
/** Signed 16 bit */
typedef INT16   WORD;
/** Unsigned 16 bit */
typedef UINT16  UWORD;
/** Signed 32 bit */
typedef INT32   LWORD;
/** Unsigned 32 bit */
typedef UINT32  ULWORD;
/** Signed 32 bit */
typedef INT32	  DWORD;
/** Unsigned 32 bit */
typedef UINT32	UDWORD;

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
