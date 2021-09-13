/** @file sms/sms.h
    SMS/GG specific functions.
*/
#ifndef _SMS_H
#define _SMS_H

#define __GBDK_VERSION 405

#include <types.h>
#include <stdint.h>
#include <sms/hardware.h>

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
#define	J_START      0b01000000
#define	J_SELECT     0b01000000
#define	J_B          0b00100000
#define	J_A          0b00010000
#define	J_DOWN       0b00000010
#define	J_UP         0b00000001
#define	J_LEFT       0b00000100
#define	J_RIGHT      0b00001000

#define __WRITE_VDP_REG(REG, v) shadow_##REG=(v);__critical{VDP_CMD=(shadow_##REG),VDP_CMD=REG;}
#define __READ_VDP_REG(REG) shadow_##REG

void WRITE_VDP_CMD(uint16_t cmd) __z88dk_fastcall __preserves_regs(b, c, d, e, iyh, iyl);
void WRITE_VDP_DATA(uint16_t data) __z88dk_fastcall __preserves_regs(b, c, d, e, iyh, iyl);

/** Interrupt handlers
 */
typedef void (*int_handler)(void) NONBANKED;

/** Removes the VBL interrupt handler. 
    @see add_VBL()
*/
void remove_VBL(int_handler h) __z88dk_fastcall __preserves_regs(iyh, iyl);

/** Removes the LCD interrupt handler.
    @see add_LCD(), remove_VBL()
*/
void remove_LCD(int_handler h) __z88dk_fastcall __preserves_regs(b, c, iyh, iyl);

void remove_TIM(int_handler h);
void remove_SIO(int_handler h);
void remove_JOY(int_handler h);

/** Adds a V-blank interrupt handler.
*/
void add_VBL(int_handler h) __z88dk_fastcall __preserves_regs(d, e, iyh, iyl);

/** Adds a LCD interrupt handler.
*/
void add_LCD(int_handler h) __z88dk_fastcall __preserves_regs(b, c, iyh, iyl);

void add_TIM(int_handler h);
void add_SIO(int_handler h);
void add_JOY(int_handler h);


void vmemcpy(uint16_t dst, const void *src, uint16_t size) __z88dk_callee __preserves_regs(iyh, iyl);

void set_bkg_data(uint8_t start, uint8_t ntiles, const void *src) __z88dk_callee __preserves_regs(iyh,iyl);
void set_bkg_2bpp_data(uint8_t start, uint8_t ntiles, const void *src) __z88dk_callee __preserves_regs(iyh,iyl);

inline void move_bkg(uint8_t x, uint8_t y) {
	__WRITE_VDP_REG(VDP_RSCX, x);
	__WRITE_VDP_REG(VDP_RSCY, y);
}

inline void scroll_bkg(int8_t x, int8_t y) {
	__WRITE_VDP_REG(VDP_RSCX, __READ_VDP_REG(VDP_RSCX) + x);
	__WRITE_VDP_REG(VDP_RSCY, __READ_VDP_REG(VDP_RSCY) + y);
}

/** HALTs the CPU and waits for the vertical blank interrupt (VBL) to finish.

    This is often used in main loops to idle the CPU at low power
    until it's time to start the next frame. It's also useful for
    syncing animation with the screen re-draw.

    Warning: If the VBL interrupt is disabled, this function will
    never return. If the screen is off this function returns
    immediately.
*/
void wait_vbl_done(void) __preserves_regs(b, c, d, e, h, l, iyh, iyl);

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


/** Makes switch the active ROM bank in frame 1
    @param b   ROM bank to switch to
*/

#define SWITCH_ROM(b) MAP_FRAME1 = (b)


/** Reads and returns the current state of the joypad.
*/
uint8_t joypad(void) __preserves_regs(b, c, d, e, h, iyh, iyl);

/** Waits until at least one of the buttons given in mask are pressed.
*/
uint8_t waitpad(uint8_t mask) __z88dk_fastcall __preserves_regs(b, c, d, e, iyh, iyl);

/** Waits for the directional pad and all buttons to be released.

    Note: Checks in a loop that doesn't HALT at all, so the CPU
    will be maxed out until this call returns.
*/
void waitpadup(void) __preserves_regs(b, c, d, e, iyh, iyl);

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
uint8_t joypad_init(uint8_t npads, joypads_t * joypads) __z88dk_callee;

/** Polls all avaliable joypads
    @param joypads	pointer to joypads_t structure to be filled with joypad statuses,
    	   must be previously initialized with joypad_init()

    @see joypad_init(), joypads_t
*/
void joypad_ex(joypads_t * joypads) __z88dk_fastcall __preserves_regs(iyh, iyl);


#ifdef __TARGET_sms
#define RGB(r,g,b)        ((r)|((g)<<2)|((b)<<4))
#define RGB8(r,g,b)       (((r)>>6)|(((g)>>6)<<2)|(((b)>>6)<<4))
#define RGBHTML(RGB24bit) (((RGB24bit)>>22)|((((RGB24bit)&0xFFFF)>>14)<<2)|((((RGB24bit)&0xFF)>>6)<<4))
#else
#ifdef __TARGET_gg
#define RGB(r,g,b)        ((r)|((g)<<4)|((b)<<8))
#define RGB8(r,g,b)       (((r)>>4)|(((g)>>4)<<4)|(((b)>>4)<<8))
#define RGBHTML(RGB24bit) (((RGB24bit)>>20)|((((RGB24bit)&0xFFFF)>>12)<<4)|((((RGB24bit)&0xFF)>>4)<<8))
#endif
#endif

void set_bkg_palette_entry(uint8_t palette, uint8_t entry, uint16_t rgb_data) __z88dk_callee __preserves_regs(iyh, iyl);
void set_sprite_palette_entry(uint8_t palette, uint8_t entry, uint16_t rgb_data) __z88dk_callee __preserves_regs(iyh, iyl);
void set_bkg_palette(uint8_t first_palette, uint8_t nb_palettes, uint16_t *rgb_data) __z88dk_callee;
void set_sprite_palette(uint8_t first_palette, uint8_t nb_palettes, uint16_t *rgb_data) __z88dk_callee;


#endif /* _SMS_H */
