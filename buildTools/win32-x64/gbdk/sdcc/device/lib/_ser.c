/*KA******************************************************************
* PROJECT: PL-One/8052 
**********************************************************************
* FILE: ser.c
**********************************************************************
* CHANGES:
* date      author            description
* --------------------------------------------------------------------
* 04/26/99  we                final
* 04/27/99  we                comments
**********************************************************************
* DESCRIPTION:
* This file contains a simple interrupt driven serial driver with
* buffer (no check for overflow!!!).
**********************************************************************
* FUNCTIONS DECLARED:
* ser_init       Initialization; must be called first
* ser_putc       output one char on the serial line
* ser_getc       return a char if one has been received, else 0
* ser_printString print a 0-terminated string
* ser_charAvail  return 1 if a char arrived on serial line
**********************************************************************
* NOTE:
* Remember to enable all interrupts (EA=1) outside of this module!!
**********************************************************************
* COMPILE TIME OPTIONS: -
* DEBUG OPTIONS: -
******************************************************************KE*/
/*      $Id: _ser.c,v 1.4 2001/07/02 21:10:59 bernhardheld Exp $    */


#include <8052.h>

#include "ser.h"

#define NON_BLOCKING

unsigned char xdata ser_txIndexIn;
unsigned char xdata ser_txIndexOut;
unsigned char xdata ser_rxIndexIn;
unsigned char xdata ser_rxIndexOut;

unsigned char xdata ser_txBuffer[0x100];
unsigned char xdata ser_rxBuffer[0x100];

static bit ser_txBusy;

void
ser_init(void)
{
  ES = 0;

  ser_txBusy     = 0;

  ser_txIndexIn  = 0;
  ser_txIndexOut = 0;
  ser_rxIndexIn  = 0;
  ser_rxIndexOut = 0;
  
  T2CON = 0x30;

  /* Baudrate = 19200, oscillator frq. of my processor is 21.4772 MHz */
  RCAP2H = 0xFF;
  RCAP2L = 0xDD;

  /* enable counter */
  T2CON = 0x34;
  
  SCON = 0x50;

  if (TI) {
    TI = 0;
  }
  if (RI) {
    RI = 0;
  }
  
  ES=1;  
}

void
ser_interrupt_handler(void) interrupt 4 using 1
{
  ES=0;

  if (TI) {
    TI = 0;
    if (ser_txIndexIn == ser_txIndexOut) {
      ser_txBusy = 0;
    }
    else {
      SBUF = ser_txBuffer[ser_txIndexOut++];
    }
  }

  if (RI) {
    RI = 0;
    ser_rxBuffer[ser_rxIndexIn++] = SBUF;
  }

  ES=1;
}

void 
ser_putc(unsigned char c)
{
  ES=0;

  if (ser_txBusy) {
    ser_txBuffer[ser_txIndexIn++] = c;
  }
  else {
    ser_txBusy = 1;
    SBUF = c;
  }

  ES=1;
}

unsigned char
ser_getc(void)
{
  char tmp;

#ifdef NON_BLOCKING
  if (ser_rxIndexIn != ser_rxIndexOut) {
    tmp = ser_rxBuffer[ser_rxIndexOut++];
  }
  else {
    tmp = 0;
  }
#endif

  return(tmp);
}

void
ser_printString(char *String)
{
  while (*String) {
    ser_putc(*String++);
  }
}

char
ser_charAvail(void)
{
  char ret = 0;

  if (ser_rxIndexIn != ser_rxIndexOut) {
    ret = 1;
  }

  return(ret);
}

/*********************End of File************************************/
