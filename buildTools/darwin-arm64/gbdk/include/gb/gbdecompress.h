/** @file gb/gbdecompress.h

    GB-Compress decompressor
    Compatible with the compression used in GBTD
    @see utility_gbcompress "gbcompress"
*/

#ifndef __GBDECOMPRESS_H_INCLUDE
#define __GBDECOMPRESS_H_INCLUDE

#include <types.h>
#include <stdint.h>

/** gb-decompress data from sour into dest

    @param sour   Pointer to source gb-compressed data
    @param dest   Pointer to destination buffer/address

    @see gb_decompress_bkg_data, gb_decompress_win_data, gb_decompress_sprite_data
 */
uint16_t gb_decompress(const uint8_t * sour, uint8_t * dest) OLDCALL PRESERVES_REGS(b, c);


/** gb-decompress background tiles into VRAM

    @param first_tile  Index of the first tile to write
    @param sour        Pointer to (gb-compressed 2 bpp) source Tile Pattern data.

    Note: This function avoids writes during modes 2 & 3

    @see gb_decompress_bkg_data, gb_decompress_win_data, gb_decompress_sprite_data
*/
void gb_decompress_bkg_data(uint8_t first_tile, const uint8_t * sour) OLDCALL PRESERVES_REGS(b, c);


/** gb-decompress window tiles into VRAM

    @param first_tile  Index of the first tile to write
    @param sour        Pointer to (gb-compressed 2 bpp) source Tile Pattern data.

    This is the same as @ref gb_decompress_bkg_data, since the Window Layer and
    Background Layer share the same Tile pattern data.

    Note: This function avoids writes during modes 2 & 3

    @see gb_decompress, gb_decompress_bkg_data, gb_decompress_sprite_data
 */
void gb_decompress_win_data(uint8_t first_tile, const uint8_t * sour) OLDCALL PRESERVES_REGS(b, c);


/** gb-decompress sprite tiles into VRAM

    @param first_tile  Index of the first tile to write
    @param sour        Pointer to source compressed data

    Note: This function avoids writes during modes 2 & 3

    @see gb_decompress, gb_decompress_bkg_data, gb_decompress_win_data
 */
void gb_decompress_sprite_data(uint8_t first_tile, const uint8_t * sour) OLDCALL PRESERVES_REGS(b, c);

#endif