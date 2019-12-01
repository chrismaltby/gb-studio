/** @file ctype.h
    Character type functions.
*/
#ifndef _CTYPE_H
#define _CTYPE_H

#include <types.h>

BOOLEAN
isalpha(char c);

BOOLEAN
isupper(char c);

BOOLEAN
islower(char c);

BOOLEAN
isdigit(char c);

BOOLEAN
isspace(char c);

char
toupper(char c);

char
tolower(char c);

#endif /* _CTYPE_H */
