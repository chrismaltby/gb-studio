#pragma bank 3

#include <stdint.h>

uint16_t banked_func(uint8_t be, uint8_t ef) __banked {
  return ((be << 8) | ef);
}