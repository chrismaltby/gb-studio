#include <ctype.h>

char toupper(char c)
{
  return ((c >= 'a' && c <= 'z') ? c - 32: c);
}
