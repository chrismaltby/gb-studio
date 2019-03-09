#include <string.h>

/*
 * Concatenate s2 on the end of s1. s1 must be large enough.
 * At most n characters are moved.
 * Return s1.
 */

char *strncat(char *s1, const char *s2, int n) NONBANKED
{
  char *os1;

  os1 = s1;
  while(*s1++)
    ;
  --s1;
  while(*s1++ = *s2++) {
    if(n == 0) {
      *--s1 = '\0';
      break;
    }
    n--;
  }
  return os1;
}
