#include <gb/gb.h>
#include <gb/console.h>
#include <stdio.h>
#include <string.h>

UBYTE vbl_cnt, tim_cnt;

void vbl()
{
  /* Upon IRQ, interrupts are automatically disabled */
  vbl_cnt++;
}

void tim()
{
  /* Upon IRQ, interrupts are automatically disabled */
  tim_cnt++;
}

void print_counter()
{
  UBYTE cnt;

  /* Ensure mutual exclusion (not really necessary in this example)... */
  disable_interrupts();
  cnt = tim_cnt;
  enable_interrupts();

  printf(" TIM %u", (unsigned int)cnt);
  gotoxy(9, posy());

  /* Ensure mutual exclusion (not really necessary in this example)... */
  disable_interrupts();
  cnt = vbl_cnt;
  enable_interrupts();

  printf("- VBL %u\n", (unsigned int)cnt);
}

void main()
{
  /* Ensure mutual exclusion (not really necessary in this example)... */
  disable_interrupts();
  vbl_cnt = tim_cnt = 0;
  add_VBL(vbl);
  add_TIM(tim);
  enable_interrupts();

  /* Set TMA to divide clock by 0x100 */
  TMA_REG = 0x00U;
  /* Set clock to 4096 Hertz */
  TAC_REG = 0x04U;
  /* Handle VBL and TIM interrupts */
  set_interrupts(VBL_IFLAG | TIM_IFLAG);

  while(1) {
    print_counter();
    delay(1000UL);
  }
}
