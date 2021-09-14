/** @file gb/cgb.h
    Support for the Color GameBoy (CGB).

    __Enabling CGB features__

    To unlock and use CGB features and registers you need to
    change byte 0143h in the cartridge header.  Otherwise, the CGB
    will operate in monochrome "Non CGB" compatibility mode.
    \li Use a value of __80h__ for games that support CGB and monochrome gameboys
        \n (with Lcc: __-Wm-yc__, or makebin directly: __-yc__)
    \li Use a value of __C0h__ for CGB only games.
        \n (with Lcc: __-Wm-yC__, or makebin directly: __-yC__)

    See the Pan Docs for more information CGB features.
*/

#ifndef _CGB_H
#define _CGB_H

#include <types.h>
#include <stdint.h>

/** Macro to create a CGB palette color entry out of the color components.

    @param r   Red Component, range 0 - 31 (31 brightest)
    @param g   Green Component, range 0 - 31 (31 brightest)
    @param b   Blue Component, range 0 - 31 (31 brightest)

    The resulting format is BGR 15bpp.

    @see set_bkg_palette(), set_sprite_palette()
 */
#define RGB(r, g, b) \
  ((((uint16_t)(b) & 0x1f) << 10) | (((uint16_t)(g) & 0x1f) << 5) | (((uint16_t)(r) & 0x1f) << 0))

/** Common colors based on the EGA default palette.
 */
#define RGB_RED        RGB(31,  0,  0)
#define RGB_DARKRED    RGB(15,  0,  0)
#define RGB_GREEN      RGB( 0, 31,  0)
#define RGB_DARKGREEN  RGB( 0, 15,  0)
#define RGB_BLUE       RGB( 0,  0, 31)
#define RGB_DARKBLUE   RGB( 0,  0, 15)
#define RGB_YELLOW     RGB(31, 31,  0)
#define RGB_DARKYELLOW RGB(21, 21,  0)
#define RGB_CYAN       RGB( 0, 31, 31)
#define RGB_AQUA       RGB(28,  5, 22)
#define RGB_PINK       RGB(11,  0, 31)
#define RGB_PURPLE     RGB(21,  0, 21)
#define RGB_BLACK      RGB( 0,  0,  0)
#define RGB_DARKGRAY   RGB(10, 10, 10)
#define RGB_LIGHTGRAY  RGB(21, 21, 21)
#define RGB_WHITE      RGB(31, 31, 31)

#define RGB_LIGHTFLESH RGB(30, 20, 15)
#define RGB_BROWN      RGB(10, 10,  0)
#define RGB_ORANGE     RGB(30, 20,  0)
#define RGB_TEAL       RGB(15, 15,  0)

/** Set CGB background palette(s).

    @param first_palette  Index of the first palette to write (0-7)
    @param nb_palettes    Number of palettes to write (1-8, max depends on first_palette)
    @param rgb_data       Pointer to source palette data

    Writes __nb_palettes__ to background palette data starting
    at __first_palette__, Palette data is sourced from __rgb_data__.

    \li Each Palette is 8 bytes in size: 4 colors x 2 bytes per palette color entry.
    \li Each color (4 per palette) is packed as BGR 15bpp format (1:5:5:5, MSBit [15] is unused).
    \li Each component (R, G, B) may have values from 0 - 31 (5 bits), 31 is brightest.

    @see RGB(), set_bkg_palette_entry()
 */
void
set_bkg_palette(uint8_t first_palette,
                uint8_t nb_palettes,
                uint16_t *rgb_data) NONBANKED;

/** Set CGB sprite palette(s).

    @param first_palette  Index of the first palette to write (0-7)
    @param nb_palettes    Number of palettes to write (1-8, max depends on first_palette)
    @param rgb_data       Pointer to source palette data

    Writes __nb_palettes__ to sprite palette data starting
    at __first_palette__, Palette data is sourced from __rgb_data__.

    \li Each Palette is 8 bytes in size: 4 colors x 2 bytes per palette color entry.
    \li Each color (4 per palette) is packed as BGR 15bpp format (1:5:5:5, MSBit [15] is unused).
    \li Each component (R, G, B) may have values from 0 - 31 (5 bits), 31 is brightest.

    @see RGB(), set_sprite_palette_entry()
 */
void
set_sprite_palette(uint8_t first_palette,
                   uint8_t nb_palettes,
                   uint16_t *rgb_data) NONBANKED;

/** Sets a single color in the specified CGB background palette.

    @param palette  Index of the palette to modify (0-7)
    @param entry    Index of color in palette to modify (0-3)
    @param rgb_data New color data in BGR 15bpp format.

    @see set_bkg_palette(), RGB()
 */

void
set_bkg_palette_entry(uint8_t palette,
                      uint8_t entry,
                      uint16_t rgb_data);

/** Sets a single color in the specified CGB sprite palette.

    @param palette  Index of the palette to modify (0-7)
    @param entry    Index of color in palette to modify (0-3)
    @param rgb_data New color data in BGR 15bpp format.

    @see set_sprite_palette(), RGB()
 */
void
set_sprite_palette_entry(uint8_t palette,
                         uint8_t entry,
                         uint16_t rgb_data);

/** Set CPU speed to slow (Normal Speed) operation.

    Interrupts are temporarily disabled and then re-enabled during this call.

    In this mode the CGB operates at the same speed as the DMG/Pocket/SGB models.

    \li You can check to see if @ref _cpu == @ref CGB_TYPE before using this function.

    @see cpu_fast()
 */
void cpu_slow(void);

/** Set CPU speed to fast (CGB Double Speed) operation.

    On startup the CGB operates in Normal Speed Mode and can be switched
    into Double speed mode (faster processing but also higher power consumption).
    See the Pan Docs for more information about which hardware features
    operate faster and which remain at Normal Speed.

    \li Interrupts are temporarily disabled and then re-enabled during this call.
    \li You can check to see if @ref _cpu == @ref CGB_TYPE before using this function.

    @see cpu_slow(), _cpu
*/
void cpu_fast(void);

/** Set defaults compatible with the normal GameBoy models.

    The default/first CGB palettes for sprites and backgrounds are
    set to a similar default appearance as on the DMG/Pocket/SGB models.
    (White, Light Gray, Dark Gray, Black)

    \li You can check to see if @ref _cpu == @ref CGB_TYPE before using this function.
 */
void cgb_compatibility(void);

#endif /* _CGB_H */
