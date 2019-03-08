#include <gb/drawing.h>

void gprint(char *str)
{
  while(*str)
    wrtchr(*str++);
}
