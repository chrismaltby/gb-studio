/*
A simple test app for ds390 compiler work
*/

#include <8052.h>

typedef unsigned char byte;
typedef unsigned int word;
typedef unsigned long l_word;

code char my_message[] = {"Testing 123\n"};
volatile byte hi_flag = 1;
volatile byte timer = 0;

/****
  Note(Bug?): stock mcs51 will find this in library routines,
  For -mds390 compile,
  if this is not here linker does not link in
  anything and does not complain or fail the link.
*****/
unsigned char _sdcc_external_startup ()
{
  return 0;
}

/*------------------------------------------------------------------------
  timer0_int - Timer0 interrupt.  Notice we are using register bank 2
    for this interrupt.
|------------------------------------------------------------------------*/
void timer0_irq_proc(void) interrupt 1 using 2
{
  if (timer != 0)
  {
    --timer;
  }
  else
  {
    hi_flag = 1;
    timer = 250;
  }

  TR0 = 0; /* Stop Timer 0 counting */
  TH0 = (~(5000)) >> 8;
  TL0 = (~(5000)) & 0xff;
  TR0 = 1; /* Start counting again */
}

#if 0
/*------------------------------------------------------------------------
  uart0_int - Interrupt 4 is for the UART, notice we use register bank 1
    for the interrupt routine.
|------------------------------------------------------------------------*/
void uart0_int(void) interrupt 4 using 1
{
  if (RI)
  {
    c = SBUF;
    RI = 0;
  }
}
#endif

/*------------------------------------------------------------------------
  tx_char - transmit(tx) a char out the serial uart.
|------------------------------------------------------------------------*/
void tx_char(char c)
{
  SBUF = c;
  while (!TI)
    ;
  TI = 0;
}

/*------------------------------------------------------------------------
  tx_str - transmit(tx) a string out the serial uart.
|------------------------------------------------------------------------*/
void tx_str(char *str)
{
  
  while (*str)
    tx_char(*str++);
}

/*------------------------------------------------------------------------
  main - Simple test program to send out something to the serial port.
|------------------------------------------------------------------------*/
void main(void)
{
  PCON = 0x80;  /* power control byte, set SMOD bit for serial port */
  SCON = 0x50;  /* serial control byte, mode 1, RI active */
  TMOD = 0x21;  /* timer control mode, byte operation */
  TCON = 0;     /* timer control register, byte operation */

  TH1 = 0xFA;   /* serial reload value, 9,600 baud at 11.0952Mhz */
  TR1 = 1;      /* start serial timer */

  TR0 = 1;      /* start timer0 */
  ET0 = 1;      /* Enable Timer 0 overflow interrupt IE.1 */
  EA = 1;       /* Enable Interrupts */

  TI = 0;       /* clear this out */
  SBUF = '.';   /* send an initial '.' out serial port */
  hi_flag = 1;
  //ES = 1;                           /* Enable serial interrupts IE.4 */

  tx_str(my_message);

  for (;;)
  {
    if (hi_flag)
    {
      tx_str("Hi There\n");
      hi_flag = 0;
    }
  }

}

