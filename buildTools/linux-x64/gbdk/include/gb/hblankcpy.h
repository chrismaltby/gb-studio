#ifndef __HBLANKCPY_H_INCLUDE__
#define __HBLANKCPY_H_INCLUDE__

#include <stdint.h>

/** HBlank stack copy routine
 * takes stack_copy_destination and stack_copy_source global variables as parameters
 * manipulates STAT, IE, IF on enter, restores STAT, IE on exit
 * interrupts must be disabled on call
  @param count number of 16 byte chunks to copy
*/
void hblank_copy_vram(const uint8_t * sour, uint8_t count);

/** HBlank stack copy routine
 * takes stack_copy_destination and stack_copy_source global variables as parameters
 * interrupts must be properly configured
 * interrupts must be disabled on call
  @param count number of 16 byte chunks to copy
*/
void hblank_cpy_vram(const uint8_t * sour, uint8_t count);

extern uint8_t * hblank_copy_destination;

/** HBlank stack copy routine (must be called with disabled interrupts!)
    @param dest destination pointer
    @param sour source pointer
    @param size number of bytes to copy (rounded to 16-byte chunks)
*/
inline void hblank_copy(uint8_t * dest, const uint8_t * sour, uint16_t size) {
    hblank_copy_destination = dest;
    hblank_copy_vram(sour, size >> 4);
}

#endif