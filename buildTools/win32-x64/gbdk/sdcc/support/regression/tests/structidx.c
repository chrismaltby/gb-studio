/* Code to generate code to see how structure indexs are evaluated.
   Originally part of gbdk/examples/gb/paint.c

 */
#include <testfwk.h>

typedef unsigned char UBYTE;

typedef struct cursor_info_
{
  UBYTE data_idx;
  UBYTE w, h;
  UBYTE hot_x, hot_y;
} cursor_info;

const cursor_info cursors[] =
{
  { 0, 1, 1, 0, 0 },
  { 1, 2, 2, 0, 15 },
  { 5, 2, 2, 0, 15 },
  { 9, 2, 2, 2, 15 },
  { 13, 2, 2, 0, 15 },
  { 17, 2, 2, 5, 10 }
};

UBYTE current_cursor;

UBYTE
getWidth(void)
{
  return cursors[current_cursor].w;
}
