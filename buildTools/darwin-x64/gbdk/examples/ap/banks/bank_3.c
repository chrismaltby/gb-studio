#include <gb/gb.h>
#include <stdint.h>
#include <stdio.h>

int var_3;  /* In external RAM bank 3 */

void bank_3() BANKED /* In ROM bank 3 */
{
  puts("I'm in ROM bank 3");
}
