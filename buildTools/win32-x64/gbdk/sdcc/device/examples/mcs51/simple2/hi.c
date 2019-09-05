/*------------------------------------------------------------------------
 hello.c - This is a simple program designed to operate on basic MCS51
   hardware at 11.0592Mhz.  It sets up the baudrate to 9600 and responds
   to simple ascii commands on the serial port.

   Its intended to be a simple example for SDCC and ucSim.
   The redirection of the simluated serial port to a TCP port
   is cool, try this:
   Try: 
   1.) type>s51 -k 5678 hi.ihx
   2.) (Now telnet to 127.0.0.1 Port 5678)
   3.) At the s51 prompt, type: run
   4.) At the telnet prompt, type in a few keys followed by CR
   5.) You should see this program send back what you typed.

 6-28-01  Written by Karl Bongers(karl@turbobit.com)
|------------------------------------------------------------------------*/
#include <8052.h>

typedef unsigned char byte;
typedef unsigned int word;
typedef unsigned long l_word;

data byte li = 0;  // index into lbuf
data byte g_dc;
data byte lbuf[12];  // this is our line buffer, chars gather here till CR seen

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
  main - 
|------------------------------------------------------------------------*/
void main(void)
{
  PCON = 0x80;  /* power control byte, set SMOD bit for serial port */
  SCON = 0x50;  /* serial control byte, mode 1, RI active */
  TMOD = 0x21;  /* timer control mode, byte operation */
  TCON = 0;     /* timer control register, byte operation */

  TH1 = 0xFA;   /* serial reload value, 9,600 baud at 11.0952Mhz */
  TR1 = 1;      /* start serial timer */

  EA = 1;       /* Enable Interrupts */

  TI = 0;       /* clear this out */
  SBUF = '.';   /* send an initial '.' out serial port */
  //ES = 1;                           /* Enable serial interrupts IE.4 */

  tx_str("Hello World\n");

  RI = 0;
  g_dc = 0;
  for (;;)
  {
    if (RI)  // we have new serial rx data
    {
      g_dc = SBUF;  // read the serial char
      RI = 0;  // reset serial rx flag

      tx_char(g_dc);   // echo back out as serial tx data
      if ((g_dc == 0x0d) || (g_dc == '.') || (g_dc == 0x0a)) // if CR, then end of line
      {
        tx_char(0xd);  // CR
        tx_char(0xa);  // LF
        lbuf[li] = 0;
        li = 0;
        tx_str("You typed in this[");
        tx_str(lbuf);
        tx_str("]\n");
      }
      else
      {
        lbuf[li] = g_dc;
        if (li < 11)
          ++li;
      }
    }
  }
}

