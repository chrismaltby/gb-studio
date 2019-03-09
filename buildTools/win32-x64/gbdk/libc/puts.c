#include <stdio.h>

void puts(const char *s) NONBANKED
{
    while (*s)
	putchar(*s++);
    putchar('\n');
}
