#include <string.h>

/* Return length of string */

int strlen(const char *s) NONBANKED
{
    int i;

    i = 0;
    while(*s++)
	i++;
    return i;
}
