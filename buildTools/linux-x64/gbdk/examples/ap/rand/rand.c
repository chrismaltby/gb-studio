/***************************************************************************
 *                                                                         *
 * Module  : rand.c                                                        *
 *                                                                         *
 * Purpose : A test for the rand() function, for the GBDK                  *
 *                                                                         *
 * Version : 1, Januari 6 1998                                             *
 *                                                                         *
 * Author  : Luc Van den Borre ( Homepage : NOC.BASE.ORG )                 *
 *                                                                         *
 **************************************************************************/

#include <gb/gb.h>
#include <stdint.h>
#include <rand.h>
#include <gb/drawing.h>
#include <stdio.h>
#include <string.h>

uint8_t accu[80];
uint8_t accua[80];

void main(void)
{
  uint8_t r, s, t = 0, u = 0;
  uint16_t seed;

  memset(accu, 0, sizeof(accu));
  memset(accua, 0, sizeof(accua));

  /* We use the DIV register to get a random initial seed */
  puts("Getting seed");
  puts("Push any key (1)");
  waitpad(0xFF);
  waitpadup();
  seed = DIV_REG;
  puts("Push any key (2)");
  waitpad(0xFF);
  waitpadup();
  seed |= (uint16_t)DIV_REG << 8;

  /* initarand() calls initrand() */
  initarand(seed);

  do {
    r = rand();
    s = arand();

    if(r < 80) {
      t = ++accu[r];
      plot(r, 144-t, LTGREY, SOLID);
    }
    if(s < 80) {
      u = ++accua[s];
      plot(s+80, 144-u, DKGREY, SOLID);
    }
  }
  while(t != 144 && u != 144); 
}
