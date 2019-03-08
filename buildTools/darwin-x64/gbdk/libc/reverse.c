#include <stdlib.h>
#include <string.h>
#include <types.h>

char *reverse(char *s)
{
  UINT8 i, j;
  char c;

  i = 0;
  j = strlen(s) - 1;
  while(i < j) {
    c = s[i];
    s[i] = s[j];
    s[j] = c;
    i++;
    j--;
  }
  return(s);
}
