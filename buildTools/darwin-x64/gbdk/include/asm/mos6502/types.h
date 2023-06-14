/** @file asm/mos6502/types.h
    @anchor file_asm_mos6502_types_h
    Types definitions for the gb.
*/
#ifndef ASM_MOS6502_TYPES_INCLUDE
#define ASM_MOS6502_TYPES_INCLUDE

#ifndef __PORT_mos6502
  #error mos6502 only.
#endif

#ifdef __SDCC

#define NONBANKED	            /**< Currently a no-op for mos6502 target. */
#define BANKED		            /**< Currently a no-op for mos6502 target. */
#define REENTRANT	__reentrant /**< Needed for mos6502 target when functions take too many parameters. */

/**  Use to create a block of code which should execute with interrupts temporarily turned off.

    __Do not__ use the function definition attributes
    @ref CRITICAL and @ref INTERRUPT when declaring
    ISR functions added via add_VBL() (or LCD, etc).
    These attributes are only required when constructing
    a bare jump from the interrupt vector itself.

    @see enable_interrupts, disable_interrupts
*/
#define CRITICAL		__critical

/**  Indicate to the compiler the function will be used as an interrupt handler.

    __Do not__ use the function definition attributes
    @ref CRITICAL and @ref INTERRUPT when declaring
    ISR functions added via add_VBL() (or LCD, etc).
    These attributes are only required when constructing
    a bare jump from the interrupt vector itself.

    @see ISR_VECTOR(), ISR_NESTED_VECTOR()
*/
#define INTERRUPT		__interrupt

#endif

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
typedef unsigned int	size_t;
#endif

/** Returned from clock
    @see clock
*/
typedef unsigned int	clock_t;

#endif
