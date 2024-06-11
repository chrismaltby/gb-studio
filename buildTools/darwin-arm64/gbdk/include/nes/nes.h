/** @file nes/nes.h
    NES specific functions.
*/
#ifndef _NES_H
#define _NES_H

#include <types.h>
#include <stdint.h>
#include <gbdk/version.h>
#include <nes/hardware.h>
#include <nes/rgb_to_nes_macro.h>

#define NINTENDO_NES

// Here NINTENDO means Game Boy & related clones
#ifdef NINTENDO
#undef NINTENDO
#endif

#ifdef SEGA
#undef SEGA
#endif

#ifdef MSX
#undef MSX
#endif

#define SYSTEM_BITS_NTSC        0x00
#define SYSTEM_BITS_PAL         0x40
#define SYSTEM_BITS_DENDY       0x80
extern const uint8_t _SYSTEM;

#define SYSTEM_60HZ    0x00
#define SYSTEM_50HZ    0x01

#define RGB(r,g,b)        RGB_TO_NES(((r) | ((g) << 2) | ((b) << 4)))
#define RGB8(r,g,b)       RGB_TO_NES((((r) >> 6) | (((g) >> 6) << 2) | (((b) >> 6) << 4)))
#define RGBHTML(RGB24bit) RGB_TO_NES((((RGB24bit) >> 22) | ((((RGB24bit) & 0xFFFF) >> 14) << 2) | ((((RGB24bit) & 0xFF) >> 6) << 4)))

/** Common colors based on the EGA default palette.
 *
 * Manually entered from https://www.nesdev.org/wiki/PPU_palettes#RGBI
 *
 */
#define RGB_RED        0x16     // EGA12
#define RGB_DARKRED    0x06     // EGA4
#define RGB_GREEN      0x2A     // EGA10
#define RGB_DARKGREEN  0x1A     // EGA2
#define RGB_BLUE       0x12     // EGA9
#define RGB_DARKBLUE   0x02     // EGA1
#define RGB_YELLOW     0x28     // EGA14
#define RGB_DARKYELLOW 0x18     // EGA6
#define RGB_CYAN       0x2C     // EGA11
#define RGB_AQUA       0x1C     // EGA3
#define RGB_PINK       0x24     // EGA13
#define RGB_PURPLE     0x14     // EGA5
#define RGB_BLACK      0x0F     // EGA0
#define RGB_DARKGRAY   0x00     // EGA8
#define RGB_LIGHTGRAY  0x10     // EGA7
#define RGB_WHITE      0x30     // EGA15

typedef uint8_t palette_color_t;

void set_bkg_palette(uint8_t first_palette, uint8_t nb_palettes, const palette_color_t *rgb_data) NO_OVERLAY_LOCALS;

void set_sprite_palette(uint8_t first_palette, uint8_t nb_palettes, const palette_color_t *rgb_data) NO_OVERLAY_LOCALS;

void set_bkg_palette_entry(uint8_t palette, uint8_t entry, palette_color_t rgb_data) NO_OVERLAY_LOCALS;

void set_sprite_palette_entry(uint8_t palette, uint8_t entry, palette_color_t rgb_data) NO_OVERLAY_LOCALS;

/** Joypad bits.
    A logical OR of these is used in the wait_pad and joypad
    functions.  For example, to see if the B button is pressed
    try

    uint8_t keys;
    keys = joypad();
    if (keys & J_B) {
        ...
    }

    @see joypad
 */
#define J_UP         0x08U
#define J_DOWN       0x04U
#define J_LEFT       0x02U
#define J_RIGHT      0x01U
#define J_A          0x80U
#define J_B          0x40U
#define J_SELECT     0x20U
#define J_START      0x10U

/** Screen modes.
    Normally used by internal functions only.
    @see mode()
 */
#define M_DRAWING    0x01U
#define M_TEXT_OUT   0x02U
#define M_TEXT_INOUT 0x03U
/** Set this in addition to the others to disable scrolling

    If scrolling is disabled, the cursor returns to (0,0)
    @see mode()
*/
#define M_NO_SCROLL  0x04U
/** Set this to disable interpretation
    @see mode()
*/
#define M_NO_INTERP  0x08U

/** If this is set, sprite colours come from OBJ1PAL. Else
    they come from OBJ0PAL
    @see set_sprite_prop().
*/
#define S_PALETTE    0x10U
/** If set the sprite will be flipped horizontally.
    @see set_sprite_prop()
 */
#define S_FLIPX      0x40U
/** If set the sprite will be flipped vertically.
    @see set_sprite_prop()
 */
#define S_FLIPY      0x80U
/** If this bit is clear, then the sprite will be displayed
    on top of the background and window.
    @see set_sprite_prop()
*/
#define S_PRIORITY   0x20U
/** Defines how palette number is encoded in OAM.
    Required for the png2asset tool's metasprite output.
*/
#define S_PAL(n)     n

/* DMG Palettes */
#define DMG_BLACK     0x03
#define DMG_DARK_GRAY 0x02
#define DMG_LITE_GRAY 0x01
#define DMG_WHITE     0x00
/** Macro to create a DMG palette from 4 colors

    @param C0    Color for Index 0
    @param C1    Color for Index 1
    @param C2    Color for Index 2
    @param C3    Color for Index 3

    The resulting format is four greyscale colors
    packed into a single unsigned byte.

    Example:
    \code{.c}
    REG_BGP = DMG_PALETTE(DMG_BLACK, DMG_DARK_GRAY, DMG_LITE_GRAY, DMG_WHITE);
    \endcode

    @see OBP0_REG, OBP1_REG, BGP_REG
    @see DMG_BLACK, DMG_DARK_GRAY, DMG_LITE_GRAY, DMG_WHITE

 */
#define DMG_PALETTE(C0, C1, C2, C3) ((uint8_t)((((C3) & 0x03) << 6) | (((C2) & 0x03) << 4) | (((C1) & 0x03) << 2) | ((C0) & 0x03)))

/* Limits */
/** Width of the visible screen in pixels.
 */
#define SCREENWIDTH  DEVICE_SCREEN_PX_WIDTH
/** Height of the visible screen in pixels.
 */
#define SCREENHEIGHT DEVICE_SCREEN_PX_HEIGHT

/** Interrupt handlers
 */
typedef void (*int_handler)(void) NONBANKED;

/** The remove functions will remove any interrupt handler.

   A handler of NULL will cause bad things
   to happen if the given interrupt is enabled.

   Removes the VBL interrupt handler. @see add_VBL()
*/
void remove_VBL(int_handler h) NO_OVERLAY_LOCALS;

/** Removes the LCD interrupt handler.
    @see add_LCD(), remove_VBL()
*/
void remove_LCD(int_handler h) NO_OVERLAY_LOCALS;

/** Adds a Vertical Blanking interrupt handler.

    @param h  The handler to be called whenever a V-blank
    interrupt occurs.

    Only a single handler is currently supported for NES.

    __Do not__ use the function definition attributes
    @ref CRITICAL and @ref INTERRUPT when declaring
    ISR functions added via add_VBL() (or LCD, etc).
    Those attributes are only required when constructing
    a bare jump from the interrupt vector itself (such as
    with @ref ISR_VECTOR()).

    ISR handlers added using add_VBL()/etc are instead
    called via the GBDK ISR dispatcher which makes
    the extra function attributes unecessary.

    @note The default GBDK VBL is installed automatically.

    @note On the current NES implementation, this handler
    is actually faked, and called before vblank occurs, by
    @ref vsync(). Writes to PPU registers should be done to
    the shadow_ versions, so they are updated by the default
    VBL handler only when vblank actually occurs.

    @see ISR_VECTOR()
*/
void add_VBL(int_handler h) NO_OVERLAY_LOCALS;

/** Adds a LCD interrupt handler.

    Called when the scanline matches the _lcd_scanline variables.

    Only a single handler is currently supported for NES.

    The use-case is to indicate to the user when the
    video hardware is about to redraw a given LCD line.
    This can be useful for dynamically controlling the
    scrolling registers to perform special video effects.

    __Do not__ use the function definition attributes
    @ref CRITICAL and @ref INTERRUPT when declaring
    ISR functions added via add_VBL() (or LCD, etc).
    Those attributes are only required when constructing
    a bare jump from the interrupt vector itself (such as
    with @ref ISR_VECTOR()).

    ISR handlers added using add_VBL()/etc are instead
    called via the GBDK ISR dispatcher which makes
    the extra function attributes unecessary.

    @note On the current NES implementation, this handler
    is actually faked, and called by the default VBL handler
    after a manual delay loop. Only one such faked "interrupt"
    is possible per frame.
    This means the CPU cycles wasted in the delay loop increase
    with higher values of _lcd_scanline. In practice, it makes
    this functionality mostly suited for a top status bar.

    @see add_VBL, nowait_int_handler, ISR_VECTOR()
*/
void add_LCD(int_handler h) NO_OVERLAY_LOCALS;

/** The maximum number of times the LCD handler will be called per frame.
 */
#define MAX_LCD_ISR_CALLS 4

/** Set the current screen mode - one of M_* modes

    Normally used by internal functions only.

    @see M_DRAWING, M_TEXT_OUT, M_TEXT_INOUT, M_NO_SCROLL, M_NO_INTERP
*/
void mode(uint8_t m) NO_OVERLAY_LOCALS;

/** Returns the current mode

    @see M_DRAWING, M_TEXT_OUT, M_TEXT_INOUT, M_NO_SCROLL, M_NO_INTERP
*/
uint8_t get_mode(void) NO_OVERLAY_LOCALS;

/** Returns the system gbdk is running on.

*/
inline uint8_t get_system(void) {
    if(_SYSTEM == SYSTEM_BITS_NTSC)
        return SYSTEM_60HZ;
    else
        return SYSTEM_50HZ;
}

/** Global Time Counter in VBL periods (60Hz)

    Increments once per Frame

    Will wrap around every ~18 minutes (unsigned 16 bits = 65535 / 60 / 60 = 18.2)
*/
extern volatile uint16_t sys_time;

/** Tracks current active ROM bank

    The active bank number is not tracked by @ref _current_bank when
    @ref SWITCH_ROM_MBC5_8M is used.

    This variable is updated automatically when you call SWITCH_ROM_MBC1 or
    SWITCH_ROM_MBC5, SWITCH_ROM(), or call a BANKED function.

    @see SWITCH_ROM_MBC1(), SWITCH_ROM_MBC5(), SWITCH_ROM()
*/
extern volatile uint8_t _current_bank;
#define CURRENT_BANK _current_bank

/** Obtains the __bank number__ of VARNAME

    @param VARNAME Name of the variable which has a __bank_VARNAME companion symbol which is adjusted by bankpack

    Use this to obtain the bank number from a bank reference
    created with @ref BANKREF().

    @see BANKREF_EXTERN(), BANKREF()
*/
#ifndef BANK
#define BANK(VARNAME) ( (uint8_t) & __bank_ ## VARNAME )
#endif

/** Creates a reference for retrieving the bank number of a variable or function

    @param VARNAME Variable name to use, which may be an existing identifier

    @see BANK() for obtaining the bank number of the included data.

    More than one `BANKREF()` may be created per file, but each call should
    always use a unique VARNAME.

    Use @ref BANKREF_EXTERN() within another source file
    to make the variable and it's data accesible there.
*/
#define BANKREF(VARNAME) void __func_ ## VARNAME(void) __banked __naked { \
__asm \
    .local b___func_ ## VARNAME \
    ___bank_ ## VARNAME = b___func_ ## VARNAME \
    .globl ___bank_ ## VARNAME \
__endasm; \
}

/** Creates extern references for accessing a BANKREF() generated variable.

    @param VARNAME Name of the variable used with @ref BANKREF()

    This makes a @ref BANKREF() reference in another source
    file accessible in the current file for use with @ref BANK().

    @see BANKREF(), BANK()
*/
#define BANKREF_EXTERN(VARNAME) extern const void __bank_ ## VARNAME;

/** Dummy macro for no-bank-switching WIP prototype
    @param b   ROM bank to switch to
*/
#define SWITCH_ROM_DUMMY(b)

/** Macro for simple UNROM-like switching (write bank# to single 8-bit register)
    @param b   ROM bank to switch to
*/
#define SWITCH_ROM_UNROM(b) _switch_prg0(b)

/** Makes default mapper switch the active ROM bank
    @param b   ROM bank to switch to (max 255)

    @see SWITCH_ROM_UNROM
*/
#define SWITCH_ROM SWITCH_ROM_UNROM

/** No-op at the moment. Placeholder for future mappers / test compatibility.
    @param b   SRAM bank to switch to

*/
#define SWITCH_RAM(b) 0

/** No-op at the moment. Placeholder for future mappers / test compatibility.

*/
#define ENABLE_RAM

/** No-op at the moment. Placeholder for future mappers / test compatibility.

*/
#define DISABLE_RAM

/** Delays the given number of milliseconds.
    Uses no timers or interrupts, and can be called with
    interrupts disabled
 */
void delay(uint16_t d) NO_OVERLAY_LOCALS;

/** Reads and returns the current state of the joypad.
    Return value is an OR of J_*

    When testing for multiple different buttons, it's
    best to read the joypad state *once* into a variable
    and then test using that variable.

    @see J_START, J_SELECT, J_A, J_B, J_UP, J_DOWN, J_LEFT, J_RIGHT
*/
uint8_t joypad(void) NO_OVERLAY_LOCALS;

/** Waits until at least one of the buttons given in mask are pressed.

    Normally only used for checking one key, but it will
    support many, even J_LEFT at the same time as J_RIGHT. :)

    @see joypad
    @see J_START, J_SELECT, J_A, J_B, J_UP, J_DOWN, J_LEFT, J_RIGHT
*/
uint8_t waitpad(uint8_t mask) NO_OVERLAY_LOCALS;

/** Waits for the directional pad and all buttons to be released.

*/
void waitpadup(void) NO_OVERLAY_LOCALS;

/** Multiplayer joypad structure.

    Must be initialized with @ref joypad_init() first then it
    may be used to poll all avaliable joypads with @ref joypad_ex()
*/
typedef struct {
    uint8_t npads;
    union {
        struct {
            uint8_t joy0, joy1, joy2, joy3;
        };
        uint8_t joypads[4];
    };
} joypads_t;

/** Initializes joypads_t structure for polling multiple joypads
    @param npads    number of joypads requested (1, 2 or 4)
    @param joypads  pointer to joypads_t structure to be initialized

    Only required for @ref joypad_ex, not required for calls to regular @ref joypad()
    @returns number of joypads avaliable
    @see joypad_ex(), joypads_t
*/
uint8_t joypad_init(uint8_t npads, joypads_t * joypads) NO_OVERLAY_LOCALS;

/** Polls all avaliable joypads

    @see joypad_init(), joypads_t
*/
void joypad_ex(joypads_t * joypads) NO_OVERLAY_LOCALS;



/** Enables unmasked interrupts

    @note Use @ref CRITICAL {...} instead for creating a block of
          of code which should execute with interrupts  temporarily
          turned off.

    @see disable_interrupts, set_interrupts, CRITICAL
*/
inline void enable_interrupts(void) {
    __asm__("cli");
}

/** Disables interrupts

    @note Use @ref CRITICAL {...} instead for creating a block of
          of code which should execute with interrupts  temporarily
          turned off.

    This function may be called as many times as you like;
    however the first call to @ref enable_interrupts will re-enable
    them.

    @see enable_interrupts, set_interrupts, CRITICAL
*/
inline void disable_interrupts(void) {
    __asm__("sei");
}

/** Waits for the vertical blank interrupt.

    This is often used in main loops to idle the CPU
    until it's time to start the next frame. It's also useful for
    syncing animation with the screen re-draw.

    Warning: If the VBL interrupt is disabled, this function will
    never return.
*/
void vsync(void) NO_OVERLAY_LOCALS;

/** Obsolete. This function has been replaced by vsync(), which has identical behavior.
*/
void wait_vbl_done(void) NO_OVERLAY_LOCALS;

/** Turns the display on.

    @see DISPLAY_ON
*/
void display_on(void) NO_OVERLAY_LOCALS;

/** Turns the display off immediately.
    @see DISPLAY_ON
*/
void display_off(void) NO_OVERLAY_LOCALS;

/** Copies data from shadow OAM to OAM
 */
void refresh_OAM(void) NO_OVERLAY_LOCALS;

/** Turns the display back on.
    @see display_off, DISPLAY_OFF
*/
#define DISPLAY_ON \
  display_on();

/** Turns the display off immediately.
    @see display_off, DISPLAY_ON
*/
#define DISPLAY_OFF \
  display_off();

/** Blanks leftmost column, so it is not garbaged when you use horizontal scroll
    @see SHOW_LEFT_COLUMN
*/
#define HIDE_LEFT_COLUMN \
    shadow_PPUMASK &= ~(PPUMASK_SHOW_BG_LC | PPUMASK_SHOW_SPR_LC); \

/** Shows leftmost column
    @see HIDE_LEFT_COLUMN
*/
#define SHOW_LEFT_COLUMN \
    shadow_PPUMASK |= (PPUMASK_SHOW_BG_LC | PPUMASK_SHOW_SPR_LC);

/** Does nothing for NES
    not implemented yet
 */
#define SET_BORDER_COLOR(C)

/** Turns on the background layer.
    Sets bit 0 of the LCDC register to 1.
*/
#define SHOW_BKG \
    shadow_PPUMASK |= PPUMASK_SHOW_BG;

/** Turns off the background layer.
    Sets bit 0 of the LCDC register to 0.
*/
#define HIDE_BKG \
    shadow_PPUMASK &= ~PPUMASK_SHOW_BG;

/** Turns on the sprites layer.
    Sets bit 1 of the LCDC register to 1.
*/
#define SHOW_SPRITES \
    shadow_PPUMASK |= PPUMASK_SHOW_SPR;

/** Turns off the sprites layer.
    Clears bit 1 of the LCDC register to 0.
*/
#define HIDE_SPRITES \
    shadow_PPUMASK &= ~PPUMASK_SHOW_SPR;

/** Sets sprite size to 8x16 pixels, two tiles one above the other.
    Sets bit 2 of the LCDC register to 1.
*/
#define SPRITES_8x16 \
  shadow_PPUCTRL |= PPUCTRL_SPR_8X16;

/** Sets sprite size to 8x8 pixels, one tile.
    Clears bit 2 of the LCDC register to 0.
*/
#define SPRITES_8x8 \
  shadow_PPUCTRL &= ~PPUCTRL_SPR_8X16;



/**
 * Set byte in vram at given memory location
 *
 * @param addr address to write to
 * @param v value
 */
void set_vram_byte(uint8_t * addr, uint8_t v) NO_OVERLAY_LOCALS;

/**
 * Get address of X,Y tile of background map
 */
uint8_t * get_bkg_xy_addr(uint8_t x, uint8_t y) NO_OVERLAY_LOCALS;

#define COMPAT_PALETTE(C0,C1,C2,C3) ((uint8_t)(((C3) << 6) | ((C2) << 4) | ((C1) << 2) | (C0)))

/** Sets palette for 2bpp color translation for GG/SMS, does nothing on GB
 */
inline void set_2bpp_palette(uint16_t palette) {
    palette;
}

extern uint16_t _current_1bpp_colors;
void set_1bpp_colors_ex(uint8_t fgcolor, uint8_t bgcolor, uint8_t mode) NO_OVERLAY_LOCALS;
inline void set_1bpp_colors(uint8_t fgcolor, uint8_t bgcolor) {
    set_1bpp_colors_ex(fgcolor, bgcolor, 0);
}

/** Sets VRAM Tile Pattern data for the Background

    Writes __nb_tiles__ tiles to VRAM starting at __first_tile__, tile data
    is sourced from __data__. Each Tile is 16 bytes in size (8x8 pixels, 2 bits-per-pixel).

    Note: Sprite Tiles 128-255 share the same memory region as Background Tiles 128-255.

    @see set_tile_data
*/
void set_bkg_data(uint8_t first_tile, uint8_t nb_tiles, const uint8_t *data) NO_OVERLAY_LOCALS;
#define set_bkg_2bpp_data set_bkg_data

/** Sets VRAM Tile Pattern data for the Background using 1bpp source data

    Similar to @ref set_bkg_data, except source data is 1 bit-per-pixel
    which gets expanded into 2 bits-per-pixel.

    For a given bit that represent a pixel:
    \li 0 will be expanded into color 0
    \li 1 will be expanded into color 1, 2 or 3 depending on color argument

    @see SHOW_BKG, HIDE_BKG, set_bkg_tiles
*/
void set_bkg_1bpp_data(uint8_t first_tile, uint8_t nb_tiles, const uint8_t *data) NO_OVERLAY_LOCALS;

/** Sets a rectangular region of Background Tile Map.

    Entries are copied from map at __tiles__ to the Background Tile Map starting at
    __x__, __y__ writing across for __w__ tiles and down for __h__ tiles.

    Use @ref set_bkg_submap() instead when:
    \li Source map is wider than 32 tiles.
    \li Writing a width that does not match the source map width __and__ more
    than one row high at a time.

    One byte per source tile map entry.

    Writes that exceed coordinate 31 on the x or y axis will wrap around to
    the Left and Top edges.

    @see SHOW_BKG
    @see set_bkg_data, set_bkg_submap, set_win_tiles, set_tiles
*/
void set_bkg_tiles(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *tiles) NO_OVERLAY_LOCALS;
#define set_tile_map set_bkg_tiles

/** Sets a rectangular region of Background Tile Map Attributes.

    @param x          X Start position in Background Map tile coordinates. Range 0 - 15
    @param y          Y Start position in Background Map tile coordinates. Range 0 - 14
    @param w          Width of area to set in tiles. Range 1 - 16
    @param h          Height of area to set in tiles. Range 1 - 15
    @param attributes Pointer to source tile map attribute data

    Entries are copied from map at __tiles__ to the Background Tile Map starting at
    __x__, __y__ writing across for __w__ tiles and down for __h__ tiles.

    NES 16x16 Tile Attributes are tightly packed into 4 attributes per byte,
    with each 16x16 area of a 32x32 pixel block using the bits as follows:
    D1-D0: Top-left 16x16 pixels
    D3-D2: Top-right 16x16 pixels
    D5-D4: Bottom-left 16x16 pixels
    D7-D6: Bottom-right 16x16 pixels

    https://www.nesdev.org/wiki/PPU_attribute_tables

    @see SHOW_BKG
    @see set_bkg_data, set_bkg_submap_attributes, set_win_tiles, set_tiles
*/
void set_bkg_attributes_nes16x16(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *attributes) NO_OVERLAY_LOCALS;

/** Sets a rectangular region of Background Tile Map Attributes.

    Entries are copied from map at __tiles__ to the Background Tile Map starting at
    __x__, __y__ writing across for __w__ tiles and down for __h__ tiles.

    Use @ref set_bkg_submap_attributes() instead when:
    \li Source map is wider than 32 tiles.
    \li Writing a width that does not match the source map width __and__ more
    than one row high at a time.

    One byte per source tile map attribute entry.

    Writes that exceed coordinate 31 on the x or y axis will wrap around to
    the Left and Top edges.

    Please note that this is just a wrapper function for set_bkg_attributes_nes16x16()
    and divides the coordinates and dimensions by 2 to achieve this.
    It is intended to make code more portable by using the same coordinate system
    that systems with the much more common 8x8 attribute resolution would use.

    @see SHOW_BKG
    @see set_bkg_data, set_bkg_submap_attributes, set_win_tiles, set_tiles
*/
inline void set_bkg_attributes(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *attributes)
{
    set_bkg_attributes_nes16x16(x >> 1, y >> 1, (w + 1) >> 1, (h + 1) >> 1, attributes);
}
/** Sets a rectangular area of the Background Tile Map using a sub-region
    from a source tile map. Useful for scrolling implementations of maps
    larger than 32 x 30 tiles / 16x15 attributes.

    @param x      X Start position in both the Source Attribute Map and hardware Background Map attribute coordinates. Range 0 - 255
    @param y      Y Start position in both the Source Attribute Map and hardware Background Map attribute coordinates. Range 0 - 255
    @param w      Width of area to set in Attributes. Range 1 - 127
    @param h      Height of area to set in Attributes. Range 1 - 127
    @param map    Pointer to source tile map data
    @param map_w  Width of source tile map in tiles. Range 1 - 127

    Entries are copied from __map__ to the Background Attribute Map starting at
    __x__, __y__ writing across for __w__ tiles and down for __h__ attributes,
    using __map_w__ as the rowstride for the source attribute map.

    The __x__ and __y__ parameters are in Source Attribute Map Attribute
    coordinates. The location tiles will be written to on the
    hardware Background Map is derived from those, but only uses
    the lower 5 bits of each axis, for range of 0-15 (they are
    bit-masked: `x & 0xF` and `y & 0xF`). As a result the two
    coordinate systems are aligned together.

    In order to transfer tile map data in a way where the
    coordinate systems are not aligned, an offset from the
    Source Attribute Map pointer can be passed in:
    `(map_ptr + x + (y * map_width))`.

    For example, if you want the tile id at `1,2` from the source map to
    show up at `0,0` on the hardware Background Map (instead of at `1,2`)
    then modify the pointer address that is passed in:
    `map_ptr + 1 + (2 * map_width)`

    Use this instead of @ref set_bkg_tiles when the source map is wider than
    32 tiles or when writing a width that does not match the source map width.

    One byte per source attribute map entry.

    Writes that exceed coordinate 15/14 on the x / y axis will wrap around to
    the Left and Top edges.

    See @ref set_bkg_tiles for setting CGB attribute maps with @ref VBK_REG.

    @see SHOW_BKG
    @see set_bkg_data, set_bkg_tiles, set_win_submap, set_tiles
*/
void set_bkg_submap_attributes_nes16x16(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *map, uint8_t map_w) NO_OVERLAY_LOCALS;

/** Sets a rectangular area of the Background Tile Map attributes using
    a sub-region from a source tile map. Useful for scrolling implementations
    of maps larger than 32 x 30 tiles.

    Please note that this is just a wrapper function for set_bkg_submap_attributes_nes16x16()
    and divides the coordinates and dimensions by 2 to achieve this.
    It is intended to make code more portable by using the same coordinate system
    that systems with the much more common 8x8 attribute resolution would use.

    @see SHOW_BKG
    @see set_bkg_data, set_bkg_tiles, set_win_submap, set_tiles
*/
inline void set_bkg_submap_attributes(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *attributes, uint8_t map_w)
{
    set_bkg_submap_attributes_nes16x16(x >> 1, y >> 1, (w + 1) >> 1, (h + 1) >> 1, attributes, map_w >> 1);
}


extern uint8_t _map_tile_offset;

/** Sets a rectangular region of Background Tile Map.
    The offset value in __base_tile__ is added to
    the tile ID for each map entry.

    @param x      X Start position in Background Map tile coordinates. Range 0 - 31
    @param y      Y Start position in Background Map tile coordinates. Range 0 - 31
    @param w      Width of area to set in tiles. Range 1 - 32
    @param h      Height of area to set in tiles. Range 1 - 32
    @param tiles  Pointer to source tile map data
    @param base_tile Offset each tile ID entry of the source map by this value. Range 1 - 255

    This is identical to @ref set_bkg_tiles() except that it
    adds the __base_tile__ parameter for when a tile map's tiles don't
    start at index zero. (For example, the tiles used by the map
    range from 100 -> 120 in VRAM instead of 0 -> 20).

    @see set_bkg_tiles for more details
*/
inline void set_bkg_based_tiles(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *tiles, uint8_t base_tile) {
    _map_tile_offset = base_tile;
    set_bkg_tiles(x, y, w, h, tiles);
    _map_tile_offset = 0;
}


/** Sets a rectangular area of the Background Tile Map using a sub-region
    from a source tile map. Useful for scrolling implementations of maps
    larger than 32 x 32 tiles.

    @ param x      X Start position in Background Map tile coordinates. Range 0 - 31
    @ param y      Y Start position in Background Map tile coordinates. Range 0 - 31
    @ param w      Width of area to set in tiles. Range 1 - 255
    @ param h      Height of area to set in tiles. Range 1 - 255
    @ param map    Pointer to source tile map data
    @ param map_w  Width of source tile map in tiles. Range 1 - 255

    Entries are copied from __map__ to the Background Tile Map starting at
    __x__, __y__ writing across for __w__ tiles and down for __h__ tiles,
    using __map_w__ as the rowstride for the source tile map.

    Use this instead of @ref set_bkg_tiles when the source map is wider than
    32 tiles or when writing a width that does not match the source map width.

    One byte per source tile map entry.

    Writes that exceed coordinate 31 on the x or y axis will wrap around to
    the Left and Top edges.

    See @ref set_bkg_tiles for setting CGB attribute maps with @ref VBK_REG.

    @see SHOW_BKG
    @see set_bkg_data, set_bkg_tiles, set_win_submap, set_tiles
*/
void set_bkg_submap(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *map, uint8_t map_w) NO_OVERLAY_LOCALS;
#define set_tile_submap set_bkg_submap


extern uint8_t _submap_tile_offset;

/** Sets a rectangular area of the Background Tile Map using a sub-region
    from a source tile map. The offset value in __base_tile__ is added to
    the tile ID for each map entry.

    @param x      X Start position in Background Map tile coordinates. Range 0 - 31
    @param y      Y Start position in Background Map tile coordinates. Range 0 - 31
    @param w      Width of area to set in tiles. Range 1 - 255
    @param h      Height of area to set in tiles. Range 1 - 255
    @param map    Pointer to source tile map data
    @param map_w  Width of source tile map in tiles. Range 1 - 255
    @param base_tile Offset each tile ID entry of the source map by this value. Range 1 - 255

    This is identical to @ref set_bkg_submap() except that it
    adds the __base_tile__ parameter for when a tile map's tiles don't
    start at index zero. (For example, the tiles used by the map
    range from 100 -> 120 in VRAM instead of 0 -> 20).

    @see set_bkg_submap for more details
*/
inline void set_bkg_based_submap(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *map, uint8_t map_w, uint8_t base_tile) {
    _submap_tile_offset = base_tile;
    set_bkg_submap(x, y, w, h, map, map_w);
    _submap_tile_offset = 0;
}


/** Copies a rectangular region of Background Tile Map entries into a buffer.

    Entries are copied into __tiles__ from the Background Tile Map starting at
    __x__, __y__ reading across for __w__ tiles and down for __h__ tiles.

    One byte per tile.

    The buffer pointed to by __tiles__ should be at least __x__ x __y__ bytes in size.

    @see get_bkg_tile_xy, get_tiles
*/
void get_bkg_tiles(uint8_t x, uint8_t y, uint8_t w, uint8_t h, uint8_t *tiles) NO_OVERLAY_LOCALS;


/**
 * Set single tile t on background layer at x,y
 * @param x X-coordinate
 * @param y Y-coordinate
 * @param t tile index
 * @return returns the address of tile, so you may use faster set_vram_byte() later
 */
uint8_t * set_bkg_tile_xy(uint8_t x, uint8_t y, uint8_t t) NO_OVERLAY_LOCALS;
#define set_tile_xy set_bkg_tile_xy

/**
    Set single attribute data a on background layer at x,y

    @param x X-coordinate
    @param y Y-coordinate
    @param a tile attributes
 */
void set_bkg_attribute_xy_nes16x16(uint8_t x, uint8_t y, uint8_t a) NO_OVERLAY_LOCALS;

/**
    Set single attribute data a on background layer at x,y

    Please note that this is just a wrapper function for set_bkg_submap_attributes_nes16x16()
    and divides the coordinates and dimensions by 2 to achieve this.
    It is intended to make code more portable by using the same coordinate system
    that systems with the much more common 8x8 attribute resolution would use.

    @param x X-coordinate
    @param y Y-coordinate
    @param a tile attributes
 */
inline void set_bkg_attribute_xy(uint8_t x, uint8_t y, uint8_t a)
{
    set_bkg_attribute_xy_nes16x16(x >> 1, y >> 1, a);
}
#define set_attribute_xy set_bkg_attribute_xy

/**
 * Get single tile t on background layer at x,y
 * @param x X-coordinate
 * @param y Y-coordinate
 * @return returns tile index
 */
uint8_t get_bkg_tile_xy(uint8_t x, uint8_t y) NO_OVERLAY_LOCALS;


/** Moves the Background Layer to the position specified in __x__ and __y__ in pixels.

    @param x   X axis screen coordinate for Left edge of the Background
    @param y   Y axis screen coordinate for Top edge of the Background

    0,0 is the top left corner of the GB screen. The Background Layer wraps around the screen,
    so when part of it goes off the screen it appears on the opposite side (factoring in the
    larger size of the Background Layer versus the screen size).

    The background layer is always under the Window Layer.

    @see SHOW_BKG, HIDE_BKG
*/
inline void move_bkg(uint8_t x, uint8_t y) {
    bkg_scroll_x = x, bkg_scroll_y = y;
}


/** Moves the Background relative to it's current position.

    @param x   Number of pixels to move the Background on the __X axis__
               \n Range: -128 - 127
    @param y   Number of pixels to move the Background on the __Y axis__
               \n Range: -128 - 127

    @see move_bkg
*/
inline void scroll_bkg(int8_t x, int8_t y) {
    bkg_scroll_x += x, bkg_scroll_y += y;
}


/** Sets VRAM Tile Pattern data for Sprites

    Writes __nb_tiles__ tiles to VRAM starting at __first_tile__, tile data
    is sourced from __data__. Each Tile is 16 bytes in size (8x8 pixels, 2 bits-per-pixel).

    Note: Sprite Tiles 128-255 share the same memory region as Background Tiles 128-255.

    GBC only: @ref VBK_REG determines which bank of tile patterns are written to.
    \li VBK_REG=0 indicates the first bank
    \li VBK_REG=1 indicates the second
*/
void set_sprite_data(uint8_t first_tile, uint8_t nb_tiles, const uint8_t *data) NO_OVERLAY_LOCALS;
#define set_sprite_2bpp_data set_sprite_data

/** Sets VRAM Tile Pattern data for Sprites using 1bpp source data

    Similar to @ref set_sprite_data, except source data is 1 bit-per-pixel
    which gets expanded into 2 bits-per-pixel.

    For a given bit that represent a pixel:
    \li 0 will be expanded into color 0
    \li 1 will be expanded into color 3

    @see SHOW_SPRITES, HIDE_SPRITES, set_sprite_tile
*/
void set_sprite_1bpp_data(uint8_t first_tile, uint8_t nb_tiles, const uint8_t *data) NO_OVERLAY_LOCALS;

/** Sprite Attributes structure
    @param x     X Coordinate of the sprite on screen
    @param y     Y Coordinate of the sprite on screen - 1
    @param tile  Sprite tile number (see @ref set_sprite_tile)
    @param prop  OAM Property Flags (see @ref set_sprite_prop)
*/
typedef struct OAM_item_t {
    uint8_t y;     //< Y coordinate of the sprite on screen - 1
    uint8_t tile;  //< Sprite tile number
    uint8_t prop;  //< OAM Property Flags
    uint8_t x;     //< X coordinate of the sprite on screen
} OAM_item_t;


/** Shadow OAM array in WRAM, that is DMA-transferred into the real OAM each VBlank
*/
extern volatile struct OAM_item_t shadow_OAM[];

/** MSB of shadow_OAM address is used by OAM DMA copying routine
*/
extern uint8_t _shadow_OAM_base;

#define DISABLE_OAM_DMA \
    _shadow_OAM_base = 0

/** Disable OAM DMA copy each VBlank
*/
#define DISABLE_VBL_TRANSFER DISABLE_OAM_DMA

#define ENABLE_OAM_DMA \
    _shadow_OAM_base = (uint8_t)((uint16_t)&shadow_OAM >> 8)

/** Enable OAM DMA copy each VBlank and set it to transfer default shadow_OAM array
*/
#define ENABLE_VBL_TRANSFER ENABLE_OAM_DMA

/** Amount of hardware sprites in OAM
*/
#define MAX_HARDWARE_SPRITES 64

/** True if sprite hardware can flip sprites by X (horizontally)
*/
#define HARDWARE_SPRITE_CAN_FLIP_X 1

/** True if sprite hardware can flip sprites by Y (vertically)
*/
#define HARDWARE_SPRITE_CAN_FLIP_Y 1

/** Enable OAM DMA copy each VBlank and set it to transfer any 256-byte aligned array
*/
inline void SET_SHADOW_OAM_ADDRESS(void * address) {
    _shadow_OAM_base = (uint8_t)((uint16_t)address >> 8);
}

/** Sets sprite number __nb__in the OAM to display tile number __tile__.

    @param nb    Sprite number, range 0 - 63
    @param tile  Selects a tile (0 - 255) from PPU memory at 0000h - 0FFFh / 1000h - 1FFFh

    In 8x16 mode:
    \li The sprite will also display the next tile (__tile__ + 1)
        directly below (y + 8) the first tile.
    \li The lower bit of the tile number is ignored:
        the upper 8x8 tile is (__tile__ & 0xFE), and
        the lower 8x8 tile is (__tile__ | 0x01).
    \li See: @ref SPRITES_8x16
*/
void set_sprite_tile(uint8_t nb, uint8_t tile) NO_OVERLAY_LOCALS;


/** Returns the tile number of sprite number __nb__ in the OAM.

@param nb    Sprite number, range 0 - 63

@see set_sprite_tile for more details
*/
uint8_t get_sprite_tile(uint8_t nb) NO_OVERLAY_LOCALS;


/** Sets the OAM Property Flags of sprite number __nb__ to those defined in __prop__.

    @param nb    Sprite number, range 0 - 39
    @param prop  Property setting (see bitfield description)

    The bits in __prop__ represent:
    \li Bit 7 - Vertical flip. Dictates which way up the sprite is drawn
              vertically.
              \n 0: normal
              \n 1: upside down
    \li Bit 6 - Horizontal flip. Dictates which way up the sprite is
              drawn horizontally.
              \n 0: normal
              \n 1: back to front
    \li Bit 5 - Priority flag. When this is set, the sprites appear behind the
              background and window layer.
              \n 0: infront
              \n 1: behind
    \li Bit 4 - Unimplemented
    \li Bit 3 - Unimplemented
    \li Bit 2 - Unimplemented
    \li Bit 1 - See bit 0.
    \li Bit 0 - Bits 0-1 indicate which color palette the sprite should use. Note: only palettes 4 to 7 will be available for NES sprites.

    It's recommended to use GBDK constants (eg: S_FLIPY) to configure sprite properties as these are crossplatform.

    \code{.c}
    // Load palette data into the first palette
    set_sprite_palette(4, 1, exampleSprite_palettes)

    // Set the OAM value for the sprite
    // These flags tell the sprite to use the first sprite palette (palette 4) and to flip the sprite both vertically and horizontally.
    set_sprite_prop(0, S_FLIPY | S_FLIPX);
    \endcode

    @see S_PALETTE, S_FLIPX, S_FLIPY, S_PRIORITY
*/
void set_sprite_prop(uint8_t nb, uint8_t prop) NO_OVERLAY_LOCALS;


/** Returns the OAM Property Flags of sprite number __nb__.

    @param nb    Sprite number, range 0 - 39
    @see set_sprite_prop for property bitfield settings
*/
uint8_t get_sprite_prop(uint8_t nb) NO_OVERLAY_LOCALS;


/** Moves sprite number __nb__ to the __x__, __y__ position on the screen.

    @param nb  Sprite number, range 0 - 63
    @param x   X Position. Specifies the sprites horizontal position on the screen (minus 8).
    @param y   Y Position. Specifies the sprites vertical position on the screen (minus 16).
               \n An offscreen value (Y>=240) hides the sprite.

    Moving the sprite to 0,0 (or similar off-screen location) will hide it.
*/
void move_sprite(uint8_t nb, uint8_t x, uint8_t y) NO_OVERLAY_LOCALS;


/** Moves sprite number __nb__ relative to its current position.

    @param nb  Sprite number, range 0 - 63
    @param x   Number of pixels to move the sprite on the __X axis__
               \n Range: -128 - 127
    @param y   Number of pixels to move the sprite on the __Y axis__
               \n Range: -128 - 127

    @see move_sprite for more details about the X and Y position
 */
void scroll_sprite(uint8_t nb, int8_t x, int8_t y) NO_OVERLAY_LOCALS;


/** Hides sprite number __nb__ by moving it to Y position 240.

    @param nb  Sprite number, range 0 - 63
 */
void hide_sprite(uint8_t nb) NO_OVERLAY_LOCALS;



/** Copies arbitrary data to an address in VRAM
    without taking into account the state of LCDC bits 3 or 4.

    Copies __len__ bytes from a buffer at __data__ to VRAM starting at __vram_addr__.

    @see set_bkg_data, set_win_data, set_bkg_tiles, set_win_tiles, set_tile_data, set_tiles
*/
void set_data(uint8_t *vram_addr, const uint8_t *data, uint16_t len) NO_OVERLAY_LOCALS;


/** Sets a rectangular region of Tile Map entries at a given VRAM Address.

    @param x         X Start position in Map tile coordinates. Range 0 - 31
    @param y         Y Start position in Map tile coordinates. Range 0 - 31
    @param w         Width of area to set in tiles. Range 1 - 32
    @param h         Height of area to set in tiles.   Range 1 - 32
    @param vram_addr Pointer to destination VRAM Address
    @param tiles     Pointer to source Tile Map data

    Entries are copied from __tiles__ to Tile Map at address vram_addr starting at
    __x__, __y__ writing across for __w__ tiles and down for __h__ tiles.

    One byte per source tile map entry.

    There are two 32x30 Tile Maps in VRAM at addresses 2000h-23FFh and 2400h-27FFh.

    @see set_bkg_tiles
*/
void set_tiles(uint8_t x, uint8_t y, uint8_t w, uint8_t h, uint8_t *vram_addr, const uint8_t *tiles) NO_OVERLAY_LOCALS;

/** Sets VRAM Tile Pattern data starting from given base address
    without taking into account the state of PPUMASK.

    @see set_bkg_data, set_data
*/
inline void set_tile_data(uint16_t first_tile, uint8_t nb_tiles, const uint8_t *data) {
    if (first_tile < 256) {
        set_bkg_data(first_tile, nb_tiles, data);
        if(first_tile + nb_tiles > 256)
            set_sprite_data(first_tile - 256, nb_tiles, data);
    } else {
        set_sprite_data(first_tile - 256, nb_tiles, data);
    }
}

/** Sets VRAM Tile Pattern data for the Background in the native format

    @param first_tile  Index of the first tile to write
    @param nb_tiles    Number of tiles to write
    @param data        Pointer to source tile data

    Writes __nb_tiles__ tiles to VRAM starting at __first_tile__, tile data
    is sourced from __data__.

    @see set_tile_data
*/
void set_bkg_native_data(uint8_t first_tile, uint8_t nb_tiles, const uint8_t *data) NO_OVERLAY_LOCALS;

/** Sets VRAM Tile Pattern data for Sprites in the native format

    @param first_tile  Index of the first tile to write
    @param nb_tiles    Number of tiles to write
    @param data        Pointer to source tile data

    Writes __nb_tiles__ tiles to VRAM starting at __first_tile__, tile data
    is sourced from __data__.
*/
void set_sprite_native_data(uint8_t first_tile, uint8_t nb_tiles, const uint8_t *data) NO_OVERLAY_LOCALS;

/** Sets VRAM Tile Pattern data in the native format

    @param first_tile  Index of the first tile to write (0 - 511)
    @param nb_tiles    Number of tiles to write
    @param data        Pointer to source Tile Pattern data.

    When `first_tile` is larger than 256 on the GB/AP, it
    will write to sprite data instead of background data.

    The bit depth of the source Tile Pattern data depends
    on which console is being used:
    \li NES: loads 2bpp tiles data
 */
inline void set_native_tile_data(uint16_t first_tile, uint8_t nb_tiles, const uint8_t *data) {
    if (first_tile < 256) {
        set_bkg_native_data(first_tile, nb_tiles, data);
        if(first_tile + nb_tiles > 256)
            set_sprite_native_data(first_tile - 256, nb_tiles, data);
    } else {
        set_sprite_native_data(first_tile - 256, nb_tiles, data);
    }
}

/** Initializes the entire Background Tile Map with Tile Number __c__
    @param c   Tile number to fill with

    Note: This function avoids writes during modes 2 & 3
*/
void init_bkg(uint8_t c) NO_OVERLAY_LOCALS;

/** Fills the VRAM memory region __s__ of size __n__ with Tile Number __c__
    @param s   Start address in VRAM
    @param c   Tile number to fill with
    @param n   Size of memory region (in bytes) to fill

    Note: This function avoids writes during modes 2 & 3
*/
void vmemset (void *s, uint8_t c, size_t n) NO_OVERLAY_LOCALS;

/** Fills a rectangular region of Tile Map entries for the Background layer with tile.

    @param x      X Start position in Background Map tile coordinates. Range 0 - 31
    @param y      Y Start position in Background Map tile coordinates. Range 0 - 31
    @param w      Width of area to set in tiles. Range 0 - 31
    @param h      Height of area to set in tiles. Range 0 - 31
    @param tile   Fill value
*/
void fill_bkg_rect(uint8_t x, uint8_t y, uint8_t w, uint8_t h, uint8_t tile) NO_OVERLAY_LOCALS;
#define fill_rect fill_bkg_rect

/** "Flushes" the updates to the shadow attributes so they are written
    to the transfer buffer, and then written to PPU memory on next vblank.

    This function must be called to see visible changes to attributes
    on the NES target. But it will automatically be called by @ref vsync(),
    so the use-cases for calling it manually are rare in practice.
*/
void flush_shadow_attributes(void) NO_OVERLAY_LOCALS;

uint8_t _switch_prg0(uint8_t bank) NO_OVERLAY_LOCALS;

#endif /* _NES_H */
