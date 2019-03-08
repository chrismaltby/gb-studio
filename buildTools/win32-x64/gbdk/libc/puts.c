#include <stdio.h>

void puts(const char *s)
{
    while (*s)
	putchar(*s++);
    putchar('\n');
}
