/** @file string.h
    Generic string functions.
 */
#ifndef STRING_INCLUDE
#define STRING_INCLUDE

#include <types.h>

/** Copies the string pointed to by __src__ (including the terminating
    `\0' character) to the array pointed to by __dest__.

    The strings may not overlap, and the destination string dest must
    be large enough to receive the copy.

    @param dest			Array to copy into
    @param src			Array to copy from

    @return 			A pointer to dest
*/
char *strcpy(char *dest, const char *src) OLDCALL PRESERVES_REGS(b, c);

/** Compares strings

    @param s1         First string to compare
    @param s2         Second string to compare

    Returns:
    \li > 0 if __s1__ > __s2__
    \li 0 if __s1__ == __s2__
    \li < 0 if __s1__ < __s2__
*/
int strcmp(const char *s1, const char *s2) OLDCALL PRESERVES_REGS(b, c);

/** Copies n bytes from memory area src to memory area dest.

    The memory areas may not overlap.

    @param dest			Buffer to copy into
    @param src			Buffer to copy from
    @param len			Number of Bytes to copy
*/
void *memcpy(void *dest, const void *src, size_t len);

/** Copies n bytes from memory area src to memory area dest, areas may overlap
 */
void *memmove (void *dest, const void *src, size_t n);

/** Fills the memory region __s__ with __n__ bytes using value __c__

    @param s         Buffer to fill
    @param c         char value to fill with (truncated from int)
    @param n         Number of bytes to fill
*/
void *memset (void *s, int c, size_t n) OLDCALL PRESERVES_REGS(b, c);

/** Reverses the characters in a string

    @param s         Pointer to string to reverse.

    For example 'abcdefg' will become 'gfedcba'.

    Banked as the string must be modifiable.

    Returns: Pointer to __s__
*/
char *reverse(char *s) OLDCALL PRESERVES_REGS(b, c);

/** Concatenate Strings. Appends string __s2__ to the end of string __s1__

    @param s1         String to append onto
    @param s2         String to copy from

    For example 'abc' and 'def' will become 'abcdef'.

    String __s1__ must be large enough to store both __s1__ and __s2__.

    Returns: Pointer to __s1__
*/
char *strcat(char *s1, const char *s2);

/** Calculates the length of a string

    @param s         String to calculate length of

    Returns: Length of string not including the terminating `\0' character.
*/
int strlen(const char *s) OLDCALL PRESERVES_REGS(b, c);

/**Concatenate at most __n__ characters from string __s2__ onto the end of __s1__.

    @param s1         String to append onto
    @param s2         String to copy from
    @param n          Max number of characters to copy from __s2__

    String __s1__ must be large enough to store both __s1__ and __n__ characters of __s2__

    Returns: Pointer to __s1__
*/
char *strncat(char *s1, const char *s2, int n);

/** Compare strings (at most __n__ characters):

    @param s1         First string to compare
    @param s2         Second string to compare
    @param n          Max number of characters to compare

    Returns zero if the strings are identical, or non-zero
    if they are not (see below).

    Returns:
    \li > 0 if __s1__ > __s2__ (at first non-matching byte)
    \li 0 if __s1__ == __s2__
    \li < 0 if __s1__ < __s2__ (at first non-matching byte)
*/
int strncmp(const char *s1, const char *s2, int n);

/** Copy __n__ characters from string __s2__ to __s1__


    @param s1         String to copy into
    @param s2         String to copy from
    @param n          Max number of characters to copy from __s2__

    If __s2__ is shorter than __n__, the remaining
    bytes in __s1__ are filled with \0.

    Warning: If there is no \0 in the first __n__ bytes of __s2__ then __s1__
    will not be null terminated.

    Returns: Pointer to __s1__
*/
char *strncpy(char *s1, const char *s2, int n);

/** Compare up to __count__ bytes in buffers __buf1__ and __buf2__

    @param buf1         Pointer to First buffer to compare
    @param buf2         Pointer to Second buffer to compare
    @param count        Max number of bytes to compare

    Returns zero if the buffers are identical, or non-zero
    if they are not (see below).

    Returns:
    \li > 0 if __buf1__ > __buf2__ (at first non-matching byte)
    \li 0 if __buf1__ == __buf2__
    \li < 0 if __buf1__ < __buf2__ (at first non-matching byte)
*/
int memcmp(const void *buf1, const void *buf2, size_t count) OLDCALL;

#endif
