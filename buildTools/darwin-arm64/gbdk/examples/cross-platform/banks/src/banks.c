/** Note that this example is a bit old.  Try BANKED and NONBANKED
    as in banked/
 */
#include <gbdk/platform.h>
#include <stdint.h>
#include <stdio.h>

int var_internal;  /* In internal RAM */
extern int var_0;  /* In external RAM bank 0 */
extern int var_1;  /* In external RAM bank 1 */
extern int var_2;  /* In external RAM bank 2 */
extern int var_3;  /* In external RAM bank 3 */

void bank_1(void) BANKED;
void bank_2(void) BANKED;
void bank_3(void) BANKED;

void bank_fixed(void) NONBANKED
{
  puts("I'm in fixed ROM");
}

void main(void)
{
  puts("Program Start...");

  ENABLE_RAM;

  var_internal = 1;
  SWITCH_RAM(0);
  var_0 = 2;
  SWITCH_RAM(1);
  var_1 = 3;
  SWITCH_RAM(0);
  var_2 = 4;
  SWITCH_RAM(1);
  var_3 = 5;

  bank_fixed();
  bank_1();
  bank_2();
  bank_3();

  printf("Var is %u\n", var_internal);
  SWITCH_RAM(0);
  printf("Var_0 is %u\n", var_0);
  SWITCH_RAM(1);
  printf("Var_1 is %u\n", var_1);
  SWITCH_RAM(0);
  printf("Var_2 is %u\n", var_2);
  SWITCH_RAM(1);
  printf("Var_3 is %u\n", var_3);

  puts("The End...");
}
