/** @file gb/gb.h
    Gameboy specific functions.
*/
#ifndef _GB_H
#define _GB_H

#include <types.h>
#include <gb/hardware.h>
#include <gb/sgb.h>
#include <gb/cgb.h>

/** Joypad bits.
    A logical OR of these is used in the wait_pad and joypad
    functions.  For example, to see if the B button is pressed
    try

    UINT8 keys;
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
 */
#define	M_DRAWING    0x01U
#define	M_TEXT_OUT   0x02U
#define	M_TEXT_INOUT 0x03U
/** Set this in addition to the others to disable scrolling 
    If scrolling is disabled, the cursor returns to (0,0) */
#define M_NO_SCROLL  0x04U
/** Set this to disable \n interpretation */
#define M_NO_INTERP  0x08U

/** If this is set, sprite colours come from OBJ1PAL.  Else
    they come from OBJ0PAL.
*/
#define S_PALETTE    0x10U
/** If set the sprite will be flipped horizontally.
 */
#define S_FLIPX      0x20U
/** If set the sprite will be flipped vertically.
 */
#define S_FLIPY      0x40U
/** If this bit is clear, then the sprite will be displayed
    ontop of the background and window.
*/
#define S_PRIORITY   0x80U

/* Interrupt flags */
/** Vertical blank interrupt.
    Occurs at the start of the vertical blank.  During this
    period the video ram may be freely accessed.
 */
#define VBL_IFLAG    0x01U
/** Interrupt when triggered by the STAT register.
    See the Pan doc.
*/
#define LCD_IFLAG    0x02U
/** Interrupt when the timer TIMA overflows.
 */
#define TIM_IFLAG    0x04U
/** Occurs when the serial transfer has completed.
 */
#define SIO_IFLAG    0x08U
/** Occurs on a transition of the keypad.
 */
#define JOY_IFLAG    0x10U

/* Limits */
/** Width of the visible screen in pixels.
 */
#define SCREENWIDTH  0xA0U
/** Height of the visible screen in pixels.
 */
#define SCREENHEIGHT 0x90U
#define MINWNDPOSX   0x07U
#define MINWNDPOSY   0x00U
#define MAXWNDPOSX   0xA6U
#define MAXWNDPOSY   0x8FU

/* ************************************************************ */

/** Interrupt handlers
 */
typedef void (*int_handler)(void) NONBANKED;

/** The remove functions will remove any interrupt
   handler.  A handler of NULL will cause bad things
   to happen.
*/
void
remove_VBL(int_handler h) NONBANKED;

void
remove_LCD(int_handler h) NONBANKED;

void
remove_TIM(int_handler h) NONBANKED;

void
remove_SIO(int_handler h) NONBANKED;

void
remove_JOY(int_handler h) NONBANKED;

/** Adds a V-blank interrupt handler.
    The handler 'h' will be called whenever a V-blank
    interrupt occurs.  Up to 4 handlers may be added,
    with the last added being called last.  If the remove_VBL
    function is to be called, only three may be added.
    @see remove_VBL
*/
void
add_VBL(int_handler h) NONBANKED;

/** Adds a LCD interrupt handler.
    Called when the LCD interrupt occurs, which is normally
    when LY_REG == LYC_REG.

    From pan/k0Pa:
    There are various reasons for this interrupt to occur
    as described by the STAT register ($FF40). One very
    popular reason is to indicate to the user when the
    video hardware is about to redraw a given LCD line.
    This can be useful for dynamically controlling the SCX/
    SCY registers ($FF43/$FF42) to perform special video
    effects.

    @see add_VBL
*/
void
add_LCD(int_handler h) NONBANKED;

/** Adds a timer interrupt handler.

    From pan/k0Pa:
    This interrupt occurs when the TIMA register ($FF05)
    changes from $FF to $00.

    @see add_VBL
*/    
void
add_TIM(int_handler h) NONBANKED;

/** Adds a serial transmit complete interrupt handler.

    From pan/k0Pa:
    This interrupt occurs when a serial transfer has
    completed on the game link port.
    
    @see send_byte, receive_byte, add_VBL
*/
void
add_SIO(int_handler h) NONBANKED;

/** Adds a pad tranisition interrupt handler.
    
    From pan/k0Pa:
    This interrupt occurs on a transition of any of the
    keypad input lines from high to low. Due to the fact
    that keypad "bounce" is virtually always present,
    software should expect this interrupt to occur one
    or more times for every button press and one or more
    times for every button release.

    @see joypad
*/
void
add_JOY(int_handler h) NONBANKED;

/* ************************************************************ */

/** Set the current mode - one of M_* defined above */
void
	mode(UINT8 m) NONBANKED;

/** Returns the current mode */
UINT8
	get_mode(void) NONBANKED;

/** GB type (GB, PGB, CGB) */
extern UINT8 _cpu;

/** Original GB or Super GB */
#define DMG_TYPE 0x01 
/** Pocket GB or Super GB 2 */
#define MGB_TYPE 0xFF
/** Color GB */
#define CGB_TYPE 0x11 

/** Time in VBL periods (60Hz) */
extern UINT16 sys_time;	

/* ************************************************************ */

/** Send byte in _io_out to the serial port */
void
send_byte(void);

/** Receive byte from the serial port in _io_in */
void
receive_byte(void);

/** An OR of IO_* */
extern UINT8 _io_status;
/** Byte just read. */
extern UINT8 _io_in;
/** Write the byte to send here before calling send_byte()
    @see send_byte
*/
extern UINT8 _io_out;

/* Status codes */
/** IO is completed */
#define IO_IDLE		0x00U		
/** Sending data */
#define IO_SENDING	0x01U		
/** Receiving data */
#define IO_RECEIVING	0x02U		
/** Error */
#define IO_ERROR	0x04U		

/* ************************************************************ */

/* Multiple banks */

/** Switches the upper 16k bank of the 32k rom to bank rombank 
    using the MBC1 controller. 
    By default the upper 16k bank is 1. Make sure the rom you compile 
    has more than just bank 0 and bank 1, a 32k rom. This is done by 
    feeding lcc.exe the following switches:

    -Wl-yt# where # is the type of cartridge. 1 for ROM+MBC1.

    -Wl-yo# where # is the number of rom banks. 2,4,8,16,32.
*/
#define SWITCH_ROM_MBC1(b) \
  *(unsigned char *)0x2000 = (b)

#define SWITCH_RAM_MBC1(b) \
  *(unsigned char *)0x4000 = (b)

#define ENABLE_RAM_MBC1 \
  *(unsigned char *)0x0000 = 0x0A

#define DISABLE_RAM_MBC1 \
  *(unsigned char *)0x0000 = 0x00

/* Note the order used here.  Writing the other way around
 * on a MBC1 always selects bank 0 (d'oh)
 */
/** MBC5 */
#define SWITCH_ROM_MBC5(b) \
  *(unsigned char *)0x3000 = (UINT16)(b)>>8; \
  *(unsigned char *)0x2000 = (UINT8)(b)

#define SWITCH_RAM_MBC5(b) \
  *(unsigned char *)0x4000 = (b)

#define ENABLE_RAM_MBC5 \
  *(unsigned char *)0x0000 = 0x0A

#define DISABLE_RAM_MBC5 \
  *(unsigned char *)0x0000 = 0x00

/* ************************************************************ */

/** Delays the given number of milliseconds.
    Uses no timers or interrupts, and can be called with 
    interrupts disabled (why nobody knows :)
 */
void
delay(UINT16 d) NONBANKED;

/* ************************************************************ */

/** Reads and returns the current state of the joypad.
    Follows Nintendo's guidelines for reading the pad.
    Return value is an OR of J_*
    @see J_START
*/
UINT8
joypad(void) NONBANKED;

/** Waits until all the keys given in mask are pressed.
    Normally only used for checking one key, but it will
    support many, even J_LEFT at the same time as J_RIGHT :)
    @see joypad, J_START
*/
UINT8
waitpad(UINT8 mask) NONBANKED;

/** Waits for the pad and all buttons to be released.
*/
void
waitpadup(void) NONBANKED;

/* ************************************************************ */

/** Enables unmasked interrupts
    @see disable_interrupts
*/
void
enable_interrupts(void) NONBANKED;

/** Disables interrupts.
    This function may be called as many times as you like;
    however the first call to enable_interrupts will re-enable
    them.
    @see enable_interrupts
*/
void
disable_interrupts(void) NONBANKED;

/** Clears any pending interrupts and sets the interrupt mask
    register IO to flags.
    @see VBL_IFLAG
    @param flags	A logical OR of *_IFLAGS
*/
void
set_interrupts(UINT8 flags) NONBANKED;

/** Performs a warm reset by reloading the CPU value
    then jumping to the start of crt0 (0x0150)
*/
void
reset(void) NONBANKED;

/** Waits for the vertical blank interrupt (VBL) to finish.  
    This can be used to sync animation with the screen 
    re-draw.  If VBL interrupt is disabled, this function will
    never return.  If the screen is off this function returns
    immediatly.
*/
void
wait_vbl_done(void) NONBANKED;

/** Turns the display off.
    Waits until the VBL interrupt before turning the display
    off.
    @see DISPLAY_ON
*/
void
display_off(void) NONBANKED;

/* ************************************************************ */

/** Copies data from somewhere in the lower address space
    to part of hi-ram.
    @param dst		Offset in high ram (0xFF00 and above)
    			to copy to.
    @param src		Area to copy from
    @param n		Number of bytes to copy.
*/
void
hiramcpy(UINT8 dst,
	 const void *src,
	 UINT8 n) NONBANKED;

/* ************************************************************ */

/** Turns the display back on.
    @see display_off, DISPLAY_OFF
*/
#define DISPLAY_ON \
  LCDC_REG|=0x80U

/** Turns the display off immediatly.
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

/* ************************************************************ */

/** Sets the tile patterns in the Background Tile Pattern table.
    Starting with the tile pattern x and carrying on for n number of
    tile patterns.Taking the values starting from the pointer
    data. Note that patterns 128-255 overlap with patterns 128-255
    of the sprite Tile Pattern table.  

    GBC: Depending on the VBK_REG this determines which bank of
    Background tile patterns are written to. VBK_REG=0 indicates the
    first bank, and VBK_REG=1 indicates the second.

    @param first_tile	Range 0 - 255
    @param nb_tiles	Range 0 - 255
*/
void
set_bkg_data(UINT8 first_tile,
	     UINT8 nb_tiles,
	     unsigned char *data) NONBANKED;

/** Sets the tiles in the background tile table.
    Starting at position x,y in tiles and writing across for w tiles
    and down for h tiles. Taking the values starting from the pointer
    data.

    For the GBC, also see the pan/k00Pa section on VBK_REG.

    @param x		Range 0 - 31
    @param y		Range 0 - 31
    @param w		Range 0 - 31
    @param h		Range 0 - 31
    @param data		Pointer to an unsigned char. Usually the 
    			first element in an array.
*/
void
set_bkg_tiles(UINT8 x,
	      UINT8 y,
	      UINT8 w,
	      UINT8 h,
	      unsigned char *tiles) NONBANKED;

void
get_bkg_tiles(UINT8 x,
	      UINT8 y,
	      UINT8 w,
	      UINT8 h,
	      unsigned char *tiles) NONBANKED;

/** Moves the background layer to the position specified in x and y in pixels.
    Where 0,0 is the top left corner of the GB screen. You'll notice the screen
    wraps around in all 4 directions, and is always under the window layer.
*/
void
move_bkg(UINT8 x,
	 UINT8 y) NONBANKED;

/** Moves the background relative to it's current position.

    @see move_bkg
*/
void
scroll_bkg(INT8 x,
	   INT8 y) NONBANKED;

/* ************************************************************ */

/** Sets the window tile data.
    This is the same as set_bkg_data, as both the window layer and background
    layer share the same Tile Patterns.
    @see set_bkg_data
*/
void
set_win_data(UINT8 first_tile,
	     UINT8 nb_tiles,
	     unsigned char *data) NONBANKED;

/** Sets the tiles in the win tile table. 
    Starting at position x,y in
    tiles and writing across for w tiles and down for h tiles. Taking the
    values starting from the pointer data. Note that patterns 128-255 overlap
    with patterns 128-255 of the sprite Tile Pattern table.
	
    GBC only.
    Depending on the VBK_REG this determines if you're setting the tile numbers
    VBK_REG=0; or the attributes for those tiles VBK_REG=1;. The bits in the
    attributes are defined as:
    Bit 7 - 	Priority flag. When this is set, it puts the tile above the sprites
    		with colour 0 being transparent. 0: below sprites, 1: above sprites
		Note SHOW_BKG needs to be set for these priorities to take place.
    Bit 6 - 	Vertical flip. Dictates which way up the tile is drawn vertically.
    		0: normal, 1: upside down.
    Bit 5 - 	Horizontal flip. Dictates which way up the tile is drawn
    		horizontally. 0: normal, 1:back to front.
    Bit 4 - 	Not used.
    Bit 3 - 	Character Bank specification. Dictates from which bank of
    		Background Tile Patterns the tile is taken. 0: Bank 0, 1: Bank 1
    Bit 2 - 	See bit 0.
    Bit 1 - 	See bit 0. 
    Bit 0 - 	Bits 0-2 indicate which of the 7 BKG colour palettes the tile is
		assigned.

    @param x		Range 0 - 31
    @param y		Range 0 - 31
    @param w		Range 0 - 31
    @param h		Range 0 - 31
*/
void
set_win_tiles(UINT8 x,
	      UINT8 y,
	      UINT8 w,
	      UINT8 h,
	      unsigned char *tiles) NONBANKED;

void
get_win_tiles(UINT8 x,
	      UINT8 y,
	      UINT8 w,
	      UINT8 h,
	      unsigned char *tiles) NONBANKED;

/** Moves the window layer to the position specified in x and y in pixels.
    Where 7,0 is the top left corner of the GB screen. The window is locked to
    the bottom right corner, and is always over the background layer.
    @see SHOW_WIN, HIDE_WIN
*/
void
move_win(UINT8 x,
	 UINT8 y) NONBANKED;

/** Move the window relative to its current position.
    @see move_win
*/
void
scroll_win(INT8 x,
	   INT8 y) NONBANKED;

/* ************************************************************ */

/** Sets the tile patterns in the Sprite Tile Pattern table.
    Starting with the tile pattern x and carrying on for n number of
    tile patterns.Taking the values starting from the pointer
    data. Note that patterns 128-255 overlap with patterns 128-255 of
    the Background Tile Pattern table.
    
    GBC only.
    Depending on the VBK_REG this determines which bank of Background tile
    patterns are written to. VBK_REG=0 indicates the first bank, and VBK_REG=1
    indicates the second.
*/
void
set_sprite_data(UINT8 first_tile,
		UINT8 nb_tiles,
		unsigned char *data) NONBANKED;

void
get_sprite_data(UINT8 first_tile,
		UINT8 nb_tiles,
		unsigned char *data) NONBANKED;

/** Sets sprite n to display tile number t, from the sprite tile data. 
    If the GB is in 8x16 sprite mode then it will display the next
    tile, t+1, below the first tile.
    @param nb		Sprite number, range 0 - 39
*/
void
set_sprite_tile(UINT8 nb,
		UINT8 tile) NONBANKED;

UINT8
get_sprite_tile(UINT8 nb) NONBANKED;

/** Sets the property of sprite n to those defined in p.
    Where the bits in p represent:
    Bit 7 - 	Priority flag. When this is set the sprites appear behind the
		background and window layer. 0: infront, 1: behind.
    Bit 6 - 	GBC only. Vertical flip. Dictates which way up the sprite is drawn
		vertically. 0: normal, 1:upside down.
    Bit 5 - 	GBC only. Horizontal flip. Dictates which way up the sprite is
    drawn horizontally. 0: normal, 1:back to front.
    Bit 4 - 	DMG only. Assigns either one of the two b/w palettes to the sprite.
		0: OBJ palette 0, 1: OBJ palette 1.
    Bit 3 -	GBC only. Dictates from which bank of Sprite Tile Patterns the tile
		is taken. 0: Bank 0, 1: Bank 1
    Bit 2 -	See bit 0.
    Bit 1 -	See bit 0. 
    Bit 0 - 	GBC only. Bits 0-2 indicate which of the 7 OBJ colour palettes the
		sprite is assigned.
    
    @param nb		Sprite number, range 0 - 39
*/
void
set_sprite_prop(UINT8 nb,
		UINT8 prop) NONBANKED;

UINT8
get_sprite_prop(UINT8 nb) NONBANKED;

/** Moves the given sprite to the given position on the
    screen.
    Dont forget that the top left visible pixel on the screen
    is at (8,16).  To put sprite 0 at the top left, use
    move_sprite(0, 8, 16);
*/
void
move_sprite(UINT8 nb,
	    UINT8 x,
	    UINT8 y) NONBANKED;

/** Moves the given sprite relative to its current position.
 */
void
scroll_sprite(INT8 nb,
	      INT8 x,
	      INT8 y) NONBANKED;

/* ************************************************************ */

void
set_data(unsigned char *vram_addr,
	 unsigned char *data,
	 UINT16 len) NONBANKED;

void
get_data(unsigned char *data,
	 unsigned char *vram_addr,
	 UINT16 len) NONBANKED;

void
set_tiles(UINT8 x,
	  UINT8 y,
	  UINT8 w,
	  UINT8 h,
	  unsigned char *vram_addr,
	  unsigned char *tiles) NONBANKED;

void
get_tiles(UINT8 x,
	  UINT8 y,
	  UINT8 w,
	  UINT8 h,
	  unsigned char *tiles,
	  unsigned char *vram_addr) NONBANKED;

#endif /* _GB_H */
