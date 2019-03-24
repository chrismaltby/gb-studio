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
#include <rand.h>
#include <gb/drawing.h>
#include <stdio.h>

UBYTE accu[80];
UBYTE accua[80];

UWORD seed;

void main(void)
{
  UBYTE r, s, t, u;

  for(r = 0; r != 80; r++) {
    accu[r] = 0;
    accua[r] = 0;
  }

  /* We use the DIV register to get a random initial seed */
  puts("Getting seed");
  puts("Push any key (1)");
  waitpad(0xFF);
  waitpadup();
  seed = DIV_REG;
  puts("Push any key (2)");
  waitpad(0xFF);
  waitpadup();
  seed |= (UWORD)DIV_REG << 8;

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
