/** @file gb/drawing.h
    All Points Addressable (APA) mode drawing library.

    Drawing routines originally by Pascal Felber
    Legendary overhall by Jon Fuge <jonny@q-continuum.demon.co.uk>
    Commenting by Michael Hope

    Note that the standard text printf() and putchar() cannot be used
    in APA mode - use gprintf() and wrtchr() instead.
*/
#ifndef __DRAWING_H
#define __DRAWING_H

/** Size of the screen in pixels */
#define GRAPHICS_WIDTH	160
#define GRAPHICS_HEIGHT 144

/** Possible drawing modes */
#if ORIGINAL
	#define	SOLID	0x10		/* Overwrites the existing pixels */
	#define	OR	0x20		/* Performs a logical OR */
	#define	XOR	0x40		/* Performs a logical XOR */
	#define	AND	0x80		/* Performs a logical AND */
#else
	#define	SOLID	0x00		/* Overwrites the existing pixels */
	#define	OR	0x01		/* Performs a logical OR */
	#define	XOR	0x02		/* Performs a logical XOR */
	#define	AND	0x03		/* Performs a logical AND */
#endif

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
void
	gprint(char *str) NONBANKED;

/** Print 16 bit __number__ in  __radix__ (base) in the default font at the current text position.

    @param number number to print
    @param radix radix (base) to print with
    @param signed_value should be set to SIGNED or UNSIGNED depending on whether the number is signed or not

    The current position is advanced by the numer of characters printed.
    @see gotogxy()
*/
void
	gprintln(INT16 number, INT8 radix, INT8 signed_value);

/** Print 8 bit __number__ in  __radix__ (base) in the default font at the current text position.

    @see gprintln(), gotogxy()
*/
void
	gprintn(INT8 number, INT8 radix, INT8 signed_value);

/** Print the string and arguments given by __fmt__ with arguments __...__

    @param fmt   The format string as per printf
    @param ...   params

    Currently supported:
    \li \%c (character)
    \li \%u (int)
    \li \%d (INT8)
    \li \%o (INT8 as octal)
    \li \%x (INT8 as hex)
    \li \%s (string)

    @return Returns the number of items printed, or -1 if there was an error.
    @see gotogxy()
*/
INT8
	gprintf(char *fmt,...) NONBANKED;

/** Old style plot - try @ref plot_point() */
void
	plot(UINT8 x, UINT8 y, UINT8 colour, UINT8 mode);

/** Plot a point in the current drawing mode and colour at __x,y__ */
void
	plot_point(UINT8 x, UINT8 y);

/** Exchanges the tile on screen at x,y with the tile pointed by src, original tile
    is saved in dst. Both src and dst may be NULL - saving or copying to screen is
    not performed in this case. */
void
	switch_data(UINT8 x, UINT8 y, unsigned char *src, unsigned char *dst) NONBANKED;

/** Draw a full screen image at __data__ */
void
	draw_image(unsigned char *data) NONBANKED;

/** Draw a line in the current drawing mode and colour from __x1,y1__ to __x2,y2__ */
void
	line(UINT8 x1, UINT8 y1, UINT8 x2, UINT8 y2);

/** Draw a box (rectangle) with corners __x1,y1__ and __x2,y2__ using fill mode
   __style__ (one of NOFILL or FILL) */
void
	box(UINT8 x1, UINT8 y1, UINT8 x2, UINT8 y2, UINT8 style);

/** Draw a circle with centre at __x,y__ and __radius__ using fill mode
   __style__  (one of NOFILL or FILL)*/
void
	circle(UINT8 x, UINT8 y, UINT8 radius, UINT8 style);

/** Returns the current colour of the pixel at __x,y__ */
UINT8
	getpix(UINT8 x, UINT8 y);

/** Prints the character __chr__ in the default font at the current text position.

    The current position is advanced by 1 after the character is printed.
    @see gotogxy() */
void
	wrtchr(char chr);

/** Sets the current text position to __x,y__.

    Note: __x__ and __y__ have units of tiles (8 pixels per unit)
    @see wrtchr() */
void
	gotogxy(UINT8 x, UINT8 y);

/** Set the current __foreground__ colour (for pixels), __background__ colour, and
   draw __mode__ */
void	color(UINT8 forecolor, UINT8 backcolor, UINT8 mode);

#endif /* __DRAWING_H */
