#include <8051.h>
#include <stdio.h>

#include "hw.h"

void main(void) {
  unsigned long ms;
  unsigned int seconds, oldseconds=ClockTicks()/1000;

  printf ("Example using the core timer to generate seconds.\n");

  while (1) {
    ms=ClockTicks();
    seconds=ms/1000;
    if (oldseconds!=seconds) {
      oldseconds=seconds;
      printf ("%02d:%02d.%02d %ld\n", 
	      (int)seconds/3600, (int)(seconds/60)%60, 
	      (int)seconds%60, ms);
    }
    if (RI) {
      putchar(getchar());
      printf("%ld\n\r", ClockTicks());
    }
  }
}
