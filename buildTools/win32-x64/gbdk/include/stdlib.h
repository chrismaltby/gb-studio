/** file stdlib.h
    'Standard library' functions, for whatever that means.
*/
#ifndef STDLIB_INCLUDE
#define STDLIB_INCLUDE

/** Causes normal program termination and the value of status is
    returned to the parent.
    All open streams are flushed and closed.
*/
void exit(int status);

#if 0
/** Compatibility function.  Not implemented.
 */
int getkey(void);

int abs(int i);
int atoi(const char *s);
long atol(const char *s);
char *itoa(int n, char *s);
long labs(long num);
char *ltoa(long n, char *s);

#endif

#endif
