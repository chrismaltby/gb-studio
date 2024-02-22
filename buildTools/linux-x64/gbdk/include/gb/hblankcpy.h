#ifndef __HBLANKCPY_H_INCLUDE__
#define __HBLANKCPY_H_INCLUDE__

#include <stdint.h>

/** HBlank stack copy routine
    @param sour    Source address to copy from
    @param count   Number of 16 byte chunks to copy

    Performs the required STAT_REG, IE_REG, IF_REG manipulation
    when called and restores STAT_REG and IE_REG on exit
    (unlike @ref hblank_cpy_vram()).

    Before calling:
    - Set the destination using @ref hblank_copy_destination
    - Interrupts must be disabled

    @see hblank_cpy_vram, hblank_copy_destination, hblank_copy
*/
void hblank_copy_vram(const uint8_t * sour, uint8_t count);

/** HBlank stack copy routine
    @param sour    Source address to copy from
    @param count   Number of 16 byte chunks to copy

    Unlike @ref hblank_copy_vram() does not perform the required
    STAT_REG, IE_REG, IF_REG manipulation, nor does it restore
    STAT_REG and IE_REG on exit.

    Before calling:
    - Set the destination using @ref hblank_copy_destination
    - Interrupts must be properly configured
    - Interrupts must be disabled

    @see hblank_copy_vram, hblank_copy_destination, hblank_copy
*/
void hblank_cpy_vram(const uint8_t * sour, uint8_t count);

extern uint8_t * hblank_copy_destination; /**< Destination address for hblank copy routine */

/** HBlank stack copy routine (must be called with interrupts disabled!)
    @param dest destination pointer
    @param sour source pointer
    @param size number of bytes to copy (rounded to 16-byte chunks)

    Performs a fast vram safe copy of data during HBlank.
*/
inline void hblank_copy(uint8_t * dest, const uint8_t * sour, uint16_t size) {
    hblank_copy_destination = dest;
    hblank_copy_vram(sour, size >> 4);
}

#endif