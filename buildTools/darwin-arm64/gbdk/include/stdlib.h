/** file stdlib.h
    'Standard library' functions, for whatever that means.
*/
#ifndef STDLIB_INCLUDE
#define STDLIB_INCLUDE

#include <types.h>

#if !defined(__SDCC_mcs51) && !defined(__SDCC_ds390) && !defined(__SDCC_ds400) && !defined(__SDCC_hc08) && !defined(__SDCC_s08) && !defined(__SDCC_pic14) && !defined(__SDCC_pic16) && !defined(__SDCC_pdk13) && !defined(__SDCC_pdk14) && !defined(__SDCC_pdk15)
#define __reentrant
#endif

/** Causes normal program termination and the value of status is
    returned to the parent.
    All open streams are flushed and closed.
*/
void exit(int status);

#if 0
/** Compatibility function.  Not implemented.
 */
int getkey(void);
#endif

/** Returns the absolute value of int __i__
    @param i   Int to obtain absolute value of

    If i is negative, returns -i; else returns i.
*/
int abs(int i) OLDCALL;


/** Returns the absolute value of long int __num__

    @param num   Long integer to obtain absolute value of
 */
long labs(long num) OLDCALL;


/** Converts an ASCII string to an int

    @param s    String to convert to an int

    The string may be of the format
    \code{.c}
     [\s]*[+-][\d]+[\D]*
     \endcode
    i.e. any number of spaces, an optional + or -, then an
    arbitrary number of digits.

    The result is undefined if the number doesnt fit in an int.

    Returns: Int value of string
 */
int atoi(const char *s);


/** Converts an ASCII string to a long.
    @param s    String to convert to an long int
    @see atoi()

    Returns: Long int value of string
 */
long atol(const char *s);

/** Converts an int into a base 10 ASCII string.
    @param n      Int to convert to a string
    @param s      String to store the converted number
    @param radix  Numerical base for converted number, ex: 10 is decimal base
                  (parameter is required but not utilized on Game Boy and Analogue Pocket)

    Returns:    Pointer to converted string
 */
char *itoa(int n, char *s, unsigned char radix) OLDCALL;

/** Converts an unsigned int into a base 10 ASCII string.
    @param n      Unsigned Int to convert to a string
    @param s      String to store the converted number
    @param radix  Numerical base for converted number, ex: 10 is decimal base
                  (parameter is required but not utilized on Game Boy and Analogue Pocket)

    Returns:    Pointer to converted string
 */
char *uitoa(unsigned int n, char *s, unsigned char radix) OLDCALL;

/** Converts a long into a base 10 ASCII string.
    @param n      Long int to convert to a string
    @param s      String to store the converted number
    @param radix  Numerical base for converted number, ex: 10 is decimal base
                  (parameter is required but not utilized on Game Boy and Analogue Pocket)

    Returns:    Pointer to converted string
 */
char *ltoa(long n, char *s, unsigned char radix) OLDCALL;

/** Converts an unsigned long into a base 10 ASCII string.
    @param n      Unsigned Long Int to convert to a string
    @param s      String to store the converted number
    @param radix  Numerical base for converted number, ex: 10 is decimal base
                  (parameter is required but not utilized on Game Boy and Analogue Pocket)

    Returns:    Pointer to converted string
 */
char *ultoa(unsigned long n, char *s, unsigned char radix) OLDCALL;


/** Memory allocation functions
 */
void *calloc (size_t nmemb, size_t size);
void *malloc (size_t size);
void *realloc (void *ptr, size_t size);
#if __STDC_VERSION__ >= 201112L
inline void *aligned_alloc(size_t alignment, size_t size)
{
  (void)alignment;
  return malloc(size);
}
#endif
extern void free (void * ptr);

/* Searching and sorting utilities (ISO C11 7.22.5) */
/** search a sorted array of __nmemb__ items
    @param key      Pointer to object that is the key for the search
    @param base     Pointer to first object in the array to search
    @param nmemb    Number of elements in the array
    @param size     Size in bytes of each element in the array
    @param compar   Function used to compare two elements of the array

    Returns: Pointer to array entry that matches the search key.
             If key is not found, NULL is returned.
*/
extern void *bsearch(const void *key, const void *base, size_t nmemb, size_t size, int (*compar)(const void *, const void *) __reentrant);


/** Sort an array of __nmemb__ items
    @param base     Pointer to first object in the array to sort
    @param nmemb    Number of elements in the array
    @param size     Size in bytes of each element in the array
    @param compar   Function used to compare and sort two elements of the array
*/
extern void qsort(void *base, size_t nmemb, size_t size, int (*compar)(const void *, const void *) __reentrant);

#endif
