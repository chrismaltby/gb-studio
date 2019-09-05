/* Testing arithmetics with long litterals
 */

#include <testfwk.h>

#define OSCILLATOR 11059200
#define BAUD 19200

#define T1_RELOAD_VALUE -(2*OSCILLATOR)/(32*12*BAUD)

unsigned char T1=T1_RELOAD_VALUE;

void test (void) {
  ASSERT(T1==0xfd);
}
