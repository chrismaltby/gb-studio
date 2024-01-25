#include <gbdk/platform.h>
#include <stdint.h>
#include <stdio.h>

// Banked const vars from the other source files
//
// "BANKREF_EXTERN()" makes a "BANKREF()" reference
// from another source file accessible for use with "BANK()"
//
// The entries below could also be in separate, matching
// ".h" header files for each banked ".c" source file,
// instead of here at the start of "banks.c".
extern const uint8_t some_const_var_1;
BANKREF_EXTERN(some_const_var_1)

extern const uint8_t some_const_var_2;
BANKREF_EXTERN(some_const_var_2)

extern const uint8_t some_const_var_3;
BANKREF_EXTERN(some_const_var_3)

extern const uint8_t some_const_var_4;
BANKREF_EXTERN(some_const_var_4)

// Banked functions from the other source files
void func_1() BANKED;
BANKREF_EXTERN(func_1)

void func_2() BANKED;
BANKREF_EXTERN(func_2)

void func_3() BANKED;
BANKREF_EXTERN(func_3)

void some_4() BANKED;
BANKREF_EXTERN(some_4)

// Non-banked const
const uint8_t some_const_var_0 = 0;

// Non-banked function
void bank_fixed(void) NONBANKED
{
  puts("I'm in fixed ROM");
}

void main(void)
{
  set_default_palette();
  printf("Program Start...\n\n");

  // Call the functions, unbanked first then the banked ones
  bank_fixed();


  func_1();
  func_2();
  func_3();
  some_4();

  printf("\n");

  // Print the const vars, unbanked first then the banked ones
  printf("Const0= %u nonbanked\n", some_const_var_0);

  SWITCH_ROM(BANK(some_const_var_1));
  printf("Const1= %u in bank %hu\n", some_const_var_1, BANK(some_const_var_1));
  SWITCH_ROM(BANK(some_const_var_2));
  printf("Const2= %u in bank %hu\n", some_const_var_2, BANK(some_const_var_2));
  SWITCH_ROM(BANK(some_const_var_3));
  printf("Const3= %u in bank %hu\n", some_const_var_3, BANK(some_const_var_3));
  SWITCH_ROM(BANK(some_const_var_4));
  printf("Const4= %u in bank %hu\n", some_const_var_4, BANK(some_const_var_4));

  printf("\n");
  puts("The End...");

  // Loop endlesslu
  while(1) {
    // Yield CPU till the end of each frame
    wait_vbl_done();
  }
}
