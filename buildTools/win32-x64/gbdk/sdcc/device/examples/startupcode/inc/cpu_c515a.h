/*-------------------------------------------------------------------------
  CPU depending Declarations Header file

   Written By - Dipl.-Ing. (FH) Michael Schmitt
    Bug-Fix Oct 15 1999
    mschmitt@mainz-online.de
    michael.schmitt@t-online.de

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

#ifndef __FILE_CPU_C515A
#define __FILE_CPU_C515A

extern void CpuIdle( void );
void WatchDog( void );

#ifdef SERIAL_VIA_INTERRUPT
// Funktion nur wenn Interrupt Mode
extern void SERIALVIAINTERRUPT (void) interrupt SI0_VECTOR;
#endif

extern void putchar(  char Byte );
extern char getchar( void );
extern unsigned char keypressed( void );

#ifdef USE_SYSTEM_TIMER
extern void DelayMsec( unsigned long delayTime );
extern void timer0_isr (void) interrupt TF0_VECTOR;
#endif

#ifdef USE_ANALOGPORT
extern unsigned int ADCGetValue( char ADCPort );
#endif

extern void InitHardware( void );

extern volatile unsigned long SystemTicks1msec;

#endif
