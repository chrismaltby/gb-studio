/*-------------------------------------------------------------------------
  ser_ir.h - header file for serial routines 
  
  Written By -  Josef Wolf <jw@raven.inka.de> (1999)

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
/* call this one first on startup */
void ser_init (void);

/* the following ones should be obvious */
void ser_putc (unsigned char c);
void ser_puts (unsigned char *s);
void ser_gets (unsigned char *s, unsigned char len);
unsigned char ser_getc (void);

/* return the number of chars that can be received/transmitted without
* blocking.
*/
unsigned char ser_can_rcv (void);
unsigned char ser_can_xmt (void);

/* needs to be defined somewhere :-() */
void ser_handler (void) interrupt 4;
