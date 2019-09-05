#include <limits.h>

/* convert float to unsigned char */
unsigned char __fs2uchar (float f) {
  unsigned long ul=__fs2ulong(f);
  if (ul>=UCHAR_MAX) return UCHAR_MAX;
  return ul;
}

