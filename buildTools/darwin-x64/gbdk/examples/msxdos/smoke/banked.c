#pragma bank 3

#include <gbdk/platform.h>
#include <stdint.h>

uint16_t banked_func(uint8_t be, uint8_t ef) BANKED {
  return ((be << 8) | ef);
}