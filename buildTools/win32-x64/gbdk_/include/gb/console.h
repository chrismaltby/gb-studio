/** @file gb/console.h
    Console functions that work like Turbo C's.
    Note that the font is 8x8, making the screen 20x18 characters.
*/
#ifndef _CONSOLE_H
#define _CONSOLE_H

#include <types.h>

/** Move the cursor to an absolute position.
 */
void
gotoxy(UINT8 x,
	   UINT8 y);

/** Get the current X position of the cursor.
 */
UINT8
posx(void);

/** Get the current Y position of the cursor.
 */
UINT8
posy(void);

/** Writes out a single character at the current cursor
    position.
    Does not update the cursor or interpret the character.
*/
void
setchar(char c);

#endif /* _CONSOLE_H */
