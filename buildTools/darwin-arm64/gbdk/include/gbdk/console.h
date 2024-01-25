/** @file gbdk/console.h
    Console functions that work like Turbo C's.

    The font is 8x8, making the screen 20x18 characters.
*/
#ifndef _CONSOLE_H
#define _CONSOLE_H

#include <types.h>
#include <stdint.h>

/** Move the cursor to an absolute position at __x, y__.

    __x__ and __y__ have units of tiles (8 pixels per unit)
    @see setchar()
 */
void gotoxy(uint8_t x, uint8_t y) OLDCALL;

/** Returns the current X position of the cursor.

    @see gotoxy()
 */
uint8_t posx() OLDCALL;

/** Returns the current Y position of the cursor.

    @see gotoxy()
 */
uint8_t posy() OLDCALL;

/** Writes out a single character at the current cursor
    position.

    Does not update the cursor or interpret the character.

    @see gotoxy()
*/
void setchar(char c) OLDCALL;

/** Clears the screen
*/
void cls();


#endif /* _CONSOLE_H */
