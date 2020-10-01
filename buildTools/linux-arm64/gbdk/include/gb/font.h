/** @file gb/font.h
    Multiple font support for the GameBoy
    Michael Hope, 1999
    michaelh@earthling.net
*/
#ifndef __FONT_H
#define __FONT_H

#include <gb/gb.h>

/** Various flags in the font header.
 */
#define	FONT_256ENCODING	0
#define	FONT_128ENCODING	1
#define	FONT_NOENCODING		2

#define	FONT_COMPRESSED		4

/* See gb.h/M_NO_SCROLL and gb.h/M_NO_INTERP */

/** font_t is a handle to a font loaded by font_load() */
typedef UINT16 font_t;

/** The default fonts */
extern UINT8 font_spect[], font_italic[], font_ibm[], font_min[];

/** Backwards compatible font */
extern UINT8 font_ibm_fixed[];

/** Init the font system.
    Should be called first.
 */
void	font_init(void) NONBANKED;

/** Load the font 'font'.
    Sets the current font to the newly loaded font.
 */
font_t	font_load( void *font ) NONBANKED;

/** Set the current font to 'font_handle', which was returned 
    from an earlier font_load().  
    @return		The previously used font handle.
*/
font_t	font_set( font_t font_handle ) NONBANKED;

/* Use mode() and color() to set the font modes and colours */

/** Internal representation of a font.  
    What a font_t really is */
typedef struct sfont_handle mfont_handle;
typedef struct sfont_handle *pmfont_handle;

struct sfont_handle {
    UINT8 first_tile;		/* First tile used */
    void *font;			/* Pointer to the base of the font */
};

#endif /* __FONT_H */
