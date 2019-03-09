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

/** Print the string 'str' with no interpretation */
void
	gprint(char *str) NONBANKED;

/** Print the long number 'number' in radix 'radix'.  signed_value should
   be set to SIGNED or UNSIGNED depending on whether the number is signed
   or not */
void
	gprintln(INT16 number, INT8 radix, INT8 signed_value);

/** Print the number 'number' as in 'gprintln' */
void	
	gprintn(INT8 number, INT8 radix, INT8 signed_value);

/** Print the formatted string 'fmt' with arguments '...' */
INT8	
	gprintf(char *fmt,...) NONBANKED;

/** Old style plot - try plot_point() */
void
	plot(UINT8 x, UINT8 y, UINT8 colour, UINT8 mode);

/** Plot a point in the current drawing mode and colour at (x,y) */
void	
	plot_point(UINT8 x, UINT8 y);

/** I (MLH) have no idea what switch_data does... */
void
	switch_data(UINT8 x, UINT8 y, unsigned char *src, unsigned char *dst) NONBANKED;

/** Ditto */
void	
	draw_image(unsigned char *data) NONBANKED;

/** Draw a line in the current drawing mode and colour from (x1,y1) to (x2,y2) */
void	
	line(UINT8 x1, UINT8 y1, UINT8 x2, UINT8 y2);

/** Draw a box (rectangle) with corners (x1,y1) and (x2,y2) using fill mode
   'style' (one of NOFILL or FILL */
void	
	box(UINT8 x1, UINT8 y1, UINT8 x2, UINT8 y2, UINT8 style);

/** Draw a circle with centre at (x,y) and radius 'radius'.  'style' sets
   the fill mode */
void	
	circle(UINT8 x, UINT8 y, UINT8 radius, UINT8 style);

/** Returns the current colour of the pixel at (x,y) */
UINT8	
	getpix(UINT8 x, UINT8 y);

/** Prints the character 'chr' in the default font at the current position */
void	
	wrtchr(char chr);

/** Sets the current text position to (x,y).  Note that x and y have units
   of cells (8 pixels) */
void
	gotogxy(UINT8 x, UINT8 y);

/** Set the current foreground colour (for pixels), background colour, and
   draw mode */
void	color(UINT8 forecolor, UINT8 backcolor, UINT8 mode);

#endif /* __DRAWING_H */
