/** @file gb/gb.h
    Gameboy specific functions.
*/
#ifndef _GB_H
#define _GB_H

#define __GBDK_VERSION 404

#include <types.h>
#include <stdint.h>
#include <gb/hardware.h>

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
#define	J_START      0x80U
#define	J_SELECT     0x40U
#define	J_B          0x20U
#define	J_A          0x10U
#define	J_DOWN       0x08U
#define	J_UP         0x04U
#define	J_LEFT       0x02U
#define	J_RIGHT      0x01U

/** Screen modes.
    Normally used by internal functions only.
    @see mode()
 */
#define	M_DRAWING    0x01U
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

/** If this is set, sprite colours come from OBJ1PAL. Else
    they come from OBJ0PAL
    @see set_sprite_prop().
*/
#define S_PALETTE    0x10U
/** If set the sprite will be flipped horizontally.
    @see set_sprite_prop()
 */
#define S_FLIPX      0x20U
/** If set the sprite will be flipped vertically.
    @see set_sprite_prop()
 */
#define S_FLIPY      0x40U
/** If this bit is clear, then the sprite will be displayed
    on top of the background and window.
    @see set_sprite_prop()
*/
#define S_PRIORITY   0x80U

/* Interrupt flags */
/** VBlank Interrupt occurs at the start of the vertical blank.

    During this period the video ram may be freely accessed.
    @see set_interrupts(), @see add_VBL
 */
#define VBL_IFLAG    0x01U
/** LCD Interrupt when triggered by the STAT register.
    @see set_interrupts(), @see add_LCD
*/
#define LCD_IFLAG    0x02U
/** Timer Interrupt when the timer @ref TIMA_REG overflows.
    @see set_interrupts(), @see add_TIM
 */
#define TIM_IFLAG    0x04U
/** Serial Link Interrupt occurs when the serial transfer has completed.
    @see set_interrupts(), @see add_SIO
 */
#define SIO_IFLAG    0x08U
/** Joypad Interrupt occurs on a transition of the keypad.
    @see set_interrupts(), @see add_JOY
 */
#define JOY_IFLAG    0x10U

/* Limits */
/** Width of the visible screen in pixels.
 */
#define SCREENWIDTH  0xA0U
/** Height of the visible screen in pixels.
 */
#define SCREENHEIGHT 0x90U
/** The Minimum X position of the Window Layer (Left edge of screen) @see move_win()
 */
#define MINWNDPOSX   0x07U
/** The Minimum Y position of the Window Layer (Top edge of screen) @see move_win()
 */
#define MINWNDPOSY   0x00U
/** The Maximum X position of the Window Layer (Right edge of screen) @see move_win()
 */
#define MAXWNDPOSX   0xA6U
/** The Maximum Y position of the Window Layer (Bottom edge of screen) @see move_win()
 */
#define MAXWNDPOSY   0x8FU


/** Interrupt handlers
 */
typedef void (*int_handler)(void) NONBANKED;

/** The remove functions will remove any interrupt handler.

   A handler of NULL will cause bad things
   to happen if the given interrupt is enabled.

   Removes the VBL interrupt handler. @see add_VBL()
*/
void remove_VBL(int_handler h) NONBANKED;

/** Removes the LCD interrupt handler.
    @see add_LCD(), remove_VBL()
*/
void remove_LCD(int_handler h) NONBANKED;

/** Removes the TIM interrupt handler.
    @see add_TIM(), remove_VBL()
*/
void remove_TIM(int_handler h) NONBANKED;

/** Removes the Serial Link / SIO interrupt handler.
   @see add_SIO(), @see remove_VBL()

    The default SIO ISR gets installed automatically if
    any of the standard SIO calls are used. These calls
    include @ref add_SIO(), @ref remove_SIO(),
    @ref send_byte(), @ref receive_byte().

    The default SIO ISR cannot be removed once installed.
    Only secondary chained SIO ISRs (added with @ref add_SIO() )
    can be removed.
*/
void remove_SIO(int_handler h) NONBANKED;

/** Removes the JOY interrupt handler.
    @see add_JOY(), remove_VBL()
*/
void remove_JOY(int_handler h) NONBANKED;

/** Adds a V-blank interrupt handler.

    @param h  The handler to be called whenever a V-blank
    interrupt occurs.

    Up to 4 handlers may be added, with the last added being
    called last.  If the @ref remove_VBL function is to be called,
    only three may be added.

    Note: The default VBL is installed automatically.
*/
void add_VBL(int_handler h) NONBANKED;

/** Adds a LCD interrupt handler.

    Called when the LCD interrupt occurs, which is normally
    when @ref LY_REG == @ref LYC_REG.

    From pan/k0Pa:
    There are various reasons for this interrupt to occur
    as described by the @ref STAT_REG register ($FF41). One very
    popular reason is to indicate to the user when the
    video hardware is about to redraw a given LCD line.
    This can be useful for dynamically controlling the
    @ref SCX_REG / @ref SCY_REG registers ($FF43/$FF42) to perform
    special video effects.

    @see add_VBL
*/
void add_LCD(int_handler h) NONBANKED;

/** Adds a timer interrupt handler.

    From pan/k0Pa:
    This interrupt occurs when the @ref TIMA_REG
    register ($FF05) changes from $FF to $00.

    @see add_VBL
    @see set_interrupts() with TIM_IFLAG
*/
void add_TIM(int_handler h) NONBANKED;


/** Adds a Serial Link transmit complete interrupt handler.

    From pan/k0Pa:
    This interrupt occurs when a serial transfer has
    completed on the game link port.

    @see send_byte, receive_byte(), add_VBL()
    @see set_interrupts() with SIO_IFLAG
*/
void add_SIO(int_handler h) NONBANKED;


/** Adds a joypad button change interrupt handler.

    From pan/k0Pa:
    This interrupt occurs on a transition of any of the
    keypad input lines from high to low. Due to the fact
    that keypad "bounce" is virtually always present,
    software should expect this interrupt to occur one
    or more times for every button press and one or more
    times for every button release.



    @see joypad()
*/
void add_JOY(int_handler h) NONBANKED;


/** Interrupt handler chain terminator that does __not__ wait for .STAT

    You must add this handler last in every interrupt handler
    chain if you want to change the default interrupt handler
    behaviour that waits for LCD controller mode to become 1 or 0
    before return from the interrupt.

    Example:
    \code{.c}
    __critical {
        add_SIO(nowait_int_handler); // Disable wait on VRAM state before returning from SIO interrupt
    }
    \endcode
    @see wait_int_handler()
*/
void nowait_int_handler(void) NONBANKED;


/** Default Interrupt handler chain terminator that waits for
    @see STAT_REG and __only__ returns at the BEGINNING of
    either Mode 0 or Mode 1.

    Used by default at the end of interrupt chains to help
    prevent graphical glitches. The glitches are caused when an
    ISR interrupts a graphics operation in one mode but returns
    in a different mode for which that graphics operation is not
    allowed.

    @see nowait_int_handler()
*/
void wait_int_handler(void) NONBANKED;



/** Set the current screen mode - one of M_* modes

    Normally used by internal functions only.

    @see M_DRAWING, M_TEXT_OUT, M_TEXT_INOUT, M_NO_SCROLL, M_NO_INTERP
*/
void mode(uint8_t m) NONBANKED;

/** Returns the current mode

    @see M_DRAWING, M_TEXT_OUT, M_TEXT_INOUT, M_NO_SCROLL, M_NO_INTERP
*/
uint8_t get_mode(void) NONBANKED __preserves_regs(b, c);

/** GB CPU type

    @see DMG_TYPE, MGB_TYPE, CGB_TYPE, cpu_fast(), cpu_slow()
*/
extern uint8_t _cpu;

/** Hardware Model: Original GB or Super GB. @see _cpu
*/
#define DMG_TYPE 0x01
/** Hardware Model: Pocket GB or Super GB 2. @see _cpu
*/
#define MGB_TYPE 0xFF
/** Hardware Model: Color GB. @see _cpu
*/
#define CGB_TYPE 0x11

/** Global Time Counter in VBL periods (60Hz)

    Increments once per Frame

    Will wrap around every ~18 minutes (unsigned 16 bits = 65535 / 60 / 60 = 18.2)
*/
extern volatile uint16_t sys_time;



/** Serial Link: Send the byte in @ref _io_out out through the serial port

    Make sure to enable interrupts for the
    Serial Link before trying to transfer data.
    @see add_SIO(), remove_SIO()
    @see set_interrupts() with @ref SIO_IFLAG
*/
void send_byte(void);

/** Serial Link: Receive a byte from the serial port into @ref _io_in

    Make sure to enable interrupts for the
    Serial Link before trying to transfer data.
    @see add_SIO(), remove_SIO()
    @see set_interrupts() with @ref SIO_IFLAG
*/
void receive_byte(void);

/** Serial Link: Current IO Status. An OR of IO_* */
extern volatile uint8_t _io_status;

/** Serial Link: Byte just read after calling @ref receive_byte()
*/
extern volatile uint8_t _io_in;

/** Serial Link: Write byte to send here before calling @ref send_byte()
*/
extern volatile uint8_t _io_out;

/* Status codes */
/** Serial Link IO is completed */
#define IO_IDLE		0x00U
/** Serial Link Sending data */
#define IO_SENDING	0x01U
/** Serial Link Receiving data */
#define IO_RECEIVING	0x02U
/** Serial Link Error */
#define IO_ERROR	0x04U



/** Tracks current active ROM bank @see SWITCH_ROM_MBC1(), SWITCH_ROM_MBC5()
    This variable is updated automatically when you call SWITCH_ROM_MBC1 or
    SWITCH_ROM_MBC5, or call a BANKED function.
*/
__REG _current_bank;

/** Makes MBC1 and other compatible MBCs switch the active ROM bank
    @param b   ROM bank to switch to
*/
#define SWITCH_ROM_MBC1(b) \
  _current_bank = (b), *(uint8_t *)0x2000 = (b)

/** Switches SRAM bank on MBC1 and other compaticle MBCs
    @param b   SRAM bank to switch to
*/
#define SWITCH_RAM_MBC1(b) \
  *(uint8_t *)0x4000 = (b)

/** Enables SRAM on MBC1
*/
#define ENABLE_RAM_MBC1 \
  *(uint8_t *)0x0000 = 0x0A

/** Disables SRAM on MBC1
*/
#define DISABLE_RAM_MBC1 \
  *(uint8_t *)0x0000 = 0x00

#define SWITCH_16_8_MODE_MBC1 \
  *(uint8_t *)0x6000 = 0x00

#define SWITCH_4_32_MODE_MBC1 \
  *(uint8_t *)0x6000 = 0x01

/** Makes MBC5 switch to the active ROM bank; only 4M roms are supported, @see SWITCH_ROM_MBC5_8M()
    @param b   ROM bank to switch to

    Note the order used here. Writing the other way around on a MBC1 always selects bank 1
*/
#define SWITCH_ROM_MBC5(b) \
  _current_bank = (b), \
  *(uint8_t *)0x3000 = 0, \
  *(uint8_t *)0x2000 = (b)

/** Makes MBC5 to switch the active ROM bank; active bank number is not tracked by _current_bank if you use this macro
    @see _current_bank
    @param b   ROM bank to switch to

    Note the order used here. Writing the other way around on a MBC1 always selects bank 1
*/
#define SWITCH_ROM_MBC5_8M(b) \
  *(uint8_t *)0x3000 = ((uint16_t)(b) >> 8), \
  *(uint8_t *)0x2000 = (b)

/** Switches SRAM bank on MBC5
    @param b   SRAM bank to switch to
*/
#define SWITCH_RAM_MBC5(b) \
  *(uint8_t *)0x4000 = (b)

/** Enables SRAM on MBC5
*/
#define ENABLE_RAM_MBC5 \
  *(uint8_t *)0x0000 = 0x0A

/** Disables SRAM on MBC5
*/
#define DISABLE_RAM_MBC5 \
  *(uint8_t *)0x0000 = 0x00



/** Delays the given number of milliseconds.
    Uses no timers or interrupts, and can be called with
    interrupts disabled (why nobody knows :)
 */
void delay(uint16_t d) NONBANKED;



/** Reads and returns the current state of the joypad.
    Follows Nintendo's guidelines for reading the pad.
    Return value is an OR of J_*

    When testing for multiple different buttons, it's
    best to read the joypad state *once* into a variable
    and then test using that variable.

    @see J_START, J_SELECT, J_A, J_B, J_UP, J_DOWN, J_LEFT, J_RIGHT
*/
uint8_t joypad(void) NONBANKED __preserves_regs(b, c, h, l);

/** Waits until at least one of the buttons given in mask are pressed.

    @param mask Bitmask indicating which buttons to wait for

    Normally only used for checking one key, but it will
    support many, even J_LEFT at the same time as J_RIGHT. :)

    Note: Checks in a loop that doesn't HALT at all, so the CPU
    will be maxed out until this call returns.
    @see joypad
    @see J_START, J_SELECT, J_A, J_B, J_UP, J_DOWN, J_LEFT, J_RIGHT
*/
uint8_t waitpad(uint8_t mask) NONBANKED __preserves_regs(b, c);

/** Waits for the directional pad and all buttons to be released.

    Note: Checks in a loop that doesn't HALT at all, so the CPU
    will be maxed out until this call returns.
*/
void waitpadup(void) NONBANKED __preserves_regs(a, b, c, d, e, h, l);

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
    (for the GB and ones connected via SGB)
    @param npads	number of joypads requested (1, 2 or 4)
    @param joypads	pointer to joypads_t structure to be initialized

    Only required for @ref joypad_ex, not required for calls to regular @ref joypad()
    @returns number of joypads avaliable
    @see joypad_ex(), joypads_t
*/
uint8_t joypad_init(uint8_t npads, joypads_t * joypads);

/** Polls all avaliable joypads (for the GB and ones connected via SGB)
    @param joypads	pointer to joypads_t structure to be filled with joypad statuses,
    	   must be previously initialized with joypad_init()

    @see joypad_init(), joypads_t
*/
void joypad_ex(joypads_t * joypads) __preserves_regs(b, c);



/** Enables unmasked interrupts
    @see disable_interrupts, set_interrupts
*/
void enable_interrupts(void) NONBANKED __preserves_regs(a, b, c, d, e, h, l);

/** Disables interrupts.

    This function may be called as many times as you like;
    however the first call to enable_interrupts will re-enable
    them.
    @see enable_interrupts, set_interrupts
*/
void disable_interrupts(void) NONBANKED __preserves_regs(a, b, c, d, e, h, l);

/** Clears any pending interrupts and sets the interrupt mask
    register IO to flags.
    @param flags	A logical OR of *_IFLAGS
    @see enable_interrupts(), disable_interrupts()
    @see VBL_IFLAG, LCD_IFLAG, TIM_IFLAG, SIO_IFLAG, JOY_IFLAG
*/
void set_interrupts(uint8_t flags) NONBANKED __preserves_regs(b, c, d, e);

/** Performs a warm reset by reloading the CPU value
    then jumping to the start of crt0 (0x0150)
*/
void reset(void) NONBANKED;

/** HALTs the CPU and waits for the vertical blank interrupt (VBL) to finish.

    This is often used in main loops to idle the CPU at low power
    until it's time to start the next frame. It's also useful for
    syncing animation with the screen re-draw.

    Warning: If the VBL interrupt is disabled, this function will
    never return. If the screen is off this function returns
    immediately.
*/
void wait_vbl_done(void) NONBANKED __preserves_regs(b, c, d, e, h, l);

/** Turns the display off.

    Waits until the VBL interrupt before turning the display off.
    @see DISPLAY_ON
*/
void display_off(void) NONBANKED __preserves_regs(b, c, d, e, h, l);



/** Copies data from somewhere in the lower address space to part of hi-ram.
    @param dst		Offset in high ram (0xFF00 and above) to copy to.
    @param src		Area to copy from
    @param n		Number of bytes to copy.
*/
void hiramcpy(uint8_t dst,
          const void *src,
          uint8_t n) NONBANKED __preserves_regs(b, c);



/** Turns the display back on.
    @see display_off, DISPLAY_OFF
*/
#define DISPLAY_ON \
  LCDC_REG|=0x80U

/** Turns the display off immediately.
    @see display_off, DISPLAY_ON
*/
#define DISPLAY_OFF \
  display_off();

/** Turns on the background layer.
    Sets bit 0 of the LCDC register to 1.
*/
#define SHOW_BKG \
  LCDC_REG|=0x01U

/** Turns off the background layer.
    Sets bit 0 of the LCDC register to 0.
*/
#define HIDE_BKG \
  LCDC_REG&=0xFEU

/** Turns on the window layer
    Sets bit 5 of the LCDC register to 1.
*/
#define SHOW_WIN \
  LCDC_REG|=0x20U

/** Turns off the window layer.
    Clears bit 5 of the LCDC register to 0.
*/
#define HIDE_WIN \
  LCDC_REG&=0xDFU

/** Turns on the sprites layer.
    Sets bit 1 of the LCDC register to 1.
*/
#define SHOW_SPRITES \
  LCDC_REG|=0x02U

/** Turns off the sprites layer.
    Clears bit 1 of the LCDC register to 0.
*/
#define HIDE_SPRITES \
  LCDC_REG&=0xFDU

/** Sets sprite size to 8x16 pixels, two tiles one above the other.
    Sets bit 2 of the LCDC register to 1.
*/
#define SPRITES_8x16 \
  LCDC_REG|=0x04U

/** Sets sprite size to 8x8 pixels, one tile.
    Clears bit 2 of the LCDC register to 0.
*/
#define SPRITES_8x8 \
  LCDC_REG&=0xFBU



/**
 * Set byte in vram at given memory location
 * 
 * @param addr address to write to
 * @param v value
 */
void set_vram_byte(uint8_t * addr, uint8_t v) __preserves_regs(b, c);

/**
 * Get byte from vram at given memory location
 * 
 * @param addr address to read from
 * @return read value
 */
uint8_t get_vram_byte(uint8_t * addr) __preserves_regs(b, c);


/**
 * Get address of X,Y tile of background map
 */
uint8_t * get_bkg_xy_addr(uint8_t x, uint8_t y) __preserves_regs(b, c);


/** Sets VRAM Tile Pattern data for the Background / Window

    @param first_tile  Index of the first tile to write
    @param nb_tiles    Number of tiles to write
    @param data        Pointer to (2 bpp) source tile data

    Writes __nb_tiles__ tiles to VRAM starting at __first_tile__, tile data
    is sourced from __data__. Each Tile is 16 bytes in size (8x8 pixels, 2 bits-per-pixel).

    Note: Sprite Tiles 128-255 share the same memory region as Background Tiles 128-255.

    GBC only: @ref VBK_REG determines which bank of Background tile patterns are written to.
    \li VBK_REG=0 indicates the first bank
    \li VBK_REG=1 indicates the second
*/
void set_bkg_data(uint8_t first_tile,
         uint8_t nb_tiles,
         const uint8_t *data) NONBANKED __preserves_regs(b, c);


/** Sets VRAM Tile Pattern data for the Background / Window using 1bpp source data

    @param first_tile  Index of the first Tile to write
    @param nb_tiles    Number of Tiles to write
    @param data        Pointer to (1bpp) source Tile Pattern data
    @param color       Color

    Similar to @ref set_bkg_data, except source data is 1 bit-per-pixel
    which gets expanded into 2 bits-per-pixel.

    For a given bit that represent a pixel:
    \li 0 will be expanded into color 0
    \li 1 will be expanded into color 1, 2 or 3 depending on color argument

    @see SHOW_BKG, HIDE_BKG, set_bkg_tiles
*/
void set_bkg_1bit_data(uint8_t first_tile,
         uint8_t nb_tiles,
         const uint8_t *data,
         uint8_t color) NONBANKED __preserves_regs(b, c);


/** Copies from Background / Window VRAM Tile Pattern data into a buffer

    @param first_tile  Index of the first Tile to read from
    @param nb_tiles    Number of Tiles to read
    @param data        Pointer to destination buffer for Tile Pattern data

    Copies __nb_tiles__ tiles from VRAM starting at __first_tile__, Tile data
    is copied into __data__.

    Each Tile is 16 bytes, so the buffer pointed to by __data__
    should be at least __nb_tiles__ x 16 bytes in size.

    @see get_win_data
*/
void get_bkg_data(uint8_t first_tile,
         uint8_t nb_tiles,
         uint8_t *data) NONBANKED __preserves_regs(b, c);


/** Sets a rectangular region of Background Tile Map.

    @param x      X Start position in Background Map tile coordinates. Range 0 - 31
    @param y      Y Start position in Background Map tile coordinates. Range 0 - 31
    @param w      Width of area to set in tiles. Range 1 - 32
    @param h      Height of area to set in tiles. Range 1 - 32
    @param tiles  Pointer to source tile map data

    Entries are copied from map at __tiles__ to the Background Tile Map starting at
    __x__, __y__ writing across for __w__ tiles and down for __h__ tiles.

    Use @ref set_bkg_submap() instead when:
    \li Source map is wider than 32 tiles.
    \li Writing a width that does not match the source map width __and__ more 
    than one row high at a time.

    One byte per source tile map entry.

    Writes that exceed coordinate 31 on the x or y axis will wrap around to 
    the Left and Top edges.

    Note: Patterns 128-255 overlap with patterns 128-255 of the sprite Tile Pattern table.

    GBC only: @ref VBK_REG determines whether Tile Numbers or Tile Attributes get set.
    \li VBK_REG=0 Tile Numbers are written
    \li VBK_REG=1 Tile Attributes are written

    GBC Tile Attributes are defined as:
    \li Bit 7 - Priority flag. When this is set, it puts the tile above the sprites
              with colour 0 being transparent.
              \n 0: Below sprites
              \n 1: Above sprites
              \n Note: @ref SHOW_BKG needs to be set for these priorities to take place.
    \li Bit 6 - Vertical flip. Dictates which way up the tile is drawn vertically.
              \n 0: Normal
              \n 1: Flipped Vertically
    \li Bit 5 - Horizontal flip. Dictates which way up the tile is drawn horizontally.
              \n 0: Normal
              \n 1: Flipped Horizontally
    \li Bit 4 - Not used
    \li Bit 3 - Character Bank specification. Dictates from which bank of
              Background Tile Patterns the tile is taken.
              \n 0: Bank 0
              \n 1: Bank 1
    \li Bit 2 - See bit 0.
    \li Bit 1 - See bit 0.
    \li Bit 0 - Bits 0-2 indicate which of the 7 BKG colour palettes the tile is
              assigned.

    @see SHOW_BKG
    @see set_bkg_data, set_bkg_submap
*/
void set_bkg_tiles(uint8_t x,
          uint8_t y,
          uint8_t w,
          uint8_t h,
          const uint8_t *tiles) NONBANKED __preserves_regs(b, c);


/** Sets a rectangular area of the Background Tile Map using a sub-region 
    from a source tile map. Useful for scrolling implementations of maps 
    larger than 32 x 32 tiles.

    @param x      X Start position in Background Map tile coordinates. Range 0 - 31
    @param y      Y Start position in Background Map tile coordinates. Range 0 - 31
    @param w      Width of area to set in tiles. Range 1 - 255
    @param h      Height of area to set in tiles. Range 1 - 255
    @param map    Pointer to source tile map data
    @param map_w  Width of source tile map in tiles. Range 1 - 255

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
    @see set_bkg_data, set_bkg_tiles, set_win_submap
*/
void set_bkg_submap(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *map, uint8_t map_w);


/** Copies a rectangular region of Background Tile Map entries into a buffer.

    @param x      X Start position in Background Map tile coordinates. Range 0 - 31
    @param y      Y Start position in Background Map tile coordinates. Range 0 - 31
    @param w      Width of area to copy in tiles. Range 0 - 31
    @param h      Height of area to copy in tiles. Range 0 - 31
    @param tiles  Pointer to destination buffer for Tile Map data


    Entries are copied into __tiles__ from the Background Tile Map starting at
    __x__, __y__ reading across for __w__ tiles and down for __h__ tiles.

    One byte per tile.

    The buffer pointed to by __tiles__ should be at least __x__ x __y__ bytes in size.
*/
void get_bkg_tiles(uint8_t x,
          uint8_t y,
          uint8_t w,
          uint8_t h,
          uint8_t *tiles) NONBANKED __preserves_regs(b, c);


/**
 * Set single tile t on background layer at x,y
 * @param x X-coordinate
 * @param y Y-coordinate
 * @param t tile index
 * @return returns the address of tile, so you may use faster set_vram_byte() later
 */ 
uint8_t * set_bkg_tile_xy(uint8_t x, uint8_t y, uint8_t t) __preserves_regs(b, c);


/**
 * Get single tile t on background layer at x,y
 * @param x X-coordinate
 * @param y Y-coordinate
 * @return returns tile index
 */ 
uint8_t get_bkg_tile_xy(uint8_t x, uint8_t y) __preserves_regs(b, c);


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
    SCX_REG=x, SCY_REG=y;
}


/** Moves the Background relative to it's current position.

    @param x   Number of pixels to move the Background on the __X axis__
               \n Range: -128 - 127
    @param y   Number of pixels to move the Background on the __Y axis__
               \n Range: -128 - 127

    @see move_bkg
*/
inline void scroll_bkg(int8_t x, int8_t y) {
    SCX_REG+=x, SCY_REG+=y;
}



/**
 * Get address of X,Y tile of window map
 */
uint8_t * get_win_xy_addr(uint8_t x, uint8_t y) __preserves_regs(b, c);

/** Sets VRAM Tile Pattern data for the Window / Background

    @param first_tile  Index of the first tile to write
    @param nb_tiles    Number of tiles to write
    @param data        Pointer to (2 bpp) source Tile Pattern data.

    This is the same as @ref set_bkg_data, since the Window Layer and
    Background Layer share the same Tile pattern data.

    @see set_bkg_data
    @see set_win_tiles
    @see SHOW_WIN, HIDE_WIN
*/
void set_win_data(uint8_t first_tile,
          uint8_t nb_tiles,
          const uint8_t *data) NONBANKED __preserves_regs(b, c);


/** Sets VRAM Tile Pattern data for the Window / Background using 1bpp source data

    @param first_tile  Index of the first tile to write
    @param nb_tiles    Number of tiles to write
    @param data        Pointer to (1bpp) source Tile Pattern data

    This is the same as @ref set_bkg_1bit_data, since the Window Layer and
    Background Layer share the same Tile pattern data.

    @see set_bkg_data, set_bkg_1bit_data, set_win_data
*/
void set_win_1bit_data(uint8_t first_tile,
          uint8_t nb_tiles,
          const uint8_t *data) NONBANKED __preserves_regs(b, c);


/** Copies from Window / Background VRAM Tile Pattern data into a buffer

    @param first_tile  Index of the first Tile to read from
    @param nb_tiles    Number of Tiles to read
    @param data        Pointer to destination buffer for Tile Pattern Data

    This is the same as @ref get_bkg_data, since the Window Layer and
    Background Layer share the same Tile pattern data.

    @see get_bkg_data
*/
void get_win_data(uint8_t first_tile,
          uint8_t nb_tiles,
          uint8_t *data) NONBANKED __preserves_regs(b, c);


/** Sets a rectangular region of the Window Tile Map.

    @param x      X Start position in Window Map tile coordinates. Range 0 - 31
    @param y      Y Start position in Window Map tile coordinates. Range 0 - 31
    @param w      Width of area to set in tiles. Range 1 - 32
    @param h      Height of area to set in tiles. Range 1 - 32
    @param tiles  Pointer to source tile map data

    Entries are copied from map at __tiles__ to the Window Tile Map starting at
    __x__, __y__ writing across for __w__ tiles and down for __h__ tiles.

    Use @ref set_win_submap() instead when:
    \li Source map is wider than 32 tiles.
    \li Writing a width that does not match the source map width __and__ more 
    than one row high at a time.

    One byte per source tile map entry.

    Writes that exceed coordinate 31 on the x or y axis will wrap around to 
    the Left and Top edges.

    Note: Patterns 128-255 overlap with patterns 128-255 of the sprite Tile Pattern table.

    GBC only: @ref VBK_REG determines whether Tile Numbers or Tile Attributes get set.
    \li VBK_REG=0 Tile Numbers are written
    \li VBK_REG=1 Tile Attributes are written

    For more details about GBC Tile Attributes see @ref set_bkg_tiles.

    @see SHOW_WIN, HIDE_WIN, set_win_submap, set_bkg_tiles, set_bkg_data
*/
void set_win_tiles(uint8_t x,
          uint8_t y,
          uint8_t w,
          uint8_t h,
          const uint8_t *tiles) NONBANKED __preserves_regs(b, c);


/** Sets a rectangular area of the Window Tile Map using a sub-region 
    from a source tile map.

    @param x      X Start position in Window Map tile coordinates. Range 0 - 31
    @param y      Y Start position in Wimdpw Map tile coordinates. Range 0 - 31
    @param w      Width of area to set in tiles. Range 1 - 255
    @param h      Height of area to set in tiles. Range 1 - 255
    @param map    Pointer to source tile map data
    @param map_w  Width of source tile map in tiles. Range 1 - 255

    Entries are copied from __map__ to the Window Tile Map starting at
    __x__, __y__ writing across for __w__ tiles and down for __h__ tiles, 
    using __map_w__ as the rowstride for the source tile map.

    Use this instead of @ref set_win_tiles when the source map is wider than
    32 tiles or when writing a width that does not match the source map width. 

    One byte per source tile map entry.

    Writes that exceed coordinate 31 on the x or y axis will wrap around to 
    the Left and Top edges.

    GBC only: @ref VBK_REG determines whether Tile Numbers or Tile Attributes get set.
    \li VBK_REG=0 Tile Numbers are written
    \li VBK_REG=1 Tile Attributes are written

    See @ref set_bkg_tiles for details about CGB attribute maps with @ref VBK_REG.

    @see SHOW_WIN, HIDE_WIN, set_win_tiles, set_bkg_submap, set_bkg_tiles, set_bkg_data
**/
void set_win_submap(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *map, uint8_t map_w);


/** Copies a rectangular region of Window Tile Map entries into a buffer.

    @param x      X Start position in Window Map tile coordinates. Range 0 - 31
    @param y      Y Start position in Window Map tile coordinates. Range 0 - 31
    @param w      Width of area to copy in tiles. Range 0 - 31
    @param h      Height of area to copy in tiles. Range 0 - 31
    @param tiles  Pointer to destination buffer for Tile Map data

    Entries are copied into __tiles__ from the Window Tile Map starting at
    __x__, __y__ reading across for __w__ tiles and down for __h__ tiles.

    One byte per tile.

    The buffer pointed to by __tiles__ should be at least __x__ x __y__ bytes in size.
*/
void get_win_tiles(uint8_t x,
          uint8_t y,
          uint8_t w,
          uint8_t h,
          uint8_t *tiles) NONBANKED __preserves_regs(b, c);


/**
 * Set single tile t on window layer at x,y
 * @param x X-coordinate
 * @param y Y-coordinate
 * @param t tile index
 * @return returns the address of tile, so you may use faster set_vram_byte() later
 */ 
uint8_t * set_win_tile_xy(uint8_t x, uint8_t y, uint8_t t) __preserves_regs(b, c);


/**
 * Get single tile t on window layer at x,y
 * @param x X-coordinate
 * @param y Y-coordinate
 * @return returns the tile index
 */ 
uint8_t get_win_tile_xy(uint8_t x, uint8_t y) __preserves_regs(b, c);


/** Moves the Window to the __x__, __y__ position on the screen.

    @param x   X coordinate for Left edge of the Window (actual displayed location will be X - 7)
    @param y   Y coordinate for Top edge of the Window

    7,0 is the top left corner of the screen in Window coordinates. The Window is locked to the bottom right corner.

    The Window is always over the Background layer.

    @see SHOW_WIN, HIDE_WIN
*/
inline void move_win(uint8_t x, uint8_t y) {
    WX_REG=x, WY_REG=y;
}


/** Move the Window relative to its current position.

    @param x   Number of pixels to move the window on the __X axis__
               \n Range: -128 - 127
    @param y   Number of pixels to move the window on the __Y axis__
               \n Range: -128 - 127

    @see move_win
*/
inline void scroll_win(int8_t x, int8_t y) {
    WX_REG+=x, WY_REG+=y;
}



/** Sets VRAM Tile Pattern data for Sprites

    @param first_tile  Index of the first tile to write
    @param nb_tiles    Number of tiles to write
    @param data        Pointer to (2 bpp) source Tile Pattern data

    Writes __nb_tiles__ tiles to VRAM starting at __first_tile__, tile data
    is sourced from __data__. Each Tile is 16 bytes in size (8x8 pixels, 2 bits-per-pixel).

    Note: Sprite Tiles 128-255 share the same memory region as Background Tiles 128-255.

    GBC only: @ref VBK_REG determines which bank of Background tile patterns are written to.
    \li VBK_REG=0 indicates the first bank
    \li VBK_REG=1 indicates the second
*/
void set_sprite_data(uint8_t first_tile,
          uint8_t nb_tiles,
          const uint8_t *data) NONBANKED __preserves_regs(b, c);


/** Sets VRAM Tile Pattern data for Sprites using 1bpp source data

    @param first_tile  Index of the first tile to write
    @param nb_tiles    Number of tiles to write
    @param data        Pointer to (1bpp) source Tile Pattern data

    Similar to @ref set_sprite_data, except source data is 1 bit-per-pixel
    which gets expanded into 2 bits-per-pixel.

    For a given bit that represent a pixel:
    \li 0 will be expanded into color 0
    \li 1 will be expanded into color 3

    @see SHOW_SPRITES, HIDE_SPRITES, set_sprite_tile
*/
void set_sprite_1bit_data(uint8_t first_tile,
          uint8_t nb_tiles,
          const uint8_t *data) NONBANKED __preserves_regs(b, c);


/** Copies from Sprite VRAM Tile Pattern data into a buffer

    @param first_tile  Index of the first tile to read from
    @param nb_tiles    Number of tiles to read
    @param data        Pointer to destination buffer for Tile Pattern data

    Copies __nb_tiles__ tiles from VRAM starting at __first_tile__, tile data
    is copied into __data__.

    Each Tile is 16 bytes, so the buffer pointed to by __data__
    should be at least __nb_tiles__ x 16 bytes in size.
*/
void get_sprite_data(uint8_t first_tile,
          uint8_t nb_tiles,
          uint8_t *data) NONBANKED __preserves_regs(b, c);


/** Sprite Attributes structure
    @param x     X Coordinate of the sprite on screen
    @param y     Y Coordinate of the sprite on screen
    @param tile  Sprite tile number (see @ref set_sprite_tile)
    @param prop  OAM Property Flags (see @ref set_sprite_prop)
*/
typedef struct OAM_item_t {
    uint8_t y, x;  //< X, Y Coordinates of the sprite on screen
    uint8_t tile;  //< Sprite tile number
    uint8_t prop;  //< OAM Property Flags
} OAM_item_t;


/** Shadow OAM array in WRAM, that is DMA-transferred into the real OAM each VBlank
*/
extern volatile struct OAM_item_t shadow_OAM[];

/** MSB of shadow_OAM address is used by OAM DMA copying routine
*/
__REG _shadow_OAM_base;

/** Disable OAM DMA copy each VBlank
*/
#define DISABLE_OAM_DMA \
    _shadow_OAM_base = 0

/** Enable OAM DMA copy each VBlank and set it to transfer default shadow_OAM array
*/
#define ENABLE_OAM_DMA \
    _shadow_OAM_base = (uint8_t)((uint16_t)&shadow_OAM >> 8)

/** Enable OAM DMA copy each VBlank and set it to transfer any 256-byte aligned array
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
    shadow_OAM[nb].tile=tile;
}


/** Returns the tile number of sprite number __nb__ in the OAM.

@param nb    Sprite number, range 0 - 39

@see set_sprite_tile for more details
*/
inline uint8_t get_sprite_tile(uint8_t nb) {
    return shadow_OAM[nb].tile;
}


/** Sets the OAM Property Flags of sprite number __nb__ to those defined in __prop__.

    @param nb    Sprite number, range 0 - 39
    @param prop  Property setting (see bitfield description)

    The bits in __prop__ represent:
    \li Bit 7 - Priority flag. When this is set the sprites appear behind the
              background and window layer.
              \n 0: infront
              \n 1: behind
    \li Bit 6 - Vertical flip. Dictates which way up the sprite is drawn
              vertically.
              \n 0: normal
              \n 1:upside down
    \li Bit 5 - Horizontal flip. Dictates which way up the sprite is
              drawn horizontally.
              \n 0: normal
              \n  1:back to front
    \li Bit 4 - DMG/Non-CGB Mode Only. Assigns either one of the two b/w palettes to the sprite.
              \n 0: OBJ palette 0
              \n 1: OBJ palette 1
    \li Bit 3 - GBC only. Dictates from which bank of Sprite Tile Patterns the tile
              is taken.
              \n 0: Bank 0
              \n 1: Bank 1
    \li Bit 2 - See bit 0.
    \li Bit 1 - See bit 0.
    \li Bit 0 - GBC only. Bits 0-2 indicate which of the 7 OBJ colour palettes the
              sprite is assigned.
*/
inline void set_sprite_prop(uint8_t nb, uint8_t prop){
    shadow_OAM[nb].prop=prop;
}


/** Returns the OAM Property Flags of sprite number __nb__.

    @param nb    Sprite number, range 0 - 39
    @see set_sprite_prop for property bitfield settings
*/
inline uint8_t get_sprite_prop(uint8_t nb){
    return shadow_OAM[nb].prop;
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
    OAM_item_t * itm = &shadow_OAM[nb];
    itm->y=y, itm->x=x;
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
    OAM_item_t * itm = &shadow_OAM[nb];
    itm->y+=y, itm->x+=x;
}


/** Hides sprite number __nb__ by moving it to zero position by Y.

    @param nb  Sprite number, range 0 - 39
 */
inline void hide_sprite(uint8_t nb) {
    shadow_OAM[nb].y = 0;
}



/** Copies Tile Pattern data to an address in VRAM

    @param vram_addr Pointer to destination VRAM Address
    @param data      Pointer to source buffer
    @param len       Number of bytes to copy

    Copies __len__ bytes from a buffer at __data__ to VRAM starting at __vram_addr__.

    GBC only: @ref VBK_REG determines which bank of Background tile patterns are written to.
    \li VBK_REG=0 indicates the first bank
    \li VBK_REG=1 indicates the second
*/
void set_data(uint8_t *vram_addr,
          const uint8_t *data,
          uint16_t len) NONBANKED __preserves_regs(b, c);


/** Copies Tile Pattern data from an address in VRAM into a buffer

    @param vram_addr Pointer to source VRAM Address
    @param data      Pointer to destination buffer
    @param len       Number of bytes to copy

    Copies __len__ bytes from VRAM starting at __vram_addr__ into a buffer at __data__.

    GBC only: @ref VBK_REG determines which bank of Background tile patterns are written to.
    \li VBK_REG=0 indicates the first bank
    \li VBK_REG=1 indicates the second
*/
void get_data(uint8_t *data,
          uint8_t *vram_addr,
          uint16_t len) NONBANKED __preserves_regs(b, c);


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

    There are two 32x32 Tile Maps in VRAM at addresses 9800h-9BFFh and 9C00h-9FFFh.

    GBC only: @ref VBK_REG determines whether Tile Numbers or Tile Attributes get set.
    \li VBK_REG=0 Tile Numbers are written
    \li VBK_REG=1 Tile Attributes are written
*/
void set_tiles(uint8_t x,
          uint8_t y,
          uint8_t w,
          uint8_t h,
          uint8_t *vram_addr,
          const uint8_t *tiles) NONBANKED __preserves_regs(b, c);

/** Sets VRAM Tile Pattern data starting from given base address

    @param first_tile  Index of the first tile to write
    @param nb_tiles    Number of tiles to write
    @param data        Pointer to (2 bpp) source Tile Pattern data.
	@param base        MSB of the destination address in VRAM (usually 0x80 or 0x90 which gives 0x8000 or 0x9000)
*/
void set_tile_data(uint8_t first_tile,
          uint8_t nb_tiles,
          const uint8_t *data,
		  uint8_t base) NONBANKED __preserves_regs(b, c);

/** Copies a rectangular region of Tile Map entries from a given VRAM Address into a buffer.

    @param x         X Start position in Background Map tile coordinates. Range 0 - 31
    @param y         Y Start position in Background Map tile coordinates. Range 0 - 31
    @param w         Width of area to copy in tiles. Range 0 - 31
    @param h         Height of area to copy in tiles. Range 0 - 31
    @param vram_addr Pointer to source VRAM Address
    @param tiles     Pointer to destination buffer for Tile Map data

    Entries are copied into __tiles__ from the Background Tile Map starting at
    __x__, __y__ reading across for __w__ tiles and down for __h__ tiles.

    One byte per tile.

    There are two 32x32 Tile Maps in VRAM at addresses 9800h - 9BFFh and 9C00h - 9FFFh.

    The buffer pointed to by __tiles__ should be at least __x__ x __y__ bytes in size.
*/
void get_tiles(uint8_t x,
          uint8_t y,
          uint8_t w,
          uint8_t h,
		  uint8_t *vram_addr,
          uint8_t *tiles) NONBANKED __preserves_regs(b, c);




/** Initializes the entire Window Tile Map with Tile Number __c__
    @param c   Tile number to fill with

    Note: This function avoids writes during modes 2 & 3
*/
void init_win(uint8_t c) NONBANKED __preserves_regs(b, c);

/** Initializes the entire Background Tile Map with Tile Number __c__
    @param c   Tile number to fill with

    Note: This function avoids writes during modes 2 & 3
*/
void init_bkg(uint8_t c) NONBANKED __preserves_regs(b, c);

/** Fills the VRAM memory region __s__ of size __n__ with Tile Number __c__
    @param s   Start address in VRAM
    @param c   Tile number to fill with
    @param n   Size of memory region (in bytes) to fill

    Note: This function avoids writes during modes 2 & 3
*/
void vmemset (void *s, uint8_t c, size_t n) NONBANKED __preserves_regs(b, c);



/** Fills a rectangular region of Tile Map entries for the Background layer with tile.

    @param x      X Start position in Background Map tile coordinates. Range 0 - 31
    @param y      Y Start position in Background Map tile coordinates. Range 0 - 31
    @param w      Width of area to set in tiles. Range 0 - 31
    @param h      Height of area to set in tiles. Range 0 - 31
    @param tile   Fill value
*/
void fill_bkg_rect(uint8_t x, uint8_t y, uint8_t w, uint8_t h, uint8_t tile) NONBANKED __preserves_regs(b, c);

/** Fills a rectangular region of Tile Map entries for the Window layer with tile.

    @param x      X Start position in Window Map tile coordinates. Range 0 - 31
    @param y      Y Start position in Window Map tile coordinates. Range 0 - 31
    @param w      Width of area to set in tiles. Range 0 - 31
    @param h      Height of area to set in tiles. Range 0 - 31
    @param tile   Fill value
*/
void fill_win_rect(uint8_t x, uint8_t y, uint8_t w, uint8_t h, uint8_t tile) NONBANKED __preserves_regs(b, c);

#endif /* _GB_H */
