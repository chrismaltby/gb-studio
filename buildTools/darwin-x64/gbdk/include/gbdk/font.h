/** @file gbdk/font.h
    Multiple font support for the GameBoy
    Michael Hope, 1999
    michaelh@earthling.net
*/
#ifndef __FONT_H
#define __FONT_H

#include <types.h>
#include <stdint.h>

/** Various flags in the font header.
 */
#define	FONT_256ENCODING	0
#define	FONT_128ENCODING	1
#define	FONT_NOENCODING		2

#define	FONT_COMPRESSED		4

/* See gb.h/M_NO_SCROLL and gb.h/M_NO_INTERP */

/** font_t is a handle to a font loaded by font_load().
    It can be used with @ref font_set() */
typedef uint16_t font_t;


/*! \defgroup gbdk_fonts List of gbdk fonts
   @{
*/

/** The default fonts */
extern uint8_t font_spect[], font_italic[], font_ibm[], font_min[];

/** Backwards compatible font */
extern uint8_t font_ibm_fixed[];

 /*! @} End of gbdk_fonts */


/** Initializes the font system.
    Should be called before other font functions.
 */
void font_init();

/** Load a font and set it as the current font.
    @param font   Pointer to a font to load (usually a gbdk font)

    @return       Handle to the loaded font, which can be used with @ref font_set()
    @see font_init(), font_set(), gbdk_fonts
 */
font_t font_load(void *font) OLDCALL;

/** Set the current font.
    @param font_handle   handle of a font returned by @ref font_load()

    @return		The previously used font handle.
    @see font_init(), font_load()
*/
font_t font_set(font_t font_handle) OLDCALL;

/* Use mode() and color() to set the font modes and colours */

/** Internal representation of a font.
    What a font_t really is */
typedef struct sfont_handle mfont_handle;
typedef struct sfont_handle *pmfont_handle;

/** Font handle structure
*/
struct sfont_handle {
    uint8_t first_tile;		/**< First tile used for font */
    void *font;			/**< Pointer to the base of the font */
};

/** Set the current __foreground__ colour (for pixels), __background__ colour */
void font_color(uint8_t forecolor, uint8_t backcolor) OLDCALL;

#endif /* __FONT_H */
