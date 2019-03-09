#include <gb/gb.h>
#include <stdio.h>
#include <string.h>

UWORD counter;

void inc()
{
  counter++;
}

void print_counter()
{
    printf(" Counter is %u\n", counter);
}

void main()
{
  extern UBYTE __inc_end, __inc_start;
  /* Declare extern functions */
  void inc_ram() NONBANKED;
  void inc_hiram() NONBANKED;
  /* Declare pointer-to-function variables */
  void (*inc_ram_var)(void) NONBANKED = 0xD000;
  void (*inc_hiram_var)(void) NONBANKED = 0xFFA0;

  puts("Program Start...");
  counter = 0;
  /* Copy 'inc' to HIRAM at 0xFFA0 */
  hiramcpy(0xA0U, (void *)&__inc_start, (UBYTE)(&__inc_end-&__inc_start));
  /* Copy 'inc' to RAM at 0xD000 */
  memcpy((void *)0xD000, (void *)&__inc_start, (UWORD)(&__inc_end-&__inc_start));

  print_counter();

  /* Call function in ROM */
  puts("Call ROM");
  inc();
  print_counter();

  /* Call function in RAM using link-time address */
  puts("Call RAM direct");
  inc_ram();
  print_counter();

  /* Call function in RAM using pointer-to-function variable */
  puts("Call RAM indirect");
  (*inc_ram_var)();
  print_counter();

  /* Call function in HIRAM using link-time address */
  puts("Call HIRAM direct");
  inc_hiram();
  print_counter();

  /* Call function in HIRAM using pointer-to-function variable */
  puts("Call HIRAM indirect");
  (*inc_hiram_var)();
  print_counter();

  puts("The End...");
}
