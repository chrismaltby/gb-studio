/*-------------------------------------------------------------------------
   Register Declarations for the Intel 8052 Processor

   Written By -  Bela Torok / bela.torok@kssg.ch (July 2000)

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

#ifndef REG8052_H
#define REG8052_H

#include <8051.h>     /* load difinitions for the 8051 core */

#ifdef REG8051_H
#undef REG8051_H
#endif

/* define 8052 specific registers only */

/* T2CON */
sfr at 0xC8 T2CON ;

/* RCAP2 L & H */
sfr at 0xCA RCAP2L  ;
sfr at 0xCB RCAP2H  ;
sfr at 0xCC TL2     ;
sfr at 0xCD TH2     ;

/*  IE   */
sbit at 0xAD ET2  ; /* Enable timer2 interrupt */

/* T2CON bits */
sbit at 0xC8 T2CON_0 ;
sbit at 0xC9 T2CON_1 ;
sbit at 0xCA T2CON_2 ;
sbit at 0xCB T2CON_3 ;
sbit at 0xCC T2CON_4 ;
sbit at 0xCD T2CON_5 ;
sbit at 0xCE T2CON_6 ;
sbit at 0xCF T2CON_7 ;

sbit at 0xC8 CP_RL2 ;
sbit at 0xC9 C_T2	;
sbit at 0xCA TR2	;
sbit at 0xCB EXEN2	;
sbit at 0xCC TCLK	;
sbit at 0xCD RCLK	;
sbit at 0xCE EXF2	;
sbit at 0xCF TF2	;

#endif
