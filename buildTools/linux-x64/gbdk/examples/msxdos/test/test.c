#include <gbdk/platform.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void main(void) {
  uint8_t data[32];
  uint16_t score = 75;
  printf("%d %s", strlen(uitoa(score, data, 10)), data);
}
