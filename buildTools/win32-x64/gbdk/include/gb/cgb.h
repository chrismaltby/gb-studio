/** @file gb/cgb.h
    Support for Color GameBoy.
*/

#ifndef _CGB_H
#define _CGB_H

/** Macro to create a palette entry out of the color components.
 */
#define RGB(r, g, b) \
  ((((UINT16)(b) & 0x1f) << 10) | (((UINT16)(g) & 0x1f) << 5) | (((UINT16)(r) & 0x1f) << 0))

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

/** Set bkg palette(s).
 */
void
set_bkg_palette(UINT8 first_palette,
                UINT8 nb_palettes,
                UINT16 *rgb_data) NONBANKED;

/** Set sprite palette(s).
 */
void
set_sprite_palette(UINT8 first_palette,
                   UINT8 nb_palettes,
                   UINT16 *rgb_data) NONBANKED;

/** Set a bkg palette entry.
 */
void
set_bkg_palette_entry(UINT8 palette,
                      UINT8 entry,
                      UINT16 rgb_data);

/** Set a sprite palette entry.
 */
void
set_sprite_palette_entry(UINT8 palette,
                         UINT8 entry,
                         UINT16 rgb_data);

/** Set CPU speed to slow operation.
    Make sure interrupts are disabled before call.

    @see cpu_fast
 */
void cpu_slow(void);

/** Set CPU speed to fast operation.
    Make sure interrupts are disabled before call.

    @see cpu_slow
*/
void cpu_fast(void);

/** Set defaults compatible with normal GameBoy.
 */
void cgb_compatibility(void);

#endif /* _CGB_H */
