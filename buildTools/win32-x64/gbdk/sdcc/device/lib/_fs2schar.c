#include <limits.h>

/* convert float to signed char */
signed char __fs2schar (float f) {
  signed long sl=__fs2slong(f);
  if (sl>=CHAR_MAX)
    return CHAR_MAX;
  if (sl<=CHAR_MIN) 
    return -CHAR_MIN;
  return sl;
}
