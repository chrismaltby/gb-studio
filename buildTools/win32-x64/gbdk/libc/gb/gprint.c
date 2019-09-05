#include <gb/drawing.h>

void gprint(char *str) NONBANKED
{
    while(*str)
	wrtchr(*str++);
}
