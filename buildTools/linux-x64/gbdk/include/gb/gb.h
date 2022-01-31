/** @file gb/gb.h
    Gameboy specific functions.
*/
#ifndef _GB_H
#define _GB_H

#include <types.h>
#include <stdint.h>
#include <gbdk/version.h>
#include <gb/hardware.h>

#define NINTENDO
#ifdef SEGA
#undef SEGA
#endif
#if defined(__TARGET_ap)
#define ANALOGUEPOCKET
#elif defined(__TARGET_gb)
#define GAMEBOY
#elif defined(__TARGET_duck)
#define MEGADUCK
#endif


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
#define	J_UP         0x04U
#define	J_DOWN       0x08U
#define	J_LEFT       0x02U
#define	J_RIGHT      0x01U
#define	J_A          0x10U
#define	J_B          0x20U
#define	J_SELECT     0x40U
#define	J_START      0x80U

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
void remove_VBL(int_handler h) OLDCALL;

/** Removes the LCD interrupt handler.
    @see add_LCD(), remove_VBL()
*/
void remove_LCD(int_handler h) OLDCALL;

/** Removes the TIM interrupt handler.
    @see add_TIM(), remove_VBL()
*/
void remove_TIM(int_handler h) OLDCALL;

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
void remove_SIO(int_handler h) OLDCALL;

/** Removes the JOY interrupt handler.
    @see add_JOY(), remove_VBL()
*/
void remove_JOY(int_handler h) OLDCALL;

/** Adds a V-blank interrupt handler.

    @param h  The handler to be called whenever a V-blank
    interrupt occurs.

    Up to 4 handlers may be added, with the last added being
    called last.  If the @ref remove_VBL function is to be called,
    only three may be added.

    Do not use @ref CRITICAL and @ref INTERRUPT attributes for a
    function added via add_VBL() (or LCD, etc). The attributes
    are only required when constructing a bare jump from the
    interrupt vector itself.

    Note: The default VBL is installed automatically.
*/
void add_VBL(int_handler h) OLDCALL;

/** Adds a LCD interrupt handler.

    Called when the LCD interrupt occurs, which is normally
    when @ref LY_REG == @ref LYC_REG.

    There are various reasons for this interrupt to occur
    as described by the @ref STAT_REG register ($FF41). One very
    popular reason is to indicate to the user when the
    video hardware is about to redraw a given LCD line.
    This can be useful for dynamically controlling the
    @ref SCX_REG / @ref SCY_REG registers ($FF43/$FF42) to perform
    special video effects.

    @see add_VBL
*/
void add_LCD(int_handler h) OLDCALL;

/** Adds a timer interrupt handler.

    Can not be used together with @ref add_low_priority_TIM

    This interrupt occurs when the @ref TIMA_REG
    register ($FF05) changes from $FF to $00.

    @see add_VBL
    @see set_interrupts() with TIM_IFLAG
*/
void add_TIM(int_handler h) OLDCALL;

/** Adds a timer interrupt handler, that could be 
    interrupted by the other interrupts, 
    as well as itself, if it runs too slow.

    Can not be used together with @ref add_TIM

    This interrupt occurs when the @ref TIMA_REG
    register ($FF05) changes from $FF to $00.

    @see add_VBL
    @see set_interrupts() with TIM_IFLAG
*/
void add_low_priority_TIM(int_handler h) OLDCALL;

/** Adds a Serial Link transmit complete interrupt handler.

    This interrupt occurs when a serial transfer has
    completed on the game link port.

    @see send_byte, receive_byte(), add_VBL()
    @see set_interrupts() with SIO_IFLAG
*/
void add_SIO(int_handler h) OLDCALL;


/** Adds a joypad button change interrupt handler.

    This interrupt occurs on a transition of any of the
    keypad input lines from high to low. Due to the fact
    that keypad "bounce" is virtually always present,
    software should expect this interrupt to occur one
    or more times for every button press and one or more
    times for every button release.

    @see joypad(), add_VBL()
*/
void add_JOY(int_handler h) OLDCALL;


/** Interrupt handler chain terminator that does __not__ wait for .STAT

    You must add this handler last in every interrupt handler
    chain if you want to change the default interrupt handler
    behaviour that waits for LCD controller mode to become 1 or 0
    before return from the interrupt.

    Example:
    \code{.c}
    CRITICAL {
        add_SIO(nowait_int_handler); // Disable wait on VRAM state before returning from SIO interrupt
    }
    \endcode
    @see wait_int_handler()
*/
void nowait_int_handler();


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
void wait_int_handler();

/** Cancel pending interrupts
 */
inline uint8_t cancel_pending_interrupts() {
    return IF_REG = 0;
}

/** Set the current screen mode - one of M_* modes

    Normally used by internal functions only.

    @see M_DRAWING, M_TEXT_OUT, M_TEXT_INOUT, M_NO_SCROLL, M_NO_INTERP
*/
void mode(uint8_t m) OLDCALL;

/** Returns the current mode

    @see M_DRAWING, M_TEXT_OUT, M_TEXT_INOUT, M_NO_SCROLL, M_NO_INTERP
*/
uint8_t get_mode() OLDCALL PRESERVES_REGS(b, c);

/** GB CPU type

    @see DMG_TYPE, MGB_TYPE, CGB_TYPE, cpu_fast(), cpu_slow(), _is_GBA
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

/** GBA detection

    @see GBA_DETECTED, GBA_NOT_DETECTED, _cpu
*/
extern uint8_t _is_GBA;

/** Hardware Model: DMG, CGB or MGB. @see _cpu, _is_GBA
*/
#define GBA_NOT_DETECTED 0x00
/** Hardware Model: GBA. @see _cpu, _is_GBA
*/
#define GBA_DETECTED 0x01

/** Macro returns TRUE if device supports color
 */
#define DEVICE_SUPPORTS_COLOR (_cpu == CGB_TYPE)

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
void send_byte();

/** Serial Link: Receive a byte from the serial port into @ref _io_in

    Make sure to enable interrupts for the
    Serial Link before trying to transfer data.
    @see add_SIO(), remove_SIO()
    @see set_interrupts() with @ref SIO_IFLAG
*/
void receive_byte();

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
#define BANKREF(VARNAME) void __func_ ## VARNAME() __banked __naked { \
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

/** Makes MEGADUCK MBC switch the active ROM bank
    @param b   ROM bank to switch to
*/
#define SWITCH_ROM_MEGADUCK(b) \
  _current_bank = (b), *(uint8_t *)0x0001 = (b)


/** Makes MBC1 and other compatible MBCs switch the active ROM bank
    @param b   ROM bank to switch to
*/
#define SWITCH_ROM_MBC1(b) \
  _current_bank = (b), *(uint8_t *)0x2000 = (b)

/** Makes default platform MBC switch the active ROM bank
    @param b   ROM bank to switch to (max 255)

    @see SWITCH_ROM_MBC1, SWITCH_ROM_MBC5, SWITCH_ROM_MEGADUCK
*/
#if defined(__TARGET_duck)
#define SWITCH_ROM SWITCH_ROM_MEGADUCK
#else
#define SWITCH_ROM SWITCH_ROM_MBC1
#endif

/** Switches SRAM bank on MBC1 and other compaticle MBCs
    @param b   SRAM bank to switch to
*/
#define SWITCH_RAM_MBC1(b) \
  *(uint8_t *)0x4000 = (b)

/** Switches SRAM bank on MBC1 and other compaticle MBCs
    @param b   SRAM bank to switch to

    @see SWITCH_RAM_MBC1, SWITCH_RAM_MBC5
*/
#define SWITCH_RAM SWITCH_RAM_MBC1

/** Enables SRAM on MBC1
*/
#define ENABLE_RAM_MBC1 \
  *(uint8_t *)0x0000 = 0x0A

#define ENABLE_RAM ENABLE_RAM_MBC1

/** Disables SRAM on MBC1
*/
#define DISABLE_RAM_MBC1 \
  *(uint8_t *)0x0000 = 0x00

#define DISABLE_RAM DISABLE_RAM_MBC1

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
    interrupts disabled
 */
void delay(uint16_t d) OLDCALL;



/** Reads and returns the current state of the joypad.
    Follows Nintendo's guidelines for reading the pad.
    Return value is an OR of J_*

    When testing for multiple different buttons, it's
    best to read the joypad state *once* into a variable
    and then test using that variable.

    @see J_START, J_SELECT, J_A, J_B, J_UP, J_DOWN, J_LEFT, J_RIGHT
*/
uint8_t joypad() OLDCALL PRESERVES_REGS(b, c, h, l);

/** Waits until at least one of the buttons given in mask are pressed.

    @param mask Bitmask indicating which buttons to wait for

    Normally only used for checking one key, but it will
    support many, even J_LEFT at the same time as J_RIGHT. :)

    Note: Checks in a loop that doesn't HALT at all, so the CPU
    will be maxed out until this call returns.
    @see joypad
    @see J_START, J_SELECT, J_A, J_B, J_UP, J_DOWN, J_LEFT, J_RIGHT
*/
uint8_t waitpad(uint8_t mask) OLDCALL PRESERVES_REGS(b, c);

/** Waits for the directional pad and all buttons to be released.

    Note: Checks in a loop that doesn't HALT at all, so the CPU
    will be maxed out until this call returns.
*/
void waitpadup() PRESERVES_REGS(a, b, c, d, e, h, l);

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
uint8_t joypad_init(uint8_t npads, joypads_t * joypads) OLDCALL;

/** Polls all avaliable joypads (for the GB and ones connected via SGB)
    @param joypads	pointer to joypads_t structure to be filled with joypad statuses,
    	   must be previously initialized with joypad_init()

    @see joypad_init(), joypads_t
*/
void joypad_ex(joypads_t * joypads) OLDCALL PRESERVES_REGS(b, c);



/** Enables unmasked interrupts

    @note Use @ref CRITICAL {...} instead for creating a block of
          of code which should execute with interrupts  temporarily
          turned off.

    @see disable_interrupts, set_interrupts, CRITICAL
*/
inline void enable_interrupts() PRESERVES_REGS(a, b, c, d, e, h, l) {
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
inline void disable_interrupts() PRESERVES_REGS(a, b, c, d, e, h, l) {
    __asm__("di");
}

/** Clears any pending interrupts and sets the interrupt mask
    register IO to flags.
    @param flags	A logical OR of *_IFLAGS
    @see enable_interrupts(), disable_interrupts()
    @see VBL_IFLAG, LCD_IFLAG, TIM_IFLAG, SIO_IFLAG, JOY_IFLAG
*/
void set_interrupts(uint8_t flags) OLDCALL PRESERVES_REGS(b, c, d, e);

/** Performs a warm reset by reloading the CPU value
    then jumping to the start of crt0 (0x0150)
*/
void reset();

/** HALTs the CPU and waits for the vertical blank interrupt (VBL) to finish.

    This is often used in main loops to idle the CPU at low power
    until it's time to start the next frame. It's also useful for
    syncing animation with the screen re-draw.

    Warning: If the VBL interrupt is disabled, this function will
    never return. If the screen is off this function returns
    immediately.
*/
void wait_vbl_done() PRESERVES_REGS(b, c, d, e, h, l);

/** Turns the display off.

    Waits until the VBL interrupt before turning the display off.
    @see DISPLAY_ON
*/
void display_off() PRESERVES_REGS(b, c, d, e, h, l);

/** Copies data from shadow OAM to OAM
 */
void refresh_OAM() PRESERVES_REGS(b, c, d, e, h, l);


/** Copies data from somewhere in the lower address space to part of hi-ram.
    @param dst		Offset in high ram (0xFF00 and above) to copy to.
    @param src		Area to copy from
    @param n		Number of bytes to copy.
*/
void hiramcpy(uint8_t dst, const void *src, uint8_t n) OLDCALL PRESERVES_REGS(b, c);


/** Turns the display back on.
    @see display_off, DISPLAY_OFF
*/
#define DISPLAY_ON \
  LCDC_REG|=LCDCF_ON

/** Turns the display off immediately.
    @see display_off, DISPLAY_ON
*/
#define DISPLAY_OFF \
  display_off();

/** Does nothing for GB
 */
#define HIDE_LEFT_COLUMN

/** Does nothing for GB
 */
#define SHOW_LEFT_COLUMN

/** Turns on the background layer.
    Sets bit 0 of the LCDC register to 1.
*/
#define SHOW_BKG \
  LCDC_REG|=LCDCF_BGON

/** Turns off the background layer.
    Sets bit 0 of the LCDC register to 0.
*/
#define HIDE_BKG \
  LCDC_REG&=~LCDCF_BGON

/** Turns on the window layer
    Sets bit 5 of the LCDC register to 1.
*/
#define SHOW_WIN \
  LCDC_REG|=LCDCF_WINON

/** Turns off the window layer.
    Clears bit 5 of the LCDC register to 0.
*/
#define HIDE_WIN \
  LCDC_REG&=~LCDCF_WINON

/** Turns on the sprites layer.
    Sets bit 1 of the LCDC register to 1.
*/
#define SHOW_SPRITES \
  LCDC_REG|=LCDCF_OBJON

/** Turns off the sprites layer.
    Clears bit 1 of the LCDC register to 0.
*/
#define HIDE_SPRITES \
  LCDC_REG&=~LCDCF_OBJON

/** Sets sprite size to 8x16 pixels, two tiles one above the other.
    Sets bit 2 of the LCDC register to 1.
*/
#define SPRITES_8x16 \
  LCDC_REG|=LCDCF_OBJ16

/** Sets sprite size to 8x8 pixels, one tile.
    Clears bit 2 of the LCDC register to 0.
*/
#define SPRITES_8x8 \
  LCDC_REG&=~LCDCF_OBJ16



/**
 * Set byte in vram at given memory location
 *
 * @param addr address to write to
 * @param v value
 */
void set_vram_byte(uint8_t * addr, uint8_t v) OLDCALL PRESERVES_REGS(b, c);

/**
 * Get byte from vram at given memory location
 *
 * @param addr address to read from
 * @return read value
 */
uint8_t get_vram_byte(uint8_t * addr) OLDCALL PRESERVES_REGS(b, c);


/**
 * Get address of X,Y tile of background map
 */
uint8_t * get_bkg_xy_addr(uint8_t x, uint8_t y) OLDCALL PRESERVES_REGS(b, c);

#define COMPAT_PALETTE(C0,C1,C2,C3) ((uint8_t)(((C3) << 6) | ((C2) << 4) | ((C1) << 2) | (C0)))

/** Sets palette for 2bpp color translation for GG/SMS, does nothing on GB
 */
inline void set_2bpp_palette(uint16_t palette) {
    palette;
}

extern uint16_t _current_1bpp_colors;
void set_1bpp_colors_ex(uint8_t fgcolor, uint8_t bgcolor, uint8_t mode) OLDCALL;
inline void set_1bpp_colors(uint8_t fgcolor, uint8_t bgcolor) {
    set_1bpp_colors_ex(fgcolor, bgcolor, 0);
}

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

    @see set_win_data, set_tile_data
*/
void set_bkg_data(uint8_t first_tile, uint8_t nb_tiles, const uint8_t *data) OLDCALL PRESERVES_REGS(b, c);
#define set_bkg_2bpp_data set_bkg_data

/** Sets VRAM Tile Pattern data for the Background / Window using 1bpp source data

    @param first_tile  Index of the first Tile to write
    @param nb_tiles    Number of Tiles to write
    @param data        Pointer to (1bpp) source Tile Pattern data

    Similar to @ref set_bkg_data, except source data is 1 bit-per-pixel
    which gets expanded into 2 bits-per-pixel.

    For a given bit that represent a pixel:
    \li 0 will be expanded into color 0
    \li 1 will be expanded into color 1, 2 or 3 depending on color argument

    @see SHOW_BKG, HIDE_BKG, set_bkg_tiles
*/
void set_bkg_1bpp_data(uint8_t first_tile, uint8_t nb_tiles, const uint8_t *data) OLDCALL PRESERVES_REGS(b, c);

/** Copies from Background / Window VRAM Tile Pattern data into a buffer

    @param first_tile  Index of the first Tile to read from
    @param nb_tiles    Number of Tiles to read
    @param data        Pointer to destination buffer for Tile Pattern data

    Copies __nb_tiles__ tiles from VRAM starting at __first_tile__, Tile data
    is copied into __data__.

    Each Tile is 16 bytes, so the buffer pointed to by __data__
    should be at least __nb_tiles__ x 16 bytes in size.

    @see get_win_data, get_data
*/
void get_bkg_data(uint8_t first_tile, uint8_t nb_tiles, uint8_t *data) OLDCALL PRESERVES_REGS(b, c);


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
    @see set_bkg_data, set_bkg_submap, set_win_tiles, set_tiles
*/
void set_bkg_tiles(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *tiles) OLDCALL PRESERVES_REGS(b, c);
#define set_tile_map set_bkg_tiles


extern uint8_t _map_tile_offset;

inline void set_bkg_based_tiles(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *tiles, uint8_t base_tile) {
    _map_tile_offset = base_tile;
    set_bkg_tiles(x, y, w, h, tiles);
    _map_tile_offset = 0;
}


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
    @see set_bkg_data, set_bkg_tiles, set_win_submap, set_tiles
*/
void set_bkg_submap(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *map, uint8_t map_w) OLDCALL;
#define set_tile_submap set_bkg_submap


extern uint8_t _submap_tile_offset;

/** Sets a rectangular area of the Background Tile Map using a sub-region
    from a source tile map and base_tile tile ID offset. Useful for scrolling 
    implementations of maps larger than 32 x 32 tiles.

    @param x      X Start position in Background Map tile coordinates. Range 0 - 31
    @param y      Y Start position in Background Map tile coordinates. Range 0 - 31
    @param w      Width of area to set in tiles. Range 1 - 255
    @param h      Height of area to set in tiles. Range 1 - 255
    @param map    Pointer to source tile map data
    @param map_w  Width of source tile map in tiles. Range 1 - 255
    @param base_tile Offset each tile ID of submap by this value

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
inline void set_bkg_based_submap(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *map, uint8_t map_w, uint8_t base_tile) {
    _submap_tile_offset = base_tile;
    set_bkg_submap(x, y, w, h, map, map_w);
    _submap_tile_offset = 0;
}


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

    @see get_win_tiles, get_bkg_tile_xy, get_tiles, get_vram_byte
*/
void get_bkg_tiles(uint8_t x, uint8_t y, uint8_t w, uint8_t h, uint8_t *tiles) OLDCALL PRESERVES_REGS(b, c);


/**
 * Set single tile t on background layer at x,y
 * @param x X-coordinate
 * @param y Y-coordinate
 * @param t tile index
 * @return returns the address of tile, so you may use faster set_vram_byte() later
 */
uint8_t * set_bkg_tile_xy(uint8_t x, uint8_t y, uint8_t t) OLDCALL PRESERVES_REGS(b, c);
#define set_tile_xy set_bkg_tile_xy

/**
 * Get single tile t on background layer at x,y
 * @param x X-coordinate
 * @param y Y-coordinate
 * @return returns tile index
 */
uint8_t get_bkg_tile_xy(uint8_t x, uint8_t y) OLDCALL PRESERVES_REGS(b, c);


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
uint8_t * get_win_xy_addr(uint8_t x, uint8_t y) OLDCALL PRESERVES_REGS(b, c);

/** Sets VRAM Tile Pattern data for the Window / Background

    @param first_tile  Index of the first tile to write
    @param nb_tiles    Number of tiles to write
    @param data        Pointer to (2 bpp) source Tile Pattern data.

    This is the same as @ref set_bkg_data, since the Window Layer and
    Background Layer share the same Tile pattern data.

    @see set_bkg_data
    @see set_win_tiles, set_bkg_data, set_data
    @see SHOW_WIN, HIDE_WIN
*/
void set_win_data(uint8_t first_tile, uint8_t nb_tiles, const uint8_t *data) OLDCALL PRESERVES_REGS(b, c);


/** Sets VRAM Tile Pattern data for the Window / Background using 1bpp source data

    @param first_tile  Index of the first tile to write
    @param nb_tiles    Number of tiles to write
    @param data        Pointer to (1bpp) source Tile Pattern data

    This is the same as @ref set_bkg_1bpp_data, since the Window Layer and
    Background Layer share the same Tile pattern data.

    @see set_bkg_data, set_bkg_1bpp_data, set_win_data
*/
void set_win_1bpp_data(uint8_t first_tile, uint8_t nb_tiles, const uint8_t *data) OLDCALL PRESERVES_REGS(b, c);


/** Copies from Window / Background VRAM Tile Pattern data into a buffer

    @param first_tile  Index of the first Tile to read from
    @param nb_tiles    Number of Tiles to read
    @param data        Pointer to destination buffer for Tile Pattern Data

    This is the same as @ref get_bkg_data, since the Window Layer and
    Background Layer share the same Tile pattern data.

    @see get_bkg_data, get_data
*/
void get_win_data(uint8_t first_tile, uint8_t nb_tiles, uint8_t *data) OLDCALL PRESERVES_REGS(b, c);


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

    @see SHOW_WIN, HIDE_WIN, set_win_submap, set_bkg_tiles, set_bkg_data, set_tiles
*/
void set_win_tiles(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *tiles) OLDCALL PRESERVES_REGS(b, c);


inline void set_win_based_tiles(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *tiles, uint8_t base_tile) {
    _map_tile_offset = base_tile;
    set_win_tiles(x, y, w, h, tiles);
    _map_tile_offset = 0;
}

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

    @see SHOW_WIN, HIDE_WIN, set_win_tiles, set_bkg_submap, set_bkg_tiles, set_bkg_data, set_tiles
**/
void set_win_submap(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *map, uint8_t map_w) OLDCALL;


/** Sets a rectangular area of the Window Tile Map using a sub-region
    from a source tile map and base_tile tile ID offset

    @param x         X Start position in Window Map tile coordinates. Range 0 - 31
    @param y         Y Start position in Wimdpw Map tile coordinates. Range 0 - 31
    @param w         Width of area to set in tiles. Range 1 - 255
    @param h         Height of area to set in tiles. Range 1 - 255
    @param map       Pointer to source tile map data
    @param map_w     Width of source tile map in tiles. Range 1 - 255
    @param base_tile Offset each tile ID of submap by this value

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

    @see SHOW_WIN, HIDE_WIN, set_win_tiles, set_bkg_submap, set_bkg_tiles, set_bkg_data, set_tiles
**/
inline void set_win_based_submap(uint8_t x, uint8_t y, uint8_t w, uint8_t h, const uint8_t *map, uint8_t map_w, uint8_t base_tile) {
    _submap_tile_offset = base_tile;
    set_win_submap(x, y, w, h, map, map_w);
    _submap_tile_offset = 0;
}


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

    @see get_bkg_tiles, get_bkg_tile_xy, get_tiles, get_vram_byte
*/
void get_win_tiles(uint8_t x, uint8_t y, uint8_t w, uint8_t h, uint8_t *tiles) OLDCALL PRESERVES_REGS(b, c);


/**
 * Set single tile t on window layer at x,y
 * @param x X-coordinate
 * @param y Y-coordinate
 * @param t tile index
 * @return returns the address of tile, so you may use faster set_vram_byte() later
 */
uint8_t * set_win_tile_xy(uint8_t x, uint8_t y, uint8_t t) OLDCALL PRESERVES_REGS(b, c);


/**
 * Get single tile t on window layer at x,y
 * @param x X-coordinate
 * @param y Y-coordinate
 * @return returns the tile index
 */
uint8_t get_win_tile_xy(uint8_t x, uint8_t y) OLDCALL PRESERVES_REGS(b, c);


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
void set_sprite_data(uint8_t first_tile, uint8_t nb_tiles, const uint8_t *data) OLDCALL PRESERVES_REGS(b, c);
#define set_sprite_2bpp_data set_sprite_data

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
void set_sprite_1bpp_data(uint8_t first_tile, uint8_t nb_tiles, const uint8_t *data) OLDCALL PRESERVES_REGS(b, c);

/** Copies from Sprite VRAM Tile Pattern data into a buffer

    @param first_tile  Index of the first tile to read from
    @param nb_tiles    Number of tiles to read
    @param data        Pointer to destination buffer for Tile Pattern data

    Copies __nb_tiles__ tiles from VRAM starting at __first_tile__, tile data
    is copied into __data__.

    Each Tile is 16 bytes, so the buffer pointed to by __data__
    should be at least __nb_tiles__ x 16 bytes in size.
*/
void get_sprite_data(uint8_t first_tile, uint8_t nb_tiles, uint8_t *data) OLDCALL PRESERVES_REGS(b, c);


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
#define MAX_HARDWARE_SPRITES 40

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
inline void set_sprite_prop(uint8_t nb, uint8_t prop) {
    shadow_OAM[nb].prop=prop;
}


/** Returns the OAM Property Flags of sprite number __nb__.

    @param nb    Sprite number, range 0 - 39
    @see set_sprite_prop for property bitfield settings
*/
inline uint8_t get_sprite_prop(uint8_t nb) {
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



/** Copies arbitrary data to an address in VRAM
    without taking into account the state of LCDC bits 3 or 4.

    @param vram_addr Pointer to destination VRAM Address
    @param data      Pointer to source buffer
    @param len       Number of bytes to copy

    Copies __len__ bytes from a buffer at __data__ to VRAM starting at __vram_addr__.

    GBC only: @ref VBK_REG determines which bank of Background tile patterns are written to.
    \li VBK_REG=0 indicates the first bank
    \li VBK_REG=1 indicates the second

    @see set_bkg_data, set_win_data, set_bkg_tiles, set_win_tiles, set_tile_data, set_tiles
*/
void set_data(uint8_t *vram_addr, const uint8_t *data, uint16_t len) OLDCALL PRESERVES_REGS(b, c);


/** Copies arbitrary data from an address in VRAM into a buffer
    without taking into account the state of LCDC bits 3 or 4.

    @param vram_addr Pointer to source VRAM Address
    @param data      Pointer to destination buffer
    @param len       Number of bytes to copy

    Copies __len__ bytes from VRAM starting at __vram_addr__ into a buffer at __data__.

    GBC only: @ref VBK_REG determines which bank of Background tile patterns are written to.
    \li VBK_REG=0 indicates the first bank
    \li VBK_REG=1 indicates the second

    @see get_bkg_data, get_win_data, get_bkg_tiles, get_win_tiles, get_tiles
*/
void get_data(uint8_t *data, uint8_t *vram_addr, uint16_t len) OLDCALL PRESERVES_REGS(b, c);

/** Copies arbitrary data from an address in VRAM into a buffer

    @param dest      Pointer to destination buffer (may be in VRAM)
    @param sour      Pointer to source buffer (may be in VRAM)
    @param len       Number of bytes to copy

    Copies __len__ bytes from or to VRAM starting at __sour__ into a buffer or to VRAM at __dest__.

    GBC only: @ref VBK_REG determines which bank of Background tile patterns are written to.
    \li VBK_REG=0 indicates the first bank
    \li VBK_REG=1 indicates the second
*/
void vmemcpy(uint8_t *dest, uint8_t *sour, uint16_t len) OLDCALL PRESERVES_REGS(b, c);



/** Sets a rectangular region of Tile Map entries at a given VRAM Address
    without taking into account the state of LCDC bit 3.

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

    @see set_bkg_tiles, set_win_tiles
*/
void set_tiles(uint8_t x, uint8_t y, uint8_t w, uint8_t h, uint8_t *vram_addr, const uint8_t *tiles) OLDCALL PRESERVES_REGS(b, c);

/** Sets VRAM Tile Pattern data starting from given base address
    without taking into account the state of LCDC bit 4.

    @param first_tile  Index of the first tile to write
    @param nb_tiles    Number of tiles to write
    @param data        Pointer to (2 bpp) source Tile Pattern data.
	@param base        MSB of the destination address in VRAM (usually 0x80 or 0x90 which gives 0x8000 or 0x9000)

    @see set_bkg_data, set_win_data, set_data
*/
void set_tile_data(uint8_t first_tile, uint8_t nb_tiles, const uint8_t *data, uint8_t base) OLDCALL PRESERVES_REGS(b, c);

/** Copies a rectangular region of Tile Map entries from a given VRAM Address into a buffer
    without taking into account the state of LCDC bit 3.

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

    @see get_bkg_tiles, get_win_tiles
*/
void get_tiles(uint8_t x, uint8_t y, uint8_t w, uint8_t h, uint8_t *vram_addr, uint8_t *tiles) OLDCALL PRESERVES_REGS(b, c);


/** Sets VRAM Tile Pattern data in the native format

    @param first_tile  Index of the first tile to write (0 - 511)
    @param nb_tiles    Number of tiles to write
    @param data        Pointer to source Tile Pattern data.

    When `first_tile` is larger than 256 on the GB/AP, it
    will write to sprite data instead of background data.

    The bit depth of the source Tile Pattern data depends
    on which console is being used:
    \li Game Boy/Analogue Pocket: loads 2bpp tiles data
    \li SMS/GG: loads 4bpp tile data
 */
inline void set_native_tile_data(uint16_t first_tile, uint8_t nb_tiles, const uint8_t *data) {
    if (first_tile < 256) {
        set_bkg_data(first_tile, nb_tiles, data);
    } else {
        set_sprite_data(first_tile - 256, nb_tiles, data);
    }
}


/** Initializes the entire Window Tile Map with Tile Number __c__
    @param c   Tile number to fill with

    Note: This function avoids writes during modes 2 & 3
*/
void init_win(uint8_t c) OLDCALL PRESERVES_REGS(b, c);

/** Initializes the entire Background Tile Map with Tile Number __c__
    @param c   Tile number to fill with

    Note: This function avoids writes during modes 2 & 3
*/
void init_bkg(uint8_t c) OLDCALL PRESERVES_REGS(b, c);

/** Fills the VRAM memory region __s__ of size __n__ with Tile Number __c__
    @param s   Start address in VRAM
    @param c   Tile number to fill with
    @param n   Size of memory region (in bytes) to fill

    Note: This function avoids writes during modes 2 & 3
*/
void vmemset (void *s, uint8_t c, size_t n) OLDCALL PRESERVES_REGS(b, c);



/** Fills a rectangular region of Tile Map entries for the Background layer with tile.

    @param x      X Start position in Background Map tile coordinates. Range 0 - 31
    @param y      Y Start position in Background Map tile coordinates. Range 0 - 31
    @param w      Width of area to set in tiles. Range 0 - 31
    @param h      Height of area to set in tiles. Range 0 - 31
    @param tile   Fill value
*/
void fill_bkg_rect(uint8_t x, uint8_t y, uint8_t w, uint8_t h, uint8_t tile) OLDCALL PRESERVES_REGS(b, c);
#define fill_rect fill_bkg_rect

/** Fills a rectangular region of Tile Map entries for the Window layer with tile.

    @param x      X Start position in Window Map tile coordinates. Range 0 - 31
    @param y      Y Start position in Window Map tile coordinates. Range 0 - 31
    @param w      Width of area to set in tiles. Range 0 - 31
    @param h      Height of area to set in tiles. Range 0 - 31
    @param tile   Fill value
*/
void fill_win_rect(uint8_t x, uint8_t y, uint8_t w, uint8_t h, uint8_t tile) OLDCALL PRESERVES_REGS(b, c);

#endif /* _GB_H */
