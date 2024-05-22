#include <gbdk/platform.h>
#include <stdint.h>
#include <stdio.h>

// The header files below include provide bank references for the
// banked const vars and functions in the other source files
#include "srcfile_1.h"
#include "srcfile_2.h"
#include "srcfile_3.h"
#include "srcfile_4_not-autobanked.h"


// Non-banked const
const uint8_t some_const_var_0 = 0;

// Non-banked function
void bank_fixed(void) NONBANKED
{
  puts("I'm in fixed ROM");
}

void main(void)
{
  uint8_t _saved_bank;

  #if !defined(MSXDOS) && !defined(NINTENDO_NES) // TODO
  set_default_palette();
  #endif
  printf("Program Start...\n\n");

  // Call the functions, unbanked first then the banked ones
  bank_fixed();

  func_1();
  func_2();
  func_3();
  func_4();

  printf("\n");


  // Print the const vars, unbanked first then the banked ones
  printf("Const0= %u nonbanked\n", some_const_var_0);

  SWITCH_ROM(BANK(some_const_var_1));
  printf("Const1= %u in bank %hu\n", some_const_var_1, BANK(some_const_var_1));
  SWITCH_ROM(BANK(some_const_var_2));
  printf("Const2= %u in bank %hu\n", some_const_var_2, BANK(some_const_var_2));
  SWITCH_ROM(BANK(some_const_var_3));
  printf("Const3= %u in bank %hu\n", some_const_var_3, BANK(some_const_var_3));

  // If you want to temporarily save and then restore the previous active bank:
  //

  // Save the currently active bank
  _saved_bank = CURRENT_BANK;

  // Switch to the desired one
  SWITCH_ROM(BANK(some_const_var_4));
  printf("Const4= %u in bank %hu\n", some_const_var_4, BANK(some_const_var_4));

  // Then restore the previous bank
  SWITCH_ROM(_saved_bank);



  printf("\n");
  puts("The End...");

  // Loop forever
  while(1) {

    // Yield CPU till the end of each frame
    vsync();
  }
}
