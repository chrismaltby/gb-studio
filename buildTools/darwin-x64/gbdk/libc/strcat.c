#include <string.h>

/*
 * Concatenate s2 on the end of s1. s1 must be large enough.
 * Return s1.
 */

char *strcat(char *s1, const char *s2) NONBANKED
{
  char *os1;

  os1 = s1;
  while(*s1++)
    ;
  --s1;
  while(*s1++ = *s2++)
    ;
  return os1;
}
