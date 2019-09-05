#include <stdlib.h>
#include <ctype.h>

long atol(const char *s) NONBANKED
{
  UINT8 i, sign = 0;
  long n;

  for(i = 0; (s[i] == ' ') || (s[i] == '\n') || (s[i] == '\t'); ++i)
    ;
  switch(s[i])
    {
    case '-':
      sign++;
      /* and fall through */
    case '+':
      ++i;
      break;
    }
  for(n = 0; isdigit(s[i]); ++i)
    n = 10 * n + s[i] - '0';
  return (sign == 0 ? n : -n);
}
