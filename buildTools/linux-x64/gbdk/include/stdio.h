/** @file stdio.h
    Basic file/console input output functions.

    Including stdio.h will use a large number of the
    background tiles for font characters. If stdio.h
    is not included then that space will be available
    for use with other tiles instead.
 */
#ifndef STDIO_INCLUDE
#define STDIO_INCLUDE

#include <types.h>

/** Print char to stdout.
    @param c            Character to print
 */

void putchar(char c) OLDCALL REENTRANT;

/** Print the string and arguments given by format to stdout.

    @param format   The format string as per printf

    Does not return the number of characters printed.

    Currently supported:
    \li \%hx (char as hex)
    \li \%hu (unsigned char)
    \li \%hd (signed char)
    \li \%c (character)
    \li \%u (unsigned int)
    \li \%d (signed int)
    \li \%x (unsigned int as hex)
    \li \%s (string)

    Warning: to correctly pass parameters (such as chars, ints, etc)
    __all of them should always be explicitly cast__ as when calling
    the function.
    See @ref docs_chars_varargs for more details.
 */
void printf(const char *format, ...);

/** Print the string and arguments given by format to a buffer.

    @param str		The buffer to print into
    @param format	The format string as per @ref printf

    Does not return the number of characters printed.

    Warning: to correctly pass parameters (such as chars, ints, etc)
    __all of them should always be explicitly cast__ as when calling
    the function.
    See @ref docs_chars_varargs for more details.
 */
void sprintf(char *str, const char *format, ...);

/** puts() writes the string __s__ and a trailing newline to stdout.
*/
void puts(const char *s);

/** gets() Reads a line from stdin into a buffer pointed to by __s__.

    @param s    Buffer to store string in

    Reads until either a terminating newline or an EOF, which it replaces with '\0'. No
    check for buffer overrun is performed.

    Returns: Buffer pointed to by __s__
*/
char *gets(char *s) OLDCALL;

/** getchar() Reads and returns a single character from stdin.
 */
char getchar(void) OLDCALL;

#endif
