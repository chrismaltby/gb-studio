#include <stdlib.h>

long labs(long num)
{
  if(num < 0)
    return -num;
  else
    return num;
}
