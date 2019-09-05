#include <limits.h>

/* convert float to unsigned int */
unsigned int __fs2uint (float f) {
  unsigned long ul=__fs2ulong(f);
  if (ul>=UINT_MAX) return UINT_MAX;
  return ul;
}

