/** @file string.h
    Generic string functions.
 */
#ifndef STRING_INCLUDE
#define STRING_INCLUDE

#include <types.h>

/** Copies the string pointed to be src (including the terminating
    `\0' character) to the array pointed to by dest.  
    The strings may not overlap, and the destination string dest must
    be large enough to receive the copy.

    @param dest			Array to copy into.
    @param src			Array to copy from.
    @return 			A pointer to dest.
*/
char *strcpy(char *dest, const char *src) NONBANKED;

/** Compares the two strings s1 and s2.  
    It returns an integer less than, equal to, or greater than zero if
    s1 is found, respectively, to be less than, to match, or be
    greater than s2.
*/
int strcmp(const char *s1, const char *s2) NONBANKED;

/** Copies n bytes from memory area src to memory area dest.  
    The memory areas may not overlap.

    @param dest			Array to copy into.
    @param src			Array to copy from.
    @param len			The length in bytes of src.
    @return 			A pointer to dest.
*/    
void *memcpy(void *dest, const void *src, size_t len) NONBANKED;

/** Reverses the characters in the string.  
    For example 'abcdefg' will become 'gfedcba'.  Banked as the string
    must be modifiable.
*/
char *reverse(char *s);

char *strcat(char *s1, const char *s2) NONBANKED;

/** Calculates the length of the string, not including the terminating
    `\0' character.
*/
int strlen(const char *s) NONBANKED;

/**Concatenate s2 on the end of s1. 
   s1 must be large enough.  At most n characters are moved.
*/
char *strncat(char *s1, const char *s2, int n) NONBANKED;

/** Compare strings (at most n bytes):
    s1>s2: >0
    s1==s2: 0
    s1<s2: <0
*/
int strncmp(const char *s1, const char *s2, int n) NONBANKED;

/** Copy s2 to s1, truncating or null-padding to always copy n bytes.
    If there is no \0 in the first n bytes of s2 then s1 will not be
    null terminated.
*/
char *strncpy(char *s1, const char *s2, int n) NONBANKED;

#endif
