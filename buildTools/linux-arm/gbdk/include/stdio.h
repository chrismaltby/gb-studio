/** @file stdio.h
    Basic file/console input output functions.
 */
#ifndef STDIO_INCLUDE
#define STDIO_INCLUDE

#include <types.h>

#if STRICT_ANSI
void putchar(int c);
#else
/** Put the character 'c' to stdout. */
void putchar(char c);
#endif

/** Print the string and arguments given by format to stdout.
    Currently supported: \%c (character), \%u (unsigned int), 
    \%d (signed int), \%x (unsigned int as hex), and \%s (string).
    Does not return the number of characters printed.
 */
void printf(const char *format, ...) NONBANKED;

/** Print the string and arguments given by format to a buffer.
    Currently supported: \%c (character), \%u (unsigned int), 
    \%d (signed int), \%x (unsigned int as hex), and \%s (string).
    Does not return the number of characters printed.

    @param str		The buffer to print into.
    @param format	The format string as per printf.
 */
void sprintf(char *str, const char *format, ...) NONBANKED;

/** puts() writes the string s and a trailing newline to  std­
    out.
*/
void puts(const char *s) NONBANKED;

/** gets() reads a line from stdin into the buffer pointed to by s until
    either a terminating newline or EOF, which it replaces with '\0'.  No
    check for buffer overrun is per­ formed.
*/
char *gets(char *s);

/** getchar() gets a single character from stdin.
 */
char getchar(void);

#endif
