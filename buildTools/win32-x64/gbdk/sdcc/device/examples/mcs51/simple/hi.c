/*------------------------------------------------------------------------
 hi.c - This is a simple program designed to operate on basic MCS51
   hardware at 11.0592Mhz.  It sets up the baudrate to 9600 and sends
   a "Hi\n" "There\n" message every few seconds.  The timer interrupt
   is used.

   Its intended to be a simple example for SDCC, a good first
   program to compile and play with.

   The simulator can be used to run this program:
   s51 -Sout=serial.txt hi.ihx (run, stop, quit)

   Notice that unless we use the --stack-after-data option,
   the SSEG listed in the map is not accurate, look at the
   .asm file and search for "sp," to see where it is really
   initialized to.

 6-28-01  Written by Karl Bongers(karl@turbobit.com)
|------------------------------------------------------------------------*/
#include <8052.h>

typedef unsigned char byte;
typedef unsigned int word;
typedef unsigned long l_word;

//---- most of the following declares are simply to demostrate some
// of SDCC's variable storage declaration syntax

// volatile keyword is needed for variables shared by interrupt routine
// and normal application thread, otherwise things get optimized out.
volatile data byte timer;
volatile data byte hi_flag;

data byte a_data_byte;    // normal < 128 bytes of 8031 internal memory.
idata byte a_idata_byte;  // in +128 byte internal memory of 8032
xdata byte a_xdata_byte;  // in external memory.
xdata at 0x8000 byte mem_mapped_hardware; // example at usage

bit my_bit;  // mcs51 bit variable, stored in single bit of register space

sfr at 0xd8 WDCON;  // special function register declaration
sbit LED_SYS = 0xb5;  // P3.5 is led, example use of sbit keyword

code char my_message[] = {"GNU rocks\n"};  // placed in code space

void timer0_irq_proc(void) interrupt 1 using 2;

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
  stop - a break point in Daniel D's s51 can be set at 65535 memory
    location to stop the simulation.  This routine also shows how to
    embed assembly.
|------------------------------------------------------------------------*/
void stop(void)
{
 _asm;
  mov dptr, #65535;
  movx a, @dptr;
  nop;
 _endasm;
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

stop();

#ifdef TEST_IDLE_MODE
    // this was a simple test of the low power sleep mode of a
    // dallas DS5000 cmos part, to see how much power requirements
    // dropped in sleep mode.
    
    // into idle mode until next interrupt.  Draws only 3ma.
    PCON = 0x81;
#endif
  }

}

