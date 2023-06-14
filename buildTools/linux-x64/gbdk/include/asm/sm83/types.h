/** @file asm/sm83/types.h
    @anchor file_asm_sm83_types_h
    Types definitions for the gb.
*/
#ifndef ASM_SM83_TYPES_INCLUDE
#define ASM_SM83_TYPES_INCLUDE

#ifndef __PORT_sm83
  #error sm83 only.
#endif

#ifdef __SDCC

#define NONBANKED		__nonbanked  /**< Placed in the non-banked lower 16K region (bank 0), regardless of the bank selected by it's source file. */
#define BANKED			__banked     /**< The function will use banked sdcc calls, and is placed in the bank selected by it's source file (or compiler switches). */
#define REENTRANT		             /**< Needed for mos6502 target when functions take too many parameters. */

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
