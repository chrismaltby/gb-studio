/** @file gb/isr.h
    
    Allows constructing of raw ISR vectors. 

*/
#ifndef _ISR_H_INCLUDE_
#define _ISR_H_INCLUDE_

#include <stdint.h>

// #define VECTOR_VBL     0x40 // you can not define raw vector for VBlank interrupt
#define VECTOR_STAT    0x48
#define VECTOR_TIMER   0x50
#define VECTOR_SERIAL  0x58
#define VECTOR_JOYPAD  0x60

typedef struct isr_vector_t {
    uint8_t opcode;
    void * func;
} isr_vector_t;

/** Creates the interrupt vector at the given address for the raw interrupt service routrine
    
    @param ADDR address of the vector

    @param FUNC ISR function
*/
#define ISR_VECTOR(ADDR, FUNC) \
static const isr_vector_t __at((ADDR)) __ISR_ ## ADDR = {0xc3, (void *)&(FUNC) };


#endif // _ISR_H_INCLUDE_
