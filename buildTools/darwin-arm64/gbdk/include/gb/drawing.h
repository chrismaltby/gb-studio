/** @file gb/drawing.h
    All Points Addressable (APA) mode drawing library.

    Drawing routines originally by Pascal Felber
    Legendary overhall by Jon Fuge : https://github.com/jf1452
    Commenting by Michael Hope

    Note: The standard text printf() and putchar() cannot be used
    in APA mode - use gprintf() and wrtchr() instead.

    Note: Using drawing.h will cause it's custom VBL and LCD ISRs
    (`drawing_vbl` and `drawing_lcd`) to be installed. Changing
    the mode (`mode(M_TEXT_OUT);`) will cause them to be de-installed.

    The valid coordinate ranges are from (x,y) 0,0 to 159,143.
    There is no built-in clipping, so drawing outside valid
    coordinates will likely produce undesired results (wrapping/etc).

    ----

    __Important note for the drawing API :__

    The Game Boy graphics hardware is not well suited to frame-buffer
    style graphics such as the kind provided in `drawing.h`.
    Due to that, __most drawing functions (rectangles, circles, etc) will
    be slow__ . When possible it's much faster and more efficient
    to work with the tiles and tile maps that the Game Boy hardware is
    built around.
*/
#ifndef __DRAWING_H
#define __DRAWING_H

#include <types.h>
#include <stdint.h>

/** Size of the screen in pixels */
#define GRAPHICS_WIDTH	160
#define GRAPHICS_HEIGHT 144

#define	SOLID   0x00	    /* Overwrites the existing pixels */
#define	OR	    0x01        /* Performs a logical OR */
#define	XOR	    0x02		/* Performs a logical XOR */
#define	AND	    0x03		/* Performs a logical AND */

/** Possible drawing colours */
#define	WHITE	0
#define	LTGREY	1
#define	DKGREY	2
#define	BLACK	3

/** Possible fill styles for box() and circle() */
#define	M_NOFILL	0
#define	M_FILL		1

/** Possible values for signed_value in gprintln() and gprintn() */
#define SIGNED   1
#define UNSIGNED 0

#include <types.h>

/** Print the string 'str' with no interpretation
    @see gotogxy()
*/
void gprint(char *str) NONBANKED;

/** Print 16 bit __number__ in  __radix__ (base) in the default font at the current text position.

    @param number number to print
    @param radix radix (base) to print with
    @param signed_value should be set to SIGNED or UNSIGNED depending on whether the number is signed or not

    The current position is advanced by the numer of characters printed.
    @see gotogxy()
*/
void gprintln(int16_t number, int8_t radix, int8_t signed_value) NONBANKED;

/** Print 8 bit __number__ in  __radix__ (base) in the default font at the current text position.

    @see gprintln(), gotogxy()
*/
void gprintn(int8_t number, int8_t radix, int8_t signed_value) NONBANKED;

/** Print the string and arguments given by __fmt__ with arguments __...__

    @param fmt   The format string as per printf
    @param ...   params

    Currently supported:
    \li \%c (character)
    \li \%u (int)
    \li \%d (int8_t)
    \li \%o (int8_t as octal)
    \li \%x (int8_t as hex)
    \li \%s (string)

    @return Returns the number of items printed, or -1 if there was an error.
    @see gotogxy()
*/
int8_t gprintf(char *fmt,...) NONBANKED;

/** Old style plot - try @ref plot_point() */
void plot(uint8_t x, uint8_t y, uint8_t colour, uint8_t mode) OLDCALL;

/** Plot a point in the current drawing mode and colour at __x,y__ */
void plot_point(uint8_t x, uint8_t y) OLDCALL;

/** Exchanges the tile on screen at x,y with the tile pointed by src, original tile
    is saved in dst. Both src and dst may be NULL - saving or copying to screen is
    not performed in this case. */
void switch_data(uint8_t x, uint8_t y, uint8_t *src, uint8_t *dst) OLDCALL;

/** Draw a full screen image at __data__ */
void draw_image(uint8_t *data);

/** Draw a line in the current drawing mode and colour from __x1,y1__ to __x2,y2__ */
void line(uint8_t x1, uint8_t y1, uint8_t x2, uint8_t y2) OLDCALL;

/** Draw a box (rectangle) with corners __x1,y1__ and __x2,y2__ using fill mode
   __style__ (one of NOFILL or FILL) */
void box(uint8_t x1, uint8_t y1, uint8_t x2, uint8_t y2, uint8_t style) OLDCALL;

/** Draw a circle with centre at __x,y__ and __radius__ using fill mode
   __style__  (one of NOFILL or FILL)*/
void circle(uint8_t x, uint8_t y, uint8_t radius, uint8_t style) OLDCALL;

/** Returns the current colour of the pixel at __x,y__ */
uint8_t getpix(uint8_t x, uint8_t y) OLDCALL;

/** Prints the character __chr__ in the default font at the current text position.

    The current position is advanced by 1 after the character is printed.
    @see gotogxy() */
void wrtchr(char chr) OLDCALL;

/** Sets the current text position to __x,y__.

    Note: __x__ and __y__ have units of tiles (8 pixels per unit)
    @see wrtchr() */
void gotogxy(uint8_t x, uint8_t y) OLDCALL;

/** Set the current __forecolor__ colour, __backcolor__ colour, and
   draw __mode__

    @param forecolor    The primary drawing color (outlines of
                        rectangles with @ref box(), letter color
                        with @ref gprintf(), etc).
    @param backcolor    Secondary or background color where applicable
                        (fill color of rectangles with @ref box() when
                        @ref M_FILL is specifed, background color of text
                        with @ref gprintf(), etc).
    @param mode         Drawing style to use. Several settings are available
                        `SOLID`, `OR`, `XOR`, `AND`.

   In order to completely overwrite existing pixels use `SOLID` for __mode__
*/
void color(uint8_t forecolor, uint8_t backcolor, uint8_t mode) OLDCALL;

#endif /* __DRAWING_H */
