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

#if STRICT_ANSI
void putchar(int c);
#else
/** Write the character __c__ to stdout.
*/
void putchar(char c);
#endif

/** Print the string and arguments given by format to stdout.

    @param format   The format string as per printf

    Does not return the number of characters printed.

    Currently supported:
    \li \%c (character)
    \li \%u (unsigned int)
    \li \%d (signed int)
    \li \%x (unsigned int as hex)
    \li \%s (string)
 */
void printf(const char *format, ...) NONBANKED;

/** Print the string and arguments given by format to a buffer.

    @param str		The buffer to print into
    @param format	The format string as per @ref printf

    Does not return the number of characters printed.
 */
void sprintf(char *str, const char *format, ...) NONBANKED;

/** puts() writes the string __s__ and a trailing newline to stdout.
*/
void puts(const char *s) NONBANKED;

/** gets() Reads a line from stdin into a buffer pointed to by __s__.

    @param s    Buffer to store string in

    Reads until either a terminating newline or an EOF, which it replaces with '\0'. No
    check for buffer overrun is performed.

    Returns: Buffer pointed to by __s__
*/
char *gets(char *s);

/** getchar() Reads and returns a single character from stdin.
 */
char getchar(void);

#endif
