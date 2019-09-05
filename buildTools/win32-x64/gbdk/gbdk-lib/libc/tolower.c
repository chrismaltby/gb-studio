#include <ctype.h>

char tolower(char c)
{
  return ((c >= 'A' && c <= 'Z') ? c + 32: c);
}
