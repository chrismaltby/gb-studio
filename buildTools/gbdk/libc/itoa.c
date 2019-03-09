#include <stdlib.h>
#include <types.h>
#include <string.h>

char *itoa(int n, char *s)
{
  UINT8 i, sign;

  if(n < 0) {
    sign = 1;
    n = -n;
  } else
    sign = 0;
  i = 0;
  do {
    s[i++] = n % 10 + '0';
  } while((n = n/10) > 0);
  if(sign)
    s[i++] = '-';
  s[i] = 0;
  reverse(s);
  return s;
}
