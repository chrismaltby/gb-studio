/** @file gb/isr.h

    Macros for creating raw interrupt service routines (ISRs)
    which do not use the default GBDK ISR dispatcher.

    Handlers installed this way will have less overhead than
    ones which use the GBDK ISR dispatcher.
*/
#ifndef _ISR_H_INCLUDE_
#define _ISR_H_INCLUDE_

#include <stdint.h>
#include <types.h>

// #define VECTOR_VBL     0x40 // you can not define raw vector for VBlank interrupt
#define VECTOR_STAT    0x48  /**< Address for the STAT interrupt vector */
#define VECTOR_TIMER   0x50  /**< Address for the TIMER interrupt vector */
#define VECTOR_SERIAL  0x58  /**< Address for the SERIAL interrupt vector */
#define VECTOR_JOYPAD  0x60  /**< Address for the JOYPAD interrupt vector */

typedef struct isr_vector_t {
    uint8_t opcode;
    void * func;
} isr_vector_t;

/** Creates an interrupt vector at the given address for a raw
    interrupt service routine (which does not use the GBDK ISR dispatcher)

    @param ADDR   Address of the interrupt vector, any of: @ref VECTOR_STAT, @ref VECTOR_TIMER, @ref VECTOR_SERIAL, @ref VECTOR_JOYPAD
    @param FUNC   ISR function supplied by the user

    This cannot be used with the VBLANK interrupt.

    Do not use this in combination with interrupt installers
    that rely on the default GBDK ISR dispatcher such as
    @ref add_TIM(), @ref remove_TIM()
    (and the same for all other interrupts).

    Example:
    \code{.c}
    #include <gb/isr.h>

    void TimerISR() __critical __interrupt {
    // some ISR code here
    }

    ISR_VECTOR(VECTOR_TIMER, TimerISR)
    \endcode

    @see ISR_NESTED_VECTOR, set_interrupts
*/
#define ISR_VECTOR(ADDR, FUNC) \
static const isr_vector_t AT((ADDR)) __ISR_ ## ADDR = {0xc3, (void *)&(FUNC)};

typedef struct isr_nested_vector_t {
    uint8_t opcode[2];
    void * func;
} isr_nested_vector_t;

/** Creates an interrupt vector at the given address for a raw
    interrupt service routine allowing nested interrupts

    @param ADDR   Address of the interrupt vector, any of: @ref VECTOR_STAT, @ref VECTOR_TIMER, @ref VECTOR_SERIAL, @ref VECTOR_JOYPAD
    @param FUNC   ISR function

    This cannot be used with the VBLANK interrupt

    @see ISR_VECTOR
*/
#define ISR_NESTED_VECTOR(ADDR, FUNC) \
static const isr_nested_vector_t AT((ADDR)) __ISR_ ## ADDR = {{0xfb, 0xc3}, (void *)&(FUNC)};


#endif // _ISR_H_INCLUDE_
