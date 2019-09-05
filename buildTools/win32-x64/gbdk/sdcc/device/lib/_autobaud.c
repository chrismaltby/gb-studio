/*-------------------------------------------------------------------------

  _autobaud.c - automatic baud rate detection routine. Adapted for
  sdcc compiler from Paul Stoffregen's  <paul@ece.orst.edu> autobaud.asm
  the original assembly code can be found at 
  http://www.ece.orst.edu/~paul/8051-goodies/autobaud.html  
  
  written By -  Sandeep Dutta . sandeep.dutta@usa.net (1999)

  This library is free software; you can redistribute it and/or modify it
  under the terms of the GNU Library General Public License as published by the
  Free Software Foundation; either version 2, or (at your option) any
  later version.
  
  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Library General Public License for more details.
  
  You should have received a copy of the GNU Library General Public License
  along with this program; if not, write to the Free Software
  Foundation, 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
  
  In other words, you are welcome to use, share and improve this program.
  You are forbidden to forbid anyone else to use, share and improve
  what you give them.   Help stamp out software-hoarding!
  -------------------------------------------------------------------------*/
#include <8051.h>
/*
; To set the baud rate, use this formula or use autobaud()
; baud_const = 256 - (crystal / (12 * 16 * baud)) */

/*
;to do automatic baud rate detection, we assume the user will
;press the carriage return, which will cause this bit pattern
;to appear on port 3 pin 0 (CR = ascii code 13, assume 8N1 format)
;
;              0 1 0 1 1 0 0 0 0 1
;              | |             | |
; start bit----+ +--lsb   msb--+ +----stop bit
;
;we'll start timer #1 in 16 bit mode at the transition between the
;start bit and the LSB and stop it between the MBS and stop bit.
;That will give approx the number of cpu cycles for 8 bits.  Divide
;by 8 for one bit and by 16 since the built-in UART takes 16 timer
;overflows for each bit.  We need to be careful about roundoff during
;division and the result has to be inverted since timer #1 counts up.  Of
;course, timer #1 gets used in 8-bit auto reload mode for generating the
;built-in UART's baud rate once we know what the reload value should be.
*/

void autobaud ()
{

        /* get timer #1 ready for action (16 bit mode) */
	TMOD=0x11;
	TCON = 0;
	TH1 = TL1 = 0;
	
	/* wait for start bit */
autobaud2:
        while(RXD) ; 

	/*  check it a few more times to make
             sure we don't trigger on some noise*/
	if (RXD) goto autobaud2;
	if (RXD) goto autobaud2;
	if (RXD) goto autobaud2;
	if (RXD) goto autobaud2;

        /* wait for bit #0 to begin	 */
	while (!RXD);
        TR1 = 1; /* start the timer */
	while (RXD);             // wait for bit #1 to begin
        while(!RXD);             // wait for bit #2 to begin
        while(RXD);              // wait for bit #4 to begin
        while (!RXD);            // wait for stop bit to begin
        TR1 = 0;                 // stop timing

	/* ;grab bit 7... it's the lsb we want */
	TH1 = (TH1 << 1) | (TL1 >> 7);

	/* round off if necessary */
        TH1 = (TH1 << 1) | ((TL1 >> 6) & 0x01);

	/* invert since timer #1 will count up */
        TH1 = ~TH1;

	/* now TH1 has the correct reload value (I hope) */
	TH1++ ;

	TL1 = TH1;
	TMOD =  0x21     ;      // set timer #1 for 8 bit auto-reload
        PCON =  0x80     ;      // configure built-in uart
        SCON =  0x52     ;
}

