/*-------------------------------------------------------------------------
  Register Declarations for the DALLAS DS80C390 Processor
  far from complete, e.g. no CAN
  
   Written By - Johan Knol, johan.knol@iduna.nl
    
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

#ifndef DS80C390_H
#define DS80C390_H

sfr at 0x80 P4; // ce3..ce0, a19..a16
sfr at 0x81 SP; // stack pointer
sfr at 0x82 DPL; // data pointer 0 lsb
sfr at 0x83 DPH; // data pointer 0 msb
sfr at 0x84 DPL1; // data pointer 1 lsb
sfr at 0x85 DPH1; // data pointer 1 msb
sfr at 0x86 DPS; // data pointer select
sfr at 0x87 PCON; // power control
sfr at 0x88 TCON; // timer/counter control
  sbit at 0x88 IT0;
  sbit at 0x89 IE0;
  sbit at 0x8a IT1;
  sbit at 0x8b IE1;
  sbit at 0x8c TR0;
  sbit at 0x8d TF0;
  sbit at 0x8e TR1;
  sbit at 0x8f TF1;
sfr at 0x89 TMOD; // timer mode control
sfr at 0x8a TL0; // timer 0 lsb
sfr at 0x8b TL1; // timer 1 msb
sfr at 0x8c TH0; // timer 0 msb
sfr at 0x8d TH1; // timer 1 msb
sfr at 0x8e CKCON; // clock control
sfr at 0x90 P1;
  sbit at 0x90 T2;
  sbit at 0x91 T2EX;
  sbit at 0x92 RXD1;
  sbit at 0x93 TXD1;
  sbit at 0x94 INT2;
  sbit at 0x95 INT3;
  sbit at 0x96 INT4;
  sbit at 0x97 INT5;
sfr at 0x91 EXIF; // external interrupt flag
sfr at 0x92 P4CNT;
sfr at 0x93 DPX; // extended datapointer 0
sfr at 0x95 DPX1; // extended datapointer 1
sfr at 0x98 SCON0; // serial 0 control
  sbit at 0x98 RI_0;
  sbit at 0x99 TI_0;
  sbit at 0x9a RB8_0;
  sbit at 0x9b TB8_0;
  sbit at 0x9c REN_0;
  sbit at 0x9d SM2_0;
  sbit at 0x9e SM1_0;
  sbit at 0x9f SM0_0;
  sbit at 0x9f FE_0; // depending on SMOD0
sfr at 0x99 SBUF0; // serial 0 data buffer
sfr at 0x9b ESP; // extended stack pointer
sfr at 0x9c AP; // address page
sfr at 0x9d ACON; // address control
sfr at 0xa0 P2; // never mind the sbits
sfr at 0xa1 P5;
sfr at 0xa2 P5CNT;
sfr at 0xa8 IE; // interrupt enable
  sbit at 0xa8 EX0;
  sbit at 0xa9 ET0;
  sbit at 0xaa EX1;
  sbit at 0xab ET1;
  sbit at 0xac ES0;
  sbit at 0xad ET2;
  sbit at 0xae ES1;
  sbit at 0xaf EA;
sfr at 0xb0 P3;
  sbit at 0xb0 RXD0;
  sbit at 0xb1 TXD0;
  sbit at 0xb2 INT0;
  sbit at 0xb3 INT1;
  sbit at 0xb4 T0;
  sbit at 0xb5 T1;
  sbit at 0xb6 WR;
  sbit at 0xb7 RD;
sfr at 0xb8 IP; // interupt priority 
  sbit at 0xb8 PX0; // external 0
  sbit at 0xb9 PT0; // timer 0
  sbit at 0xba PX1; // external 1
  sbit at 0xbb PT1; // timer 1
  sbit at 0xbc PS0; // serial port 0
  sbit at 0xbd PT2; // timer 2
  sbit at 0xbe PS1; // serial port 1
sfr at 0xc0 SCON1; // serial 1 control
  sbit at 0xc0 RI_1;
  sbit at 0xc1 TI_1;
  sbit at 0xc2 RB8_1;
  sbit at 0xc3 TB8_1;
  sbit at 0xc4 REN_1;
  sbit at 0xc5 SM2_1;
  sbit at 0xc6 SM1_1;
  sbit at 0xc7 SM0_1;
  sbit at 0xc7 FE_1; // depending on SMOD0
sfr at 0xc1 SBUF1; // serial 1 data buffer
sfr at 0xc4 PMR; // power managment
sfr at 0xc6 MCON; // memory control register
sfr at 0xc7 TA; // timed access register
sfr at 0xc8 T2CON; // timer 2 control
  sbit at 0xc8 CP_RL; // capture/reload
  sbit at 0xc9 C_T; // count/timer
  sbit at 0xca TR2; // stop/run
  sbit at 0xcb EXEN2;
  sbit at 0xcc TCLK;
  sbit at 0xcd RCLK;
  sbit at 0xce EXF2;
  sbit at 0xcf TF2; // overflow flag
sfr at 0xc9 T2MOD; // timer 2 mode
sfr at 0xca RCAP2L; // timer 2 capture/reload
sfr at 0xca RTL2; // depends on CP_RL
sfr at 0xcb RCAP2H;
sfr at 0xcb RTH2;
sfr at 0xcc TL2; // timer 2 lsb
sfr at 0xcd TH2; // timer 2 msb
sfr at 0xd0 PSW; // program status word (byte actually)
  sbit at 0xd0 P; // parity
  sbit at 0xd1 F1; // user flag 1
  sbit at 0xd2 OV; // overflow flag
  sbit at 0xd3 RS0; // register select l
  sbit at 0xd4 RS1; // register select h
  sbit at 0xd5 F0; // user flag 0
  sbit at 0xd6 AC; // auxiliary carry flag
  sbit at 0xd7 CY; // carry flag
sfr at 0xd1 MCNT0; // arithmetic accellerator
sfr at 0xd2 MCNT1;
sfr at 0xd3 MA;
sfr at 0xd4 MB;
sfr at 0xd5 MC;
sfr at 0xd8 WDCON; // watch dog
  sbit at 0xd8 RWT;
  sbit at 0xd9 EWT;
  sbit at 0xda WTRF;
  sbit at 0xdb PF1;
  sbit at 0xdc EPF1;
  sbit at 0xde POR;
  sbit at 0xdf SMOD_1;
sfr at 0xe0 ACC; // accumulator
sfr at 0xe8 EIE; // extended interrupt enable
  sbit at 0xe8 EX2;
  sbit at 0xe9 EX3;
  sbit at 0xea EX4;
  sbit at 0xeb EX5;
  sbit at 0xec EWDI;
  sbit at 0xed C1IE;
  sbit at 0xee C0IE;
  sbit at 0xef CANBIE;
sfr at 0xea MXAX; // extended address register
sfr at 0xf0 B; // aux accumulator
sfr at 0xf8 EIP; // extended interrupt priority
  sbit at 0xf8 PX2;
  sbit at 0xf9 PX3;
  sbit at 0xfa PX4;
  sbit at 0xfb PX5;
  sbit at 0xfc PWDI;
  sbit at 0xfd C1IP;
  sbit at 0xfe C0IP;
  sbit at 0xff CANBIP;

#endif /* DS80C390_H */
