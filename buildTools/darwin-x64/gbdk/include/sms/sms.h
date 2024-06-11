/** @file sms/sms.h
    SMS/GG specific functions.
*/
#ifndef _SMS_H
#define _SMS_H

#include <types.h>
#include <stdint.h>
#include <gbdk/version.h>
#include <sms/hardware.h>

#define SEGA

// Here NINTENDO means Game Boy & related clones
#ifdef NINTENDO
#undef NINTENDO
#endif

#ifdef NINTENDO_NES
#undef NINTENDO_NES
#endif

#ifdef MSX
#undef MSX
#endif

#if defined(__TARGET_sms)
#define MASTERSYSTEM
#elif defined(__TARGET_gg)
#define GAMEGEAR
#endif


extern const UBYTE _BIOS;

extern const uint8_t _SYSTEM;

#define SYSTEM_60HZ     0x00
#define SYSTEM_50HZ     0x01

#define VBK_REG VDP_ATTR_SHIFT

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
#define	J_UP         0b00000001
#define	J_DOWN       0b00000010
#define	J_LEFT       0b00000100
#define	J_RIGHT      0b00001000
#define	J_B          0b00010000
#define	J_A          0b00100000
#define	J_START      0b01000000
#define	J_SELECT     0b10000000

/** Screen modes.
    Normally used by internal functions only.
    @see mode()
 */
#define	M_TEXT_OUT   0x02U
#define	M_TEXT_INOUT 0x03U
/** Set this in addition to the others to disable scrolling

    If scrolling is disabled, the cursor returns to (0,0)
    @see mode()
*/
#define M_NO_SCROLL  0x04U
/** Set this to disable interpretation
    @see mode()
*/
#define M_NO_INTERP  0x08U

/** The nineth bit of the tile id
*/
#define S_BANK       0x01U
/** If set the background tile will be flipped horizontally.
 */
#define S_FLIPX      0x02U
/** If set the background tile will be flipped vertically.
 */
#define S_FLIPY      0x04U
/** If set the background tile palette.
 */
#define S_PALETTE    0x08U
/** If set the background tile priority.
 */
#define S_PRIORITY   0x10U
/** Dummy function used by other platforms.
    Required for the png2asset tool's metasprite output.
*/
#define S_PAL(n)     (((n) & 0x01U) << 3)

// VDP helper macros
#define __WRITE_VDP_REG_UNSAFE(REG, v) shadow_##REG=(v),VDP_CMD=(shadow_##REG),VDP_CMD=REG
#define __WRITE_VDP_REG(REG, v) shadow_##REG=(v);__asm__("di");VDP_CMD=(shadow_##REG);VDP_CMD=REG;__asm__("ei")
#define __READ_VDP_REG(REG) shadow_##REG

void WRITE_VDP_CMD(uint16_t cmd) Z88DK_FASTCALL PRESERVES_REGS(b, c, d, e, iyh, iyl);
void WRITE_VDP_DATA(uint16_t data) Z88DK_FASTCALL PRESERVES_REGS(b, c, d, e, iyh, iyl);

/** Set the current screen mode - one of M_* modes

    Normally used by internal functions only.

    @see M_TEXT_OUT, M_TEXT_INOUT, M_NO_SCROLL, M_NO_INTERP
*/
void mode(uint8_t m) OLDCALL;

/** Returns the current mode

    @see M_TEXT_OUT, M_TEXT_INOUT, M_NO_SCROLL, M_NO_INTERP
*/
uint8_t get_mode(void) OLDCALL;

/** Returns the system gbdk is running on.

*/
inline uint8_t get_system(void) {
    return _SYSTEM;
}

/* Interrupt flags */
/** Disable calling of interrupt service routines
 */
#define EMPTY_IFLAG  0x00U
/** VBlank Interrupt occurs at the start of the vertical blank.

    During this period the video ram may be freely accessed.
    @see set_interrupts(), @see add_VBL
 */
#define VBL_IFLAG    0x01U
/** LCD Interrupt when triggered by the STAT register.
    @see set_interrupts(), @see add_LCD
*/
#define LCD_IFLAG    0x02U
/** Does nothing on SMS/GG
 */
#define TIM_IFLAG    0x04U
/** Does nothing on SMS/GG
 */
#define SIO_IFLAG    0x08U
/** Does nothing on SMS/GG
 */
#define JOY_IFLAG    0x10U

void set_interrupts(uint8_t flags) Z88DK_FASTCALL;

/* Limits */
/** Width of the visible screen in pixels.
 */
#define SCREENWIDTH  DEVICE_SCREEN_PX_WIDTH
/** Height of the visible screen in pixels.
 */
#define SCREENHEIGHT DEVICE_SCREEN_PX_HEIGHT
/** The Minimum X position of the Window Layer (Left edge of screen) @see move_win()
 */
#define MINWNDPOSX   0x00U
/** The Minimum Y position of the Window Layer (Top edge of screen) @see move_win()
 */
#define MINWNDPOSY   0x00U
/** The Maximum X position of the Window Layer (Right edge of screen) @see move_win()
 */
#define MAXWNDPOSX   0x00U
/** The Maximum Y position of the Window Layer (Bottom edge of screen) @see move_win()
 */
#define MAXWNDPOSY   0x00U


/** Interrupt handlers
 */
typedef void (*int_handler)(void) NONBANKED;

/** Removes the VBL interrupt handler.
    @see add_VBL()
*/
void remove_VBL(int_handler h) Z88DK_FASTCALL PRESERVES_REGS(iyh, iyl);

/** Removes the LCD interrupt handler.
    @see add_LCD(), remove_VBL()
*/
void remove_LCD(int_handler h) Z88DK_FASTCALL PRESERVES_REGS(b, c, iyh, iyl);

void remove_TIM(int_handler h) Z88DK_FASTCALL;
void remove_SIO(int_handler h) Z88DK_FASTCALL;
void remove_JOY(int_handler h) Z88DK_FASTCALL;

/** Adds a V-blank interrupt handler.
*/
void add_VBL(int_handler h) Z88DK_FASTCALL PRESERVES_REGS(d, e, iyh, iyl);

/** Adds a LCD interrupt handler.
*/
void add_LCD(int_handler h) Z88DK_FASTCALL PRESERVES_REGS(b, c, iyh, iyl);

/** Does nothing on SMS/GG
 */
void add_TIM(int_handler h) Z88DK_FASTCALL;

/** Does nothing on SMS/GG
 */
void add_SIO(int_handler h) Z88DK_FASTCALL;

/** Does nothing on SMS/GG
 */
void add_JOY(int_handler h) Z88DK_FASTCALL;

/** Cancel pending interrupts
 */
inline uint8_t cancel_pending_interrupts(void) {
    return VDP_STATUS;
}

inline void move_bkg(uint8_t x, uint8_t y) {
	__WRITE_VDP_REG(VDP_RSCX, -x);
	__WRITE_VDP_REG(VDP_RSCY, y);
}

inline void scroll_bkg(int8_t x, int8_t y) {
	__WRITE_VDP_REG(VDP_RSCX, __READ_VDP_REG(VDP_RSCX) - x);
    int16_t tmp = __READ_VDP_REG(VDP_RSCY) + y;
	__WRITE_VDP_REG(VDP_RSCY, (tmp < 0) ? 224 + tmp : tmp % 224u);
}

/** HALTs the CPU and waits for the vertical blank interrupt.

    This is often used in main loops to idle the CPU at low power
    until it's time to start the next frame. It's also useful for
    syncing animation with the screen re-draw.

    Warning: If the VBL interrupt is disabled, this function will
    never return. If the screen is off this function returns
    immediately.
*/
void vsync(void) PRESERVES_REGS(b, c, d, e, h, l, iyh, iyl);

/** Obsolete. This function has been replaced by vsync(), which has identical behavior.
*/
void wait_vbl_done(void) PRESERVES_REGS(b, c, d, e, h, l, iyh, iyl);

/** Turns the display off.

    @see DISPLAY_ON
*/
inline void display_off(void) {
	__WRITE_VDP_REG(VDP_R1, __READ_VDP_REG(VDP_R1) &= (~R1_DISP_ON));
}

/** Turns the display back on.
    @see display_off, DISPLAY_OFF
*/
#define DISPLAY_ON \
	__WRITE_VDP_REG(VDP_R1, __READ_VDP_REG(VDP_R1) |= R1_DISP_ON)

/** Turns the display off immediately.
    @see display_off, DISPLAY_ON
*/
#define DISPLAY_OFF \
	display_off();

/** Copies data from shadow OAM to OAM
 */
void refresh_OAM(void);

/** Blanks leftmost column, so it is not garbaged when you use horizontal scroll
    @see SHOW_LEFT_COLUMN
*/
#define HIDE_LEFT_COLUMN \
	__WRITE_VDP_REG(VDP_R0, __READ_VDP_REG(VDP_R0) |= R0_LCB)

/** Shows leftmost column
    @see HIDE_LEFT_COLUMN
*/
#define SHOW_LEFT_COLUMN \
	__WRITE_VDP_REG(VDP_R0, __READ_VDP_REG(VDP_R0) &= (~R0_LCB))

/** Sets border color
 */
#define SET_BORDER_COLOR(C) __WRITE_VDP_REG(VDP_R7, ((C) | 0xf0u))

/** Turns on the background layer.
    Not yet implemented
*/
#define SHOW_BKG

/** Turns off the background layer.
    Not yet implemented
*/
#define HIDE_BKG

/** Turns on the window layer
    Not yet implemented
*/
#define SHOW_WIN

/** Turns off the window layer.
    Not yet implemented
*/
#define HIDE_WIN

/** Turns on the sprites layer.
*/
#define SHOW_SPRITES \
    (_sprites_OFF = 0)

/** Turns off the sprites layer.
*/
#define HIDE_SPRITES \
    (_sprites_OFF = 1)

/** Sets sprite size to 8x16 pixels, two tiles one above the other.
*/
#define SPRITES_8x16 \
	__WRITE_VDP_REG(VDP_R1, __READ_VDP_REG(VDP_R1) |= R1_SPR_8X16)

/** Sets sprite size to 8x8 pixels, one tile.
*/
#define SPRITES_8x8 \
	__WRITE_VDP_REG(VDP_R1, __READ_VDP_REG(VDP_R1) &= (~R1_SPR_8X16))

/** Macro returns TRUE if device supports color
 *  (it always does on SMS/GG)
 */
#define DEVICE_SUPPORTS_COLOR (TRUE)

/** Global Time Counter in VBL periods (60Hz)

    Increments once per Frame

    Will wrap around every ~18 minutes (unsigned 16 bits = 65535 / 60 / 60 = 18.2)
*/
extern volatile uint16_t sys_time;


/** Return R register for the DIV_REG emulation

    Increments once per CPU instruction (fetches the Z80 CPU R register)

*/
uint8_t get_r_reg(void) PRESERVES_REGS(b, c, d, e, h, l, iyh, iyl);

#define DIV_REG get_r_reg()

/** Tracks current active ROM bank in frame 1
*/
#define _current_bank MAP_FRAME1
#define CURRENT_BANK MAP_FRAME1

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


/** Makes switch the active ROM bank in frame 1
    @param b   ROM bank to switch to
*/

#define SWITCH_ROM(b) MAP_FRAME1=(b)
#define SWITCH_ROM1 SWITCH_ROM

/** Makes switch the active ROM bank in frame 2
    @param b   ROM bank to switch to
*/

#define SWITCH_ROM2(b) MAP_FRAME2=(b)

/** Switches RAM bank
    @param b   SRAM bank to switch to
*/

#define SWITCH_RAM(b) RAM_CONTROL=((b)&1)?RAM_CONTROL|RAMCTL_BANK:RAM_CONTROL&(~RAMCTL_BANK)

/** Enables RAM
*/

#define ENABLE_RAM RAM_CONTROL|=RAMCTL_RAM

/** Disables RAM
*/

#define DISABLE_RAM RAM_CONTROL&=(~RAMCTL_RAM)


/** Delays the given number of milliseconds.
    Uses no timers or interrupts, and can be called with
    interrupts disabled
 */
void delay(uint16_t d) Z88DK_FASTCALL;


/** Reads and returns the current state of the joypad.
*/
uint8_t joypad(void) OLDCALL PRESERVES_REGS(b, c, d, e, iyh, iyl);

/** Waits until at least one of the buttons given in mask are pressed.
*/
uint8_t waitpad(uint8_t mask) Z88DK_FASTCALL PRESERVES_REGS(d, e, iyh, iyl);

/** Waits for the directional pad and all buttons to be released.

    Note: Checks in a loop that doesn't HALT at all, so the CPU
    will be maxed out until this call returns.
*/
void waitpadup(void) PRESERVES_REGS(d, e, iyh, iyl);

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
    @param npads	number of joypads requested (1, 2 or 4)
    @param joypads	pointer to joypads_t structure to be initialized

    Only required for @ref joypad_ex, not required for calls to regular @ref joypad()
    @returns number of joypads avaliable
    @see joypad_ex(), joypads_t
*/
uint8_t joypad_init(uint8_t npads, joypads_t * joypads) Z88DK_CALLEE;

/** Polls all avaliable joypads
    @param joypads	pointer to joypads_t structure to be filled with joypad statuses,
    	   must be previously initialized with joypad_init()

    @see joypad_init(), joypads_t
*/
void joypad_ex(joypads_t * joypads) Z88DK_FASTCALL PRESERVES_REGS(iyh, iyl);

/** Enables unmasked interrupts

    @note Use @ref CRITICAL {...} instead for creating a block of
          of code which should execute with interrupts  temporarily
          turned off.

    @see disable_interrupts, set_interrupts, CRITICAL
*/
inline void enable_interrupts(void) PRESERVES_REGS(a, b, c, d, e, h, l, iyh, iyl) {
    __asm__("ei");
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
inline void disable_interrupts(void) PRESERVES_REGS(a, b, c, d, e, h, l, iyh, iyl) {
    __asm__("di");
}


#if defined(__TARGET_sms)

#define RGB(r,g,b)        ((r) | ((g) << 2) | ((b) << 4))
#define RGB8(r,g,b)       (((r) >> 6) | (((g) >> 6) << 2) | (((b) >> 6) << 4))
#define RGBHTML(RGB24bit) (((RGB24bit) >> 22) | ((((RGB24bit) & 0xFFFF) >> 14) << 2) | ((((RGB24bit) & 0xFF) >> 6) << 4))

/** Common colors based on the EGA default palette.
 */
#define RGB_RED        RGB( 3,  0,  0)
#define RGB_DARKRED    RGB( 2,  0,  0)
#define RGB_GREEN      RGB( 0,  3,  0)
#define RGB_DARKGREEN  RGB( 0,  2,  0)
#define RGB_BLUE       RGB( 0,  0,  3)
#define RGB_DARKBLUE   RGB( 0,  0,  2)
#define RGB_YELLOW     RGB( 3,  3,  0)
#define RGB_DARKYELLOW RGB( 2,  2,  0)
#define RGB_CYAN       RGB( 0,  3,  3)
#define RGB_AQUA       RGB( 3,  1,  2)
#define RGB_PINK       RGB( 3,  0,  3)
#define RGB_PURPLE     RGB( 2,  0,  2)
#define RGB_BLACK      RGB( 0,  0,  0)
#define RGB_DARKGRAY   RGB( 1,  1,  1)
#define RGB_LIGHTGRAY  RGB( 2,  2,  2)
#define RGB_WHITE      RGB( 3,  3,  3)

typedef uint8_t palette_color_t;

#elif defined(__TARGET_gg)

#define RGB(r,g,b)        ((uint16_t)(r) | (uint16_t)((g) << 4) | (uint16_t)((b) << 8))
#define RGB8(r,g,b)       ((uint16_t)((r) >> 4) | ((uint16_t)((g) >> 4) << 4) | ((uint16_t)((b) >> 4) << 8))
#define RGBHTML(RGB24bit) (((RGB24bit) >> 20) | ((((RGB24bit) & 0xFFFF) >> 12) << 4)|((((RGB24bit) & 0xFF) >> 4) << 8))

/** Common colors based on the EGA default palette.
 */
#define RGB_RED        RGB(15,  0,  0)
#define RGB_DARKRED    RGB( 7,  0,  0)
#define RGB_GREEN      RGB( 0, 15,  0)
#define RGB_DARKGREEN  RGB( 0,  7,  0)
#define RGB_BLUE       RGB( 0,  0, 15)
#define RGB_DARKBLUE   RGB( 0,  0,  7)
#define RGB_YELLOW     RGB(15, 15,  0)
#define RGB_DARKYELLOW RGB( 7,  7,  0)
#define RGB_CYAN       RGB( 0, 15, 15)
#define RGB_AQUA       RGB(14,  2, 11)
#define RGB_PINK       RGB(15,  0, 15)
#define RGB_PURPLE     RGB(10,  0, 10)
#define RGB_BLACK      RGB( 0,  0,  0)
#define RGB_DARKGRAY   RGB( 5,  5,  5)
#define RGB_LIGHTGRAY  RGB(10, 10, 10)
#define RGB_WHITE      RGB(15, 15, 15)

#define RGB_LIGHTFLESH RGB(15, 10,  7)
#define RGB_BROWN      RGB( 5,  5,  0)
#define RGB_ORANGE     RGB(15, 10,  0)
#define RGB_TEAL       RGB( 7,  7,  0)

typedef uint16_t palette_color_t;

#else
#error Unrecognized port
#endif

void set_default_palette(void);
inline void cgb_compatibility(void) {
    set_default_palette();
}

inline void cpu_fast(void) {}

void set_palette_entry(uint8_t palette, uint8_t entry, uint16_t rgb_data) Z88DK_CALLEE PRESERVES_REGS(iyh, iyl);
#define set_bkg_palette_entry set_palette_entry
#define set_sprite_palette_entry(palette,entry,rgb_data) set_palette_entry(1,entry,rgb_data)


/** Set color palette(s)

    @param first_palette  Index of the first 16 color palette to write (0-1)
    @param nb_palettes    Number of palettes to write (1-2, max depends on first_palette)
    @param rgb_data       Pointer to source palette data

    Writes __nb_palettes__ to palette data starting
    at __first_palette__, Palette data is sourced from __rgb_data__.

    \li Palette 0 can be used for the Background.
    \li Palette 1 is shared between Background and Sprites.

    On the Game Gear
    \li Each Palette is 32 bytes in size: 16 colors x 2 bytes per palette color entry.
    \li Each color (16 per palette) is packed as BGR-444 format (x:4:4:4, MSBits [15..12] are unused).
    \li Each component (R, G, B) may have values from 0 - 15 (4 bits), 15 is brightest.

    On the SMS
    \li On SMS each Palette is 16 bytes in size: 16 colors x 1 byte per palette color entry.
    \li Each color (16 per palette) is packed as BGR-222 format (x:2:2:2, MSBits [7..6] are unused).
    \li Each component (R, G, B) may have values from 0 - 3 (2 bits), 3 is brightest.

    @see RGB(), set_sprite_palette(), set_bkg_palette(), set_palette_entry(), set_sprite_palette_entry(), set_bkg_palette_entry(), set_sprite_palette()
*/
void set_palette(uint8_t first_palette, uint8_t nb_palettes, const palette_color_t *rgb_data) Z88DK_CALLEE;
#define set_bkg_palette set_palette
#define set_sprite_palette(first_palette,nb_palettes,rgb_data) set_palette(1,1,rgb_data)

void set_native_tile_data(uint16_t start, uint16_t ntiles, const void *src) PRESERVES_REGS(iyh, iyl);
void set_bkg_4bpp_data(uint16_t start, uint16_t ntiles, const void *src) PRESERVES_REGS(iyh, iyl);
void set_bkg_native_data(uint16_t start, uint16_t ntiles, const void *src) PRESERVES_REGS(iyh, iyl);

void set_sprite_4bpp_data(uint8_t start, uint16_t ntiles, const void *src) PRESERVES_REGS(iyh, iyl);
void set_sprite_native_data(uint8_t start, uint16_t ntiles, const void *src) PRESERVES_REGS(iyh, iyl);

#define COMPAT_PALETTE(C0,C1,C2,C3) (((uint16_t)(C3) << 12) | ((uint16_t)(C2) << 8) | ((uint16_t)(C1) << 4) | (uint16_t)(C0))
extern uint16_t _current_2bpp_palette;
inline void set_2bpp_palette(uint16_t palette) {
    _current_2bpp_palette = palette;
}
void set_tile_2bpp_data(uint16_t start, uint16_t ntiles, const void *src, uint16_t palette) Z88DK_CALLEE PRESERVES_REGS(iyh, iyl);
inline void set_bkg_data(uint16_t start, uint16_t ntiles, const void *src) {
    set_tile_2bpp_data(start, ntiles, src, _current_2bpp_palette);
}
inline void set_sprite_data(uint16_t start, uint16_t ntiles, const void *src) {
    set_tile_2bpp_data((uint8_t)(start) + 0x100u, ntiles, src, _current_2bpp_palette);
}
inline void set_bkg_2bpp_data(uint16_t start, uint16_t ntiles, const void *src) {
    set_tile_2bpp_data(start, ntiles, src, _current_2bpp_palette);
}
inline void set_sprite_2bpp_data(uint16_t start, uint16_t ntiles, const void *src) {
    set_tile_2bpp_data((uint8_t)(start) + 0x100u, ntiles, src, _current_2bpp_palette);
}

extern uint16_t _current_1bpp_colors;
inline void set_1bpp_colors(uint8_t fgcolor, uint8_t bgcolor) {
    _current_1bpp_colors = ((uint16_t)bgcolor << 8) | fgcolor;
}
void set_tile_1bpp_data(uint16_t start, uint16_t ntiles, const void *src, uint16_t colors) Z88DK_CALLEE PRESERVES_REGS(iyh, iyl);
inline void set_bkg_1bpp_data(uint16_t start, uint16_t ntiles, const void *src) {
    set_tile_1bpp_data(start, ntiles, src, _current_1bpp_colors);
}
inline void set_sprite_1bpp_data(uint16_t start, uint16_t ntiles, const void *src) {
    set_tile_1bpp_data((uint8_t)(start) + 0x100u, ntiles, src, _current_1bpp_colors);
}


/** Copies arbitrary data to an address in VRAM

    @param dst       destination VRAM Address
    @param src       Pointer to source buffer
    @param size      Number of bytes to copy

    Copies __size__ bytes from a buffer at _src__ to VRAM starting at __dst__.
*/
void set_data(uint16_t dst, const void *src, uint16_t size) Z88DK_CALLEE PRESERVES_REGS(iyh, iyl);
void vmemcpy(uint16_t dst, const void *src, uint16_t size) Z88DK_CALLEE PRESERVES_REGS(iyh, iyl);

void set_tile_map(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *tiles) Z88DK_CALLEE;
void set_tile_map_compat(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *tiles) Z88DK_CALLEE;
#define set_bkg_tiles set_tile_map_compat
#define set_win_tiles set_tile_map_compat

extern uint8_t _map_tile_offset;
inline void set_bkg_based_tiles(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *tiles, uint8_t base_tile) {
    _map_tile_offset = base_tile;
    set_tile_map_compat(x, y, w, h, tiles);
    _map_tile_offset = 0;
}
inline void set_win_based_tiles(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *tiles, uint8_t base_tile) {
    _map_tile_offset = base_tile;
    set_tile_map_compat(x, y, w, h, tiles);
    _map_tile_offset = 0;
}

inline void set_bkg_attributes(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *tiles)
{
    VBK_REG = VBK_ATTRIBUTES;
    set_bkg_tiles(x, y, w, h, tiles);
    VBK_REG = VBK_TILES;
}

void set_tile_submap(uint8_t x, uint8_t y, uint8_t w, uint8_t h, uint8_t map_w, const uint8_t *map) Z88DK_CALLEE;
void set_tile_submap_compat(uint8_t x, uint8_t y, uint8_t w, uint8_t h, uint8_t map_w, const uint8_t *map) Z88DK_CALLEE;
inline void set_bkg_submap(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *map, uint8_t map_w) {
    set_tile_submap_compat(x, y, w, h, map_w, map);
}
inline void set_win_submap(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *map, uint8_t map_w) {
    set_tile_submap_compat(x, y, w, h, map_w, map);
}

extern uint8_t _submap_tile_offset;
inline void set_bkg_based_submap(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *map, uint8_t map_w, uint8_t base_tile) {
    _submap_tile_offset = base_tile;
    set_tile_submap_compat(x, y, w, h, map_w, map);
    _submap_tile_offset = 0;
}
inline void set_win_based_submap(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *map, uint8_t map_w, uint8_t base_tile) {
    _submap_tile_offset = base_tile;
    set_tile_submap_compat(x, y, w, h, map_w, map);
    _submap_tile_offset = 0;
}

inline void set_bkg_submap_attributes(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *map, uint8_t map_w)
{
    VBK_REG = VBK_ATTRIBUTES;
    set_bkg_submap(x, y, w, h, map, map_w);
    VBK_REG = VBK_TILES;
}

void fill_rect(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint16_t tile) Z88DK_CALLEE;
void fill_rect_compat(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint16_t tile) Z88DK_CALLEE;
#define fill_bkg_rect fill_rect_compat
#define fill_win_rect fill_rect_compat

/** Shadow OAM array in WRAM, that is transferred into the real OAM each VBlank
*/
extern volatile uint8_t shadow_OAM[];

/** MSB of shadow_OAM address is used by OAM copying routine
*/
extern volatile uint8_t _shadow_OAM_base;

/** Flag for disabling of OAM copying routine

    Values:
    \li 1: OAM copy routine is disabled (non-isr VDP operation may be in progress)
    \li 0: OAM copy routine is enabled

    This flag is modified by all sms/gg GBDK API calls that write to the VDP.
    It is set to DISABLED when they start and ENABLED when they complete.

    @note It is recommended to avoid writing to the Video Display Processor
    (VDP) during an interrupt service routine (ISR) since it can corrupt
    the VDP pointer of an VDP operation already in progress.

    If it is necessary, this flag can be used during an ISR to determine
    whether a VDP operation is already in progress. If the value is `1`
    then avoid writing to the VDP (tiles, map, scrolling, colors, etc).

    \code{.c}
    // at the beginning of and ISR that would write to the VDP
    if (_shadow_OAM_OFF) return;
    \endcode

    @see @ref docs_consoles_safe_display_controller_access
*/
extern volatile uint8_t _shadow_OAM_OFF;

extern volatile uint8_t _sprites_OFF;

/** Disable shadow OAM to VRAM copy on each VBlank
*/
#define DISABLE_VBL_TRANSFER \
    _shadow_OAM_base = 0

/** Enable shadow OAM to VRAM copy on each VBlank
*/
#define ENABLE_VBL_TRANSFER \
    _shadow_OAM_base = (uint8_t)((uint16_t)&shadow_OAM >> 8)

/** Amount of hardware sprites in OAM
*/
#define MAX_HARDWARE_SPRITES 64

/** True if sprite hardware can flip sprites by X (horizontally)
*/
#define HARDWARE_SPRITE_CAN_FLIP_X 0

/** True if sprite hardware can flip sprites by Y (vertically)
*/
#define HARDWARE_SPRITE_CAN_FLIP_Y 0

/** Sets address of 256-byte aligned array of shadow OAM to be transferred on each VBlank
*/
inline void SET_SHADOW_OAM_ADDRESS(void * address) {
    _shadow_OAM_base = (uint8_t)((uint16_t)address >> 8);
}

/** Sets sprite number __nb__in the OAM to display tile number __tile__.

    @param nb    Sprite number, range 0 - 39
    @param tile  Selects a tile (0 - 255) from memory at 8000h - 8FFFh
                 \n In CGB Mode this could be either in VRAM Bank
                 \n 0 or 1, depending on Bit 3 of the OAM Attribute Flag
                 \n (see @ref set_sprite_prop)

    In 8x16 mode:
    \li The sprite will also display the next tile (__tile__ + 1)
        directly below (y + 8) the first tile.
    \li The lower bit of the tile number is ignored:
        the upper 8x8 tile is (__tile__ & 0xFE), and
        the lower 8x8 tile is (__tile__ | 0x01).
    \li See: @ref SPRITES_8x16
*/
inline void set_sprite_tile(uint8_t nb, uint8_t tile) {
    shadow_OAM[0x41+(nb << 1)] = tile;
}


/** Returns the tile number of sprite number __nb__ in the OAM.

@param nb    Sprite number, range 0 - 39

@see set_sprite_tile for more details
*/
inline uint8_t get_sprite_tile(uint8_t nb) {
    return shadow_OAM[0x41+(nb << 1)];
}

/** Function has no affect on sms.

  This function is only here to enable game portability
*/

inline void set_sprite_prop(uint8_t nb, uint8_t prop) {
    nb; prop;
}

inline uint8_t get_sprite_prop(uint8_t nb) {
    nb;
    return 0;
}

/** Moves sprite number __nb__ to the __x__, __y__ position on the screen.

    @param nb  Sprite number, range 0 - 39
    @param x   X Position. Specifies the sprites horizontal position on the screen (minus 8).
               \n An offscreen value (X=0 or X>=168) hides the sprite, but the sprite
               still affects the priority ordering - a better way to hide a sprite is to set
               its Y-coordinate offscreen.
    @param y   Y Position. Specifies the sprites vertical position on the screen (minus 16).
               \n An offscreen value (for example, Y=0 or Y>=160) hides the sprite.

    Moving the sprite to 0,0 (or similar off-screen location) will hide it.
*/
inline void move_sprite(uint8_t nb, uint8_t x, uint8_t y) {
    shadow_OAM[nb] = (y < VDP_SAT_TERM) ? y : 0xC0;
    shadow_OAM[0x40+(nb << 1)] = x;
}


/** Moves sprite number __nb__ relative to its current position.

    @param nb  Sprite number, range 0 - 39
    @param x   Number of pixels to move the sprite on the __X axis__
               \n Range: -128 - 127
    @param y   Number of pixels to move the sprite on the __Y axis__
               \n Range: -128 - 127

    @see move_sprite for more details about the X and Y position
 */
inline void scroll_sprite(uint8_t nb, int8_t x, int8_t y) {
    uint8_t new_y = shadow_OAM[nb] + y;
    shadow_OAM[nb] = (new_y < VDP_SAT_TERM) ? new_y : 0xC0;
    shadow_OAM[0x40+(nb << 1)] += x;
}


/** Hides sprite number __nb__ by moving it to zero position by Y.

    @param nb  Sprite number, range 0 - 39
 */
inline void hide_sprite(uint8_t nb) {
    shadow_OAM[nb] = 0xC0;
}

/**
 * Set byte in vram at given memory location
 *
 * @param addr address to write to
 * @param v value
 */
void set_vram_byte(uint8_t * addr, uint8_t v) Z88DK_CALLEE PRESERVES_REGS(iyh, iyl);

/**
 * Set single tile t with attributes on background layer at x,y
 * @param x X-coordinate
 * @param y Y-coordinate
 * @param t tile index
 * @return returns the address of tile, so you may use faster set_vram_byte() later
 */
uint8_t * set_attributed_tile_xy(uint8_t x, uint8_t y, uint16_t t) Z88DK_CALLEE PRESERVES_REGS(iyh, iyl);

/**
 * Set single tile t on background layer at x,y
 * @param x X-coordinate
 * @param y Y-coordinate
 * @param t tile index
 * @return returns the address of tile, so you may use faster set_vram_byte() later
 */
uint8_t * set_tile_xy(uint8_t x, uint8_t y, uint8_t t) Z88DK_CALLEE PRESERVES_REGS(iyh, iyl);
#define set_bkg_tile_xy set_tile_xy
#define set_win_tile_xy set_tile_xy

/**
 * Set single attribute data a on background layer at x,y
 * @param x X-coordinate
 * @param y Y-coordinate
 * @param a tile attributes
 * @return returns the address of tile attribute, so you may use faster set_vram_byte() later
 */
inline uint8_t * set_attribute_xy(uint8_t x, uint8_t y, uint8_t a) Z88DK_CALLEE PRESERVES_REGS(iyh, iyl);
#define set_bkg_attribute_xy set_attribute_xy
#define set_win_attribute_xy set_attribute_xy

/**
 * Get address of X,Y tile of background map
 */
uint8_t * get_bkg_xy_addr(uint8_t x, uint8_t y) Z88DK_CALLEE PRESERVES_REGS(iyh, iyl);
#define get_win_xy_addr get_bkg_xy_addr

#endif /* _SMS_H */
