/*-------------------------------------------------------------------------
  ser_ir.c - source file for serial routines

  Written By - Josef Wolf <jw@raven.inka.de> (1999)

  Revisions:
  1.0  Bela Torok <bela.torok.kssg.ch> Jul. 2000
  RTS / CTS protocol added

  This program is free software; you can redistribute it and/or modify it
  under the terms of the GNU General Public License as published by the
  Free Software Foundation; either version 2, or (at your option) any
  later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.

  In other words, you are welcome to use, share and improve this program.
  You are forbidden to forbid anyone else to use, share and improve
  what you give them.   Help stamp out software-hoarding!

-------------------------------------------------------------------------*/

/* This file implements a serial interrupt handler and its supporting
* routines. Compared with the existing serial.c and _ser.c it has
* following advantages:
* - You can specify arbitrary buffer sizes (umm, up to 255 bytes),
*   so it can run on devices with _little_ memory like at89cx051.
* - It won't overwrite characters which already are stored in the
*   receive-/transmit-buffer.
* - It checks receiver first to minimize probability for overruns
*   in the serial receiver.
*/

/* BUG: those definitions (and the #include) should be set dynamically
* (while linking or at runtime) to make this file a _real_ library.
*/

/* RTS/CTS protocol howto:


   Shematic of cable for RTS/CTS protocol (B. Torok - Jun. 2000)

<- DB9 female connector -><- RS232 driver/receiver -><- 8051 system ->
   connect to PC             e.g. MAX232

                             RS232         TTL
                             level         level

   DCD    DTR                
   Pin1---Pin4               
                            Transmitters/Receivers
   RXD
   Pin2-----------------------------<<<-------------------TXD

   TXD
   Pin3----------------------------->>>-------------------RXD

   GND
   Pin5---------------------------------------------------GND

   DSR    CTS
   Pin6---Pin8----------------------<<<-------------------CTS (see #define CTS)

   RTS
   Pin7----------------------------->>>-------------------RTS (see #define RTS)
*/


#include <8051.h>
#include "ser_ir.h"

#define TXBUFLEN 3
#define RXBUFLEN 18      // The minimum rx buffer size for safe communications
                         // is 17. (The UART in the PC has a 16-byte FIFO.)
// TXBUFLEN & RXBUFLEN can be highher if rxbuf[] and txbuf[] is in xdata, max size is limited to 256!

#define THRESHOLD 16
#define ENABLE    0
#define DISABLE   1

#define CTS P3_6          // CTS & RTS can be assigned to any free pins
#define RTS P3_7

static unsigned char rxbuf[RXBUFLEN], txbuf[TXBUFLEN];
static unsigned char rxcnt, txcnt, rxpos, txpos;
static unsigned char busy;

void ser_init()
{
  ES = 0;
  rxcnt = txcnt = rxpos = txpos = 0;  // init buffers
  busy = 0;
  SCON = 0x50;               // mode 1 - 8-bit UART
  PCON |= 0x80;              // SMOD = 1;
  TMOD &= 0x0f;              // use timer 1
  TMOD |= 0x20;
//  TL1 = TH1 = 256 - 104;      // 600bps with 12 MHz crystal
//  TL1 = TH1 = 256 - 52;      // 1200bps with 12 MHz crystal
//  TL1 = TH1 = 256 - 26;      // 2400bps with 12 MHz crystal
  TL1 = TH1 = 256 - 13;      // 4800bps with 12 MHz crystal

  TR1 = 1;                   // Enable timer 1
  ES = 1;

  CTS = ENABLE;
}

void ser_handler(void) interrupt 4
{
  if (RI) {
    RI = 0;
    /* don't overwrite chars already in buffer */
    if(rxcnt < RXBUFLEN) rxbuf [(rxpos + rxcnt++) % RXBUFLEN] = SBUF;
    if(rxcnt >= (RXBUFLEN - THRESHOLD)) CTS = DISABLE;
  }

  if (TI) {
    TI = 0;
    if (busy = txcnt) {   /* Assignment, _not_ comparison! */
      txcnt--;
      SBUF = txbuf[txpos++];
      if(txpos >= TXBUFLEN) txpos = 0;
    }
  }
}

void ser_putc(unsigned char c)
{
  while(txcnt >= TXBUFLEN);   // wait for room in buffer

  while(RTS == DISABLE);

  ES = 0;
  if (busy) {
    txbuf[(txpos + txcnt++) % TXBUFLEN] = c;
  } else {
    SBUF = c;
    busy = 1;
  }
  ES = 1;
}

unsigned char ser_getc(void)
{
  unsigned char c;

  while (!rxcnt) {        // wait for a character
    CTS = ENABLE;
  }

  ES = 0;
  rxcnt--;
  c = rxbuf[rxpos++];
  if (rxpos >= RXBUFLEN) rxpos = 0;
  ES = 1;
  return (c);
}

#pragma SAVE
#pragma NOINDUCTION
void ser_puts(unsigned char *s)
{
  unsigned char c;
  while (c= *s++) {
    if (c == '\n') ser_putc('\r');
    ser_putc (c);
  }
}
#pragma RESTORE

void ser_gets(unsigned char *s, unsigned char len)
{
  unsigned char pos, c;

  pos = 0;
  while (pos <= len) {
    c = ser_getc();
    if (c == '\r') continue;        // discard CR's
    s[pos++] = c;
    if (c == '\n') break;           // NL terminates
  }
  s[pos] = '\0';                  // terminate string
}

unsigned char ser_can_xmt(void)
{
  return TXBUFLEN - txcnt;
}

unsigned char ser_can_rcv(void)
{
  return rxcnt;
}
