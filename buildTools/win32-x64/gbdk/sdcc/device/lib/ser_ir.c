/*-------------------------------------------------------------------------
  ser_ir.c - source file for serial routines 
  
  Written By - Josef Wolf <jw@raven.inka.de> (1999) 
  
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
#include "ser_ir.h"

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
#include <8051.h>
#define XBUFLEN 10
#define RBUFLEN 10

static unsigned char rbuf[RBUFLEN], xbuf[XBUFLEN];
static unsigned char rcnt, xcnt, rpos, xpos;
static unsigned char busy;

void ser_init (void)
{
   ES = 0;
   rcnt = xcnt = rpos = xpos = 0;  /* init buffers */
   busy = 0;
   SCON = 0x50;
   PCON |= 0x80;                   /* SMOD = 1; */
   TMOD &= 0x0f;                   /* use timer 1 */
   TMOD |= 0x20;
   TL1 = -3; TH1 = -3; TR1 = 1;    /* 19200bps with 11.059MHz crystal */
   ES = 1;
}

void ser_handler (void) interrupt 4
{
   if (RI) {
	   RI = 0;
	   /* don't overwrite chars already in buffer */
	   if (rcnt < RBUFLEN)
		   rbuf [(rpos+rcnt++) % RBUFLEN] = SBUF;
   }
   if (TI) {
	   TI = 0;
	   if (busy = xcnt) {   /* Assignment, _not_ comparison! */
		   xcnt--;
		   SBUF = xbuf [xpos++];
		   if (xpos >= XBUFLEN)
			   xpos = 0;
	   }
   }
}

void ser_putc (unsigned char c)
{
   while (xcnt >= XBUFLEN) /* wait for room in buffer */
	   ;
   ES = 0;
   if (busy) {
	   xbuf[(xpos+xcnt++) % XBUFLEN] = c;
   } else {
	   SBUF = c;
	   busy = 1;
   }
   ES = 1;
}

unsigned char ser_getc (void)
{
   unsigned char c;
   while (!rcnt)   /* wait for character */
	   ;
   ES = 0;
   rcnt--;
   c = rbuf [rpos++];
   if (rpos >= RBUFLEN)
	   rpos = 0;
   ES = 1;
   return (c);
}
#pragma SAVE
#pragma NOINDUCTION
void ser_puts (unsigned char *s)
{
   unsigned char c;
   while (c=*s++) {
	   if (c == '\n') ser_putc ('\r');
	   ser_putc (c);
   }
}
#pragma RESTORE
void ser_gets (unsigned char *s, unsigned char len)
{
   unsigned char pos, c;

   pos = 0;
   while (pos <= len) {
	   c = ser_getc ();
	   if (c == '\r') continue;        /* discard CR's */
	   s[pos++] = c;
	   if (c == '\n') break;           /* NL terminates */
   }
   s[pos] = '\0';
}

unsigned char ser_can_xmt (void)
{
   return XBUFLEN - xcnt;
}

unsigned char ser_can_rcv (void)
{
   return rcnt;
}
