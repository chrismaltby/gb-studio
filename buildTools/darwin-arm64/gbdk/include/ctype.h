/** @file ctype.h
    Character type functions.
*/
#ifndef _CTYPE_H
#define _CTYPE_H

#include <types.h>
#include <stdbool.h>

/** Returns TRUE if the character __c__ is a letter (a-z, A-Z), otherwise FALSE
    @param c    Character to test
*/
bool isalpha(char c);

/** Returns TRUE if the character __c__ is an uppercase letter (A-Z), otherwise FALSE
    @param c    Character to test
*/
bool isupper(char c);

/** Returns TRUE if the character __c__ is a lowercase letter (a-z), otherwise FALSE
    @param c    Character to test
*/
bool islower(char c);

/** Returns TRUE if the character __c__ is a digit (0-9), otherwise FALSE
    @param c    Character to test
*/
bool isdigit(char c);

/** Returns TRUE if the character __c__ is a space (' '), tab (\\t), or newline (\\n) character, otherwise FALSE
    @param c    Character to test
*/
bool isspace(char c);

/** Returns uppercase version of character __c__  if it is a letter (a-z), otherwise it returns the input value unchanged.
    @param c    Character to test
*/
char toupper(char c);

/** Returns lowercase version of character __c__  if it is a letter (A-Z), otherwise it returns the input value unchanged.
    @param c    Character to test
*/
char tolower(char c);

#endif /* _CTYPE_H */
