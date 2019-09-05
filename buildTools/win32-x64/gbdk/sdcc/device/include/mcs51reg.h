/*-------------------------------------------------------------------------
   Register Declarations for the mcs51 compatible microcontrollers

   Written By -  Bela Torok / bela.torok@kssg.ch (November 2000)

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


   History:
   --------
   Version 1.0 Nov 2, 2000 - B. Torok  / bela.torok@kssg.ch
   Initial release, supported microcontrollers:
   8051, 8052, Atmel AT89C1051, AT89C2051, AT89C4051,
   Infineon / Siemens SAB80515, SAB80535, SAB80515A

   Version 1.0.1 (Nov 3, 2000)
   SAB80515A definitions revised by Michael Schmitt / michael.schmitt@t-online.de

   Version 1.0.2 (Nov 6, 2000)
   T2CON bug corrected 8052 and SABX microcontrollers have different T2CONs
   Support for the Atmel AT89C52, AT80LV52, AT89C55, AT80LV55
   Support for the Dallas DS80C320 and DS80C323
   B. Torok / bela.torok@kssg.ch

   Version 1.0.3 (Nov 7, 2000)
   SAB80517 definitions added by Michael Schmitt / michael.schmitt@t-online.de
   Dallas AT89S53 definitions added by B. Torok / bela.torok@kssg.ch
   Dallas DS87C520 and DS83C520 definitions added by B. Torok / bela.torok@kssg.ch

   Version 1.0.4 (Nov 9, 2000)
   To simplify the identication of registers, a large number of definitios
   were renamed. Long register names now (hopefully) clearly define the
   function of the registers.
   Dallas DS89C420 definitions added by B. Torok / bela.torok@kssg.ch

   Version 1.0.5 (Dec 15, 2000)
   Definitions added: #ifdef MCS51REG_EXTERNAL_ROM
                      #ifdef MCS51REG_EXTERNAL_RAM
                      #ifndef MCS51REG_DISABLE_WARNINGS


   Version 1.0.6 (March 10, 2001)
   Support for the Dallas DS5000 & DS2250
   Support for the Dallas DS5001 & DS2251
   Support for the Dallas DS80C390
   microcontrollers - B. Torok / bela.torok@kssg.ch

   Version 1.0.7 (June 7, 2001)
   #ifndef MCS51REG_DISABLE_WARNINGS removed
   #ifdef MCS51REG_DISABLE_WARNINGS added - B. Torok / bela.torok@kssg.ch
   Support for the Philips P80C552 added - Bernhard Held / Bernhard.Held@otelo-online.de


   Adding support for additional microcontrollers:
   -----------------------------------------------

   1. Don't modify this file!!!

   2. Insert your code in a separate file e.g.: mcs51reg_update.h and include
      this after the #define HEADER_MCS51REG statement in this file

   3. The mcs51reg_update.h file should contain following definitions:

          a. An entry with the inventory of the register set of the
             microcontroller in the  "Describe microcontrollers" section.

          b. If necessary add entry(s) in for registers not defined in this file

          c. Define interrupt vectors

   4. Send me the file mcs51reg_update.h ( bela.torok@kssg.ch ).
      I'm going to verify/merge new definitions to this file.


   Microcontroller support:

   Use one of the following options:

   1. use #include <mcs51reg.h> in your program & define MICROCONTROLLER_XXXX in your makefile.

   2. use following definitions prior the
      #include <mcs51reg.h> line in your program:
      e.g.:
      #define MICROCONTROLLER_8052       -> 8052 type microcontroller
      or
      #define MICROCONTROLLER_AT89CX051  -> Atmel AT89C1051, AT89C2051 and AT89C4051 microcontrollers


   Use only one of the following definitions!!!

   Supported Microcontrollers:

   No definition                8051
   MICROCONTROLLER_8051         8051
   MICROCONTROLLER_8052         8052
   MICROCONTROLLER_AT89CX051    Atmel AT89C1051, AT89C2051 and AT89C4051
   MICROCONTROLLER_AT89S53      Atmel AT89S53 microcontroller
   MICROCONTROLLER_AT89X52      Atmel AT89C52 and AT80LV52 microcontrollers
   MICROCONTROLLER_AT89X55      Atmel AT89C55 and AT80LV55 microcontrollers
   MICROCONTROLLER_DS5000       Dallas DS5000 & DS2250 microcontroller
   MICROCONTROLLER_DS5001       Dallas DS5001 & DS2251 microcontroller
   MICROCONTROLLER_DS80C32X     Dallas DS80C320 and DS80C323 microcontrollers
   MICROCONTROLLER_DS80C390     Dallas DS80C390 microcontroller
   MICROCONTROLLER_DS89C420     Dallas DS89C420 microcontroller
   MICROCONTROLLER_DS8XC520     Dallas DS87C520 and DS83C520 microcontrollers
   MICROCONTROLLER_P80C552      Philips P80C552
   MICROCONTROLLER_SAB80515     Infineon / Siemens SAB80515 & SAB80535
   MICROCONTROLLER_SAB80515A    Infineon / Siemens SAB80515A
   MICROCONTROLLER_SAB80517     Infineon / Siemens SAB80517

   Additional definitions (use them prior the #include mcs51reg.h statement):

   Ports P0 & P2 are not available for the programmer if external ROM used.
   Use statement "#define MCS51REG_EXTERNAL_RAM" to undefine P0 & P2.

   Ports P0, P2, P3_6, WR, P3_7 & RD are not available for the programmer if
   external RAM is used.
   Use statement "#define MCS51REG_EXTERNAL_RAM" to undefine P0, P2,
   P3_6, WR, P3_7 & RD.

   #define MCS51REG_ENABLE_WARNINGS -> enable warnings

-----------------------------------------------------------------------*/


#ifndef HEADER_MCS51REG
#define HEADER_MCS51REG

///////////////////////////////////////////////////////
///  Insert header here (for developers only)       ///
///  remove "//" from the begining of the next line ///
/// #include "mcs51reg_update.h"                      ///
///////////////////////////////////////////////////////

//////////////////////////////////
///  Describe microcontrollers ///
///  (inventory of registers)  ///
//////////////////////////////////

// definitions for the 8051
#ifdef MICROCONTROLLER_8051
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: 8051
#endif
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__x__x__x__GF1__GF0__PD__IDL
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SBUF
#define P2
#define IE__EA__x__x__ES__ET1__EX1__ET0__EX0
#define P3
#define IP__x__x__x__PS__PT1__PX1__PT0__PX0
#define PSW
#define ACC
#define B
#endif
// end of definitions for the 8051


// definitions for the 8052 microcontroller
#ifdef MICROCONTROLLER_8052
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: 8052
#endif
// 8051 register set
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__x__x__x__GF1__GF0__PD__IDL
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SBUF
#define P2
#define IE__EA__x__ET2__ES__ET1__EX1__ET0__EX0
#define P3
#define IP__x__x__PT2__PS__PT1__PX1__PT0__PX0
#define PSW
#define ACC
#define B
// 8052 specific registers
#define T2CON__TF2__EXF2__RCLK__TCLK__EXEN2__TR2__C_T2__CP_RL2
#define RCAP2L
#define RCAP2H
#define TL2
#define TH2
#endif
// end of definitions for the 8052 microcontroller


// definitionsons for the Atmel
// AT89C1051, AT89C2051 and AT89C4051 microcontrollers
#ifdef MICROCONTROLLER_AT89CX051
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: Atmel AT89Cx051
#endif
// 8051 register set without P0 & P2
#define SP
#define DPL
#define DPH
#define PCON__SMOD__x__x__x__GF1__GF0__PD__IDL
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SBUF
#define IE__EA__x__x__ES__ET1__EX1__ET0__EX0
#define P3
#define IP__x__x__x__PS__PT1__PX1__PT0__PX0
#define PSW
#define ACC
#define B
#endif
// end of definitionsons for the Atmel
// AT89C1051, AT89C2051 and AT89C4051 microcontrollers


// definitions for the Atmel AT89S53
#ifdef MICROCONTROLLER_AT89S53
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: AT89S53
#endif
// 8051 register set
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__x__x__x__GF1__GF0__PD__IDL
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SBUF
#define P2
#define IE__EA__x__ET2__ES__ET1__EX1__ET0__EX0
#define P3
#define IP__x__x__PT2__PS__PT1__PX1__PT0__PX0
#define PSW
#define ACC
#define B
// 8052 specific registers
#define T2CON__TF2__EXF2__RCLK__TCLK__EXEN2__TR2__C_T2__CP_RL2
#define RCAP2L
#define RCAP2H
#define TL2
#define TH2
// AT89S53 specific register
#define T2MOD__x__x__x__x__x__x__T2OE__DCEN
#define P1_EXT__x__x__x__x__x__x__T2EX__T2
#define SPCR
#define SPDR
#define SPSR
#define WCOM
#define DPL1
#define DPH1
#endif
// end of definitions for the Atmel AT89S53 microcontroller


// definitions for the Atmel AT89C52 and AT89LV52 microcontrollers
#ifdef MICROCONTROLLER_AT89X52
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: AT89C52 or AT89LV52
#endif
// 8051 register set
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__x__x__x__GF1__GF0__PD__IDL
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SBUF
#define P2
#define IE__EA__x__ET2__ES__ET1__EX1__ET0__EX0
#define P3
#define IP__x__x__PT2__PS__PT1__PX1__PT0__PX0
#define PSW
#define ACC
#define B
// 8052 specific registers
#define T2CON__TF2__EXF2__RCLK__TCLK__EXEN2__TR2__C_T2__CP_RL2
#define RCAP2L
#define RCAP2H
#define TL2
#define TH2
// AT89X55 specific register
#define T2MOD__x__x__x__x__x__x__T2OE__DCEN
#define P1_EXT__x__x__x__x__x__x__T2EX__T2
#endif
// end of definitions for the Atmel AT89C52 and AT89LV52 microcontrollers


// definitions for the Atmel AT89C55 and AT89LV55 microcontrollers
#ifdef MICROCONTROLLER_AT89X55
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: AT89C55 or AT89LV55
#endif
// 8051 register set
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__x__x__x__GF1__GF0__PD__IDL
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SBUF
#define P2
#define IE__EA__x__ET2__ES__ET1__EX1__ET0__EX0
#define P3
#define IP__x__x__PT2__PS__PT1__PX1__PT0__PX0
#define PSW
#define ACC
#define B
// 8052 specific registers
#define T2CON__TF2__EXF2__RCLK__TCLK__EXEN2__TR2__C_T2__CP_RL2
#define RCAP2L
#define RCAP2H
#define TL2
#define TH2
// AT89X55 specific register
#define T2MOD__x__x__x__x__x__x__T2OE__DCEN
#define P1_EXT__x__x__x__x__x__x__T2EX__T2
#endif
// end of definitions for the Atmel AT89C55 and AT89LV55 microcontrollers


// definitions for the Dallas DS5000
#ifdef MICROCONTROLLER_DS5000
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: DS5000
#endif
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__POR__PFW__WTR__EPFW__EWT__STOP__IDL
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SBUF
#define P2
#define IE__EA__x__x__ES__ET1__EX1__ET0__EX0
#define P3
#define IP__RWT__x__x__PS__PT1__PX1__PT0__PX0
#define MCON__SL__PAA__ECE2__RA32_8__PA0__PA1__PA2__PA3
#define TA
#define PSW
#define ACC
#define B
#endif
// end of definitions for the Dallas DS5000


// definitions for the Dallas DS5001
#ifdef MICROCONTROLLER_DS5001
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: DS5001
#endif
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__POR__PFW__WTR__EPFW__EWT__STOP__IDL
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SBUF
#define P2
#define IE__EA__x__x__ES__ET1__EX1__ET0__EX0
#define P3
#define IP__RWT__x__x__PS__PT1__PX1__PT0__PX0
#define CRC
#define CRCLOW
#define CRCHIGH
#define MCON__PA3__PA2__PA1__PA0__RG1__PES__PM__SL
#define TA
#define RNR
#define PSW
#define RPCTL
#define STATUS__ST7__ST6__ST5__ST4__IA0__F0__IBF__OBF
#define ACC
#define B
#endif
// end of definitions for the Dallas DS5001


// definitions for the Dallas DS80C320 and DS80C323 microcontrollers
#ifdef MICROCONTROLLER_DS80C32X
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: Dallas DS80C320 or DS80C323
#endif
// 8051 register set
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__SMOD0__x__x__GF1__GF0__STOP__IDLE
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SCON0
#define SBUF
#define P2
#define IE__EA__ES1__ET2__ES__ET1__EX1__ET0__EX0
#define P3
#define IP__x__PS1__PT2__PS__PT1_PX1__PT0__PX0
#define PSW
#define ACC
#define B
// 8052 specific registers
#define T2CON__TF2__EXF2__RCLK__TCLK__EXEN2__TR2__C_T2__CP_RL2
#define RCAP2L
#define RCAP2H
#define TL2
#define TH2
// DS80C320 specific register
#define DPL1
#define DPH1
#define DPS__x__x__x__x__x__x__x__SEL
#define CKCON
#define EXIF__IE5__IE4__IE3__IE2__x__RGMD__RGSL__BGS
#define SADDR0
#define SADDR1
#define SADEN0
#define SADEN1
#define SCON1
#define SBUF1
#define STATUS__PIP__HIP__LIP__x__x__x__x__x
#define TA
#define T2MOD__x__x__x__x__x__x__T2OE__DCEN
#define P1_EXT__INT5__INT4__INT3__INT2__TXD1__RXD1__T2EX__T2
#define WDCON
#define EIE__x__x__x__EWDI__EX5__EX4__EX3__EX2
#define EIP__x__x__x__PWDI__PX5__PX4__PX3__PX2__PX1__PX0
#endif
// end of definitions for the Dallas DS80C320 and DS80C323 microcontrollers


// definitions for the Dallas DS80C390
#ifdef MICROCONTROLLER_DS80C390
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: Dallas DS80C390
#endif
// 8051 register set
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__SMOD0__OFDF__OFDE__GF1__GF0__STOP__IDLE
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SCON0
#define SBUF
#define P2
#define IE__EA__ES1__ET2__ES__ET1__EX1__ET0__EX0
#define P3
#define IP__x__PS1__PT2__PS__PT1_PX1__PT0__PX0
#define PSW
#define ACC
#define B
// 8052 specific registers
#define T2CON__TF2__EXF2__RCLK__TCLK__EXEN2__TR2__C_T2__CP_RL2
#define RCAP2L
#define RCAP2H
#define TL2
#define TH2
// DS80C390 specific register
#define P4_AT_0X80
#define DPL1
#define DPH1
#define DPS__ID1__ID0__TSL__x__x__x__x__SEL
#define CKCON
#define EXIF__IE5__IE4__IE3__IE2__CKRY__RGMD__RGSL__BGS
#define P4CNT
#define DPX
#define DPX1
#define C0RMS0
#define C0RMS1
#define ESP
#define AP
#define ACON__x__x__x__x__x__SA__AM1__AM0
#define C0TMA0
#define C0TMA1
#define P5_AT_0XA1
#define P5CNT
#define C0C
#define C0S
#define C0IR
#define C0TE
#define C0RE
#define SADDR0
#define SADDR1
#define C0M1C
#define C0M2C
#define C0M3C
#define C0M4C
#define C0M5C
#define C0M6C
#define C0M7C
#define C0M8C
#define C0M9C
#define C0M10C
#define SADEN0
#define SADEN1
#define C0M11C
#define C0M12C
#define C0M13C
#define C0M14C
#define C0M15C
#define SCON1
#define SBUF1
#define PMR__CD1__CD0__SWB__CTM__4X_2X__ALEOFF__x__x
#define STATUS__PIP__HIP__LIP__x__SPTA1__SPRA1__SPTA0__SPRA0
#define MCON__IDM1__IDM0__CMA__x__PDCE3__PDCE2__PDCE1__PDCE0
#define TA
#define T2MOD__x__x__x__D13T1__D13T2__x__T2OE__DCEN
#define COR
#define MCNT0
#define MCNT1
#define MA
#define MB
#define MC
#define C1RSM0
#define C1RSM1
#define WDCON
#define C1TMA0
#define C1TMA1
#define C1C
#define C1S
#define C1IR
#define C1TE
#define C1RE
#define EIE__CANBIE__C0IE__C1IE__EWDI__EX5__EX4__EX3__EX2
#define MXMAX
#define C1M1C
#define C1M2C
#define C1M3C
#define C1M4C
#define C1M5C
#define C1M6C
#define C1M7C
#define C1M8C
#define C1M9C
#define EIP__CANBIP__C0IP__C1IP__PWDI__PX5__PX4__PX3__PX2__PX1__PX0
#define C1M10C
#define C1M11C
#define C1M12C
#define C1M13C
#define C1M14C
#define C1M15C
#define P1_EXT__INT5__INT4__INT3__INT2__TXD1__RXD1__T2EX__T2
#endif
// end of definitions for the Dallas DS80C390


// definitions for the Dallas DS89C420 microcontroller
#ifdef MICROCONTROLLER_DS89C420
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: Dallas DS89C420
#endif
// 8051 register set
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__SMOD0__OFDF__OFDE__GF1__GF0__STOP__IDLE
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SCON0
#define SBUF
#define P2
#define IE__EA__ES1__ET2__ES__ET1__EX1__ET0__EX0
#define P3
#define IP__x__PS1__PT2__PS__PT1_PX1__PT0__PX0
#define PSW
#define ACC
#define B
// 8052 specific registers
#define T2CON__TF2__EXF2__RCLK__TCLK__EXEN2__TR2__C_T2__CP_RL2
#define RCAP2L
#define RCAP2H
#define TL2
#define TH2
// DS8XC420 specific registers
#define ACON__PAGEE__PAGES__PAGE0__x__x__x__x__x
#define DPL1
#define DPH1
#define DPS__ID1__ID0__TSL__AID__x__x__x__SEL
#define CKCON
#define CKMOD
#define IP0__x__LPS1__LPT2__LPS0__LPT1__LPX1__LPT0__LPX0
#define IP1__x__MPS1__MPT2__MPS0__MPT1__MPX1__MPT0__MPX0
#define EXIF__IE5__IE4__IE3__IE2__CKRY__RGMD__RGSL__BGS
#define PMR__CD1__CD0__SWB__x__XTOFF__ALEOFF__DME1_DME0
#define SADDR0
#define SADDR1
#define SADEN0
#define SADEN1
#define SCON1
#define SBUF1
#define STATUS__PIP__HIP__LIP__x__SPTA1__SPRA1__SPTA0__SPRA0

#define TA
#define T2MOD__x__x__x__x__x__x__T2OE__DCEN
#define P1_EXT__INT5__INT4__INT3__INT2__TXD1__RXD1__T2EX__T2
#define WDCON
#define ROMSIZE__HBPF__BPF__TE__MOVCX__PRAME__RMS2__RMS1__RMS0
#define WDCON
#define EIE__x__x__x__EWDI__EX5__EX4__EX3__EX2
#define EIP__x__x__x__PWDI__PX5__PX4__PX3__PX2__PX1__PX0
#endif
// end of definitions for the Dallas DS89C420 microcontroller


// definitions for the Dallas DS87C520 and DS83C520 microcontrollers
#ifdef MICROCONTROLLER_DS8XC520
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: Dallas DS87C520 or DS85C520
#endif
// 8051 register set
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__SMOD0__x__x__GF1__GF0__STOP__IDLE
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SCON0
#define SBUF
#define P2
#define IE__EA__ES1__ET2__ES__ET1__EX1__ET0__EX0
#define P3
#define IP__x__PS1__PT2__PS__PT1_PX1__PT0__PX0
#define PSW
#define ACC
#define B
// 8052 specific registers
#define T2CON__TF2__EXF2__RCLK__TCLK__EXEN2__TR2__C_T2__CP_RL2
#define RCAP2L
#define RCAP2H
#define TL2
#define TH2
// DS8XC520 specific registers
#define DPL1
#define DPH1
#define DPS__x__x__x__x__x__x__x__SEL
#define CKCON
#define EXIF__IE5__IE4__IE3__IE2__XT_RG__RGMD__RGSL__BGS
#define PMR__CD1__CD0__SWB__x__XTOFF__ALEOFF__DME1_DME0
#define SADDR0
#define SADDR1
#define SADEN0
#define SADEN1
#define SCON1
#define SBUF1
#define STATUS__PIP__HIP__LIP__XTUP__SPTA2__SPTA1__SPTA0__SPRA0
#define TA
#define T2MOD__x__x__x__x__x__x__T2OE__DCEN
#define P1_EXT__INT5__INT4__INT3__INT2__TXD1__RXD1__T2EX__T2
#define WDCON
#define ROMSIZE__x__x__x__x__x__RMS2__RMS1__RMS0
#define BP2
#define WDCON
#define EIE__x__x__x__EWDI__EX5__EX4__EX3__EX2
#define EIP__x__x__x__PWDI__PX5__PX4__PX3__PX2__PX1__PX0
#endif
// end of definitions for the Dallas DS87C520 and DS83C520 microcontrollers


// definitions for the Philips P80C552 microcontroller
#ifdef MICROCONTROLLER_P80C552
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: Philips P80C552
#endif
// 8051 register set
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__x__x__WLE__GF1__GF0__PD__IDL
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SBUF
#define P2
#define IE__EA__EAD__ES1__ES0__ET1__EX1__ET0__EX0
#define P3
#define IP__x__PAD__PS1__PS0__PT1__PX1__PT0__PX0
#define PSW
#define ACC
#define B
// P80C552 specific register-names
#define S0BUF		// same as SBUF, set in mcs51reg.h
#define S0CON__SM0__SM1__SM2__REN__TB8__RB8__TI__RI
// P80C552 specific registers
#define ADCH_AT_0XC6
#define ADCON__ADC_1__ADC_0__ADEX__ADCI__ADCS__AADR2__AADR1__AADR0
#define CTCON__CTN3__CTP3__CTN2__CTP2__CTN1__CTP1__CTN0__CTP0
#define CTH0_AT_0XCC
#define CTH1_AT_0XCD
#define CTH2_AT_0XCE
#define CTH3_AT_0XCF
#define CMH0_AT_0XC9
#define CMH1_AT_0XCA
#define CMH2_AT_0XCB
#define CTL0_AT_0XAC
#define CTL1_AT_0XAD
#define CTL2_AT_0XAE
#define CTL3_AT_0XAF
#define CML0_AT_0XA9
#define CML1_AT_0XAA
#define CML2_AT_0XAB
#define IEN1__ET2__ECM2__ECM1__ECM0__ECT3__ECT2__ECT1__ECT0
#define IP1__PT2__PCM2__PCM1__PCM0__PCT3__PCT2__PCT1__PCT0
#define PWM0_AT_0XFC
#define PWM1_AT_0XFD
#define PWMP_AT_0XFE
#define P1_EXT__SDA__SCL__RT2__T2__CT3I__CT2I__CT1I__CT0I
#define P4_AT_0XC0
#define P5_AT_0XC4
#define RTE__TP47__TP46__RP45__RP44__RP43__RP42__RP41__RP40
#define S1ADR__x__x__x__x__x__x__x__GC
#define S1DAT_AT_0XDA
#define S1STA__SC4__SC3__SC2__SC1__SC0__x__x__x
#define S1CON__CR2__ENS1__STA__ST0__SI__AA__CR1__CR0
#define STE__TG47__TG46__SP45__SP44__SP43__SP42__SP41__SP40
#define TMH2_AT_0XED
#define TML2_AT_0XEC
#define TM2CON__T2IS1__T2IS0__T2ER__T2B0__T2P1__T2P0__T2MS1__T2MS0
#define TM2IR__T20V__CMI2__CMI1__CMI0__CTI3__CTI2__CTI1__CTI0
#define T3_AT_0XFF
#endif
// end of definitions for the Philips P80C552 microcontroller


// definitions for the Infineon / Siemens SAB80515 & SAB80535
#ifdef MICROCONTROLLER_SAB80515
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: Infineon / Siemens SAB80515 & SAB80535
#endif
// 8051 register set without IP
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__x__x__x__x__x__x__x
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SBUF
#define P2
#define IE__EA_WDT_ET2_ES_ET1_EX1_ET0_EX0
#define P3
#define PSW
#define ACC
#define B
// SAB80515 specific registers
#define P1_EXT__T2__CLKOUT__T2EX__INT2__INT6_CC3__INT5_CC2__INT4_CC1__INT3_CC0
#define IP0__x__WDTS__IP0_5__IP0_4__IP0_3__IP0_2__IP0_1__IP0_0
#define IEN1__EXEN2__SWDT__EX6__EX5__EX4__EX3__EX2__EADC
#define IRCON
#define CCEN
#define CCL1
#define CCH1
#define CCL2
#define CCH2
#define CCL3
#define CCH3
#define T2CON__T2PS__I3FR__I2FR__T2R1__T2R0__T2CM__T2I1__T2I0
#define CRCL
#define CRCH
#define TL2
#define TH2
#define ADCON
#define ADDAT
#define DAPR__SAB80515
#define P4_AT_0XE8
#define P5_AT_0XF8
#endif
// end of definitions for the Infineon / Siemens SAB80515


// definitions for the Infineon / Siemens SAB80515A
#ifdef MICROCONTROLLER_SAB80515A
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: Infineon / Siemens SAB80515A
#endif
// 8051 register set without IP
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__PDS__IDLS__x__x__x__PD__IDL
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SBUF
#define P2
#define IE__EA_WDT_ET2_ES_ET1_EX1_ET0_EX0
#define P3
#define PSW
#define ACC
#define B
// SAB80515A specific registers
#define P1_EXT__T2__CLKOUT__T2EX__INT2__INT6_CC3__INT5_CC2__INT4_CC1__INT3_CC0
#define IP0__x__WDTS__IP0_5__IP0_4__IP0_3__IP0_2__IP0_1__IP0_0
#define IP1__x__x__IP1_5__IP1_4__IP1_3__IP1_2__IP1_1__IP1_0
#define IEN1__EXEN2__SWDT__EX6__EX5__EX4__EX3__EX2__EADC
#define IRCON
#define CCEN
#define CCL1
#define CCH1
#define CCL2
#define CCH2
#define CCL3
#define CCH3
#define T2CON__T2PS__I3FR__I2FR__T2R1__T2R0__T2CM__T2I1__T2I0
#define CRCL
#define CRCH
#define TL2
#define TH2
#define ADCON0
#define ADDATH
#define ADDATL
#define ADCON1
#define SRELL
#define SYSCON
#define SRELH
#define P4_AT_0XE8
#define P5_AT_0XF8
#define P6_AT_0XDB
#define XPAGE
#endif
// end of definitions for the Infineon / Siemens SAB80515A


// definitions for the Infineon / Siemens SAB80517
#ifdef MICROCONTROLLER_SAB80517
#ifdef MICROCONTROLLER_DEFINED
#define MCS51REG_ERROR
#endif
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#endif
#ifdef MCS51REG_ENABLE_WARNINGS
#warning Selected HW: Infineon / Siemens SAB80517
#endif
// 8051 register set without IP, SCON & SBUF
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__PDS__IDLS__x__x__x__PD__IDL
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
// #define SCON
// #define SBUF
#define P2
#define IE__EA_WDT_ET2_ES_ET1_EX1_ET0_EX0
#define P3
#define PSW
#define ACC
#define B
// SAB80517 specific registers
#define P1_EXT__T2__CLKOUT__T2EX__INT2__INT6_CC3__INT5_CC2__INT4_CC1__INT3_CC0
#define IP0__x__WDTS__IP0_5__IP0_4__IP0_3__IP0_2__IP0_1__IP0_0
#define IP1__x__x__IP1_5__IP1_4__IP1_3__IP1_2__IP1_1__IP1_0
#define IEN1__EXEN2__SWDT__EX6__EX5__EX4__EX3__EX2__EADC
#define IEN2__SAB80517
#define IRCON
#define CCEN
#define CCL1
#define CCH1
#define CCL2
#define CCH2
#define CCL3
#define CCH3
#define CCL4
#define CCH4
#define CC4EN
#define CMEN
#define CMH0
#define CML0
#define CMH1
#define CML1
#define CMH2
#define CML2
#define CMH3
#define CML3
#define CMH4
#define CML4
#define CMH5
#define CML5
#define CMH6
#define CML6
#define CMH7
#define CML7
#define CMSEL
#define T2CON__T2PS__I3FR__I2FR__T2R1__T2R0__T2CM__T2I1__T2I0
#define CRCL
#define CRCH
#define CTCOM_AT_0XE1
#define CTRELH
#define CTRELL
#define TL2
#define TH2
#define ADCON0
#define ADCON1
#define ADDAT
#define DAPR__SAB80517
#define P4_AT_0XE8
#define P5_AT_0XF8
#define P6_AT_0XFA
#define P7_AT_0XDB
#define P8_AT_0XDD
#define DPSEL
#define ARCON
#define MD0
#define MD1
#define MD2
#define MD3
#define MD4
#define MD5
#define S0BUF
#define S0CON__SM0__SM1__SM20__REN0__TB80__RB80__TI0__RI0
#define S0RELH
#define S0RELL
#define S1BUF
#define S1CON_AT_0X9B
#define S1RELH
#define S1RELL
#define WDTH
#define WDTL
#define WDTREL
#endif
// end of definitions for the Infineon / Siemens SAB80517


/////////////////////////////////////////////////////////
///  don't specify microcontrollers below this line!  ///
/////////////////////////////////////////////////////////


// default microcontroller -> 8051
// use default if no microcontroller specified
#ifndef MICROCONTROLLER_DEFINED
#define MICROCONTROLLER_DEFINED
#ifdef MCS51REG_ENABLE_WARNINGS
#warning No microcontroller defined! 
#warning Code generated for the 8051
#endif
// 8051 register set
#define P0
#define SP
#define DPL
#define DPH
#define PCON__SMOD__x__x__x__GF1__GF0__PD__IDL
#define TCON
#define TMOD
#define TL0
#define TL1
#define TH0
#define TH1
#define P1
#define SCON
#define SBUF
#define P2
#define IE__EA__x__x__ES__ET1__EX1__ET0__EX0
#define P3
#define IP__x__x__x__PS__PT1__PX1__PT0__PX0
#define PSW
#define ACC
#define B
#endif
// end of definitions for the default microcontroller


#ifdef MCS51REG_ERROR
#error Two or more microcontrollers defined!
#endif

#ifdef MCS51REG_EXTERNAL_ROM
#ifndef MCS51REG_UNDEFINE_P0
#define MCS51REG_UNDEFINE_P0
#endif
#ifndef MCS51REG_UNDEFINE_P2
#define MCS51REG_UNDEFINE_P2
#endif
#endif

#ifdef MCS51REG_EXTERNAL_RAM
#ifndef MCS51REG_UNDEFINE_P0
#define MCS51REG_UNDEFINE_P0
#endif
#ifndef MCS51REG_UNDEFINE_P2
#define MCS51REG_UNDEFINE_P2
#endif
#endif

#ifdef MCS51REG_UNDEFINE_P0
#undef P0
#endif

#ifdef MCS51REG_UNDEFINE_P2
#undef P2
#endif

////////////////////////////////
///  Register definitions    ///
///  (In alphabetical order) ///
////////////////////////////////

#ifdef ACC
#undef ACC
sfr at 0xE0 ACC  ;
#endif

#ifdef ACON__PAGEE__PAGES__PAGE0__x__x__x__x__x
#undef ACON__PAGEE__PAGES__PAGE0__x__x__x__x__x
sfr at 0x9D ACON   ; // DS89C420 specific
// Not directly accessible bits
#define PAGE0   0x20
#define PAGES   0x40
#define PAGEE   0x80
#endif

#ifdef ACON__x__x__x__x__x__SA__AM1__AM0
#undef ACON__x__x__x__x__x__SA__AM1__AM0
sfr at 0x9D ACON   ; // DS89C390 specific
// Not directly accessible bits
#define AM0   0x01
#define AM1   0x02
#define SA    0x04
#endif

#ifdef ADCH_AT_0XC6
#undef ADCH_AT_0XC6
sfr at 0xC6 ADCH	; // A/D converter high
#endif

#ifdef ADCON
#undef ADCON
sfr at 0xD8 ADCON   ; // A/D-converter control register SAB80515 specific
// Bit registers
sbit at 0xD8 MX0        ;
sbit at 0xD9 MX1        ;
sbit at 0xDA MX2        ;
sbit at 0xDB ADM        ;
sbit at 0xDC BSY        ;
sbit at 0xDE CLK        ;
sbit at 0xDF BD         ;
#endif

// ADCON0 ... Infineon / Siemens also called this register ADCON in the User Manual
#ifdef ADCON0
#undef ADCON0
sfr at 0xD8 ADCON0      ; // A/D-converter control register 0 SAB80515A &
// Bit registers          // SAB80517 specific
sbit at 0xD8 MX0        ;
sbit at 0xD9 MX1        ;
sbit at 0xDA MX2        ;
sbit at 0xDB ADM        ;
sbit at 0xDC BSY        ;
sbit at 0xDD ADEX       ;
sbit at 0xDE CLK        ;
sbit at 0xDF BD         ;
// Not directly accessible ADCON0
#define ADCON0_MX0		0x01
#define ADCON0_MX1		0x02
#define ADCON0_MX2		0x04
#define ADCON0_ADM		0x08
#define ADCON0_BSY		0x10
#define ADCON0_ADEX		0x20
#define ADCON0_CLK		0x40
#define ADCON0_BD		0x80
#endif

#ifdef ADCON1
#undef ADCON1
sfr at 0xDC ADCON1      ; // A/D-converter control register 1 SAB80515A & SAB80517 specific
// Not directly accessible ADCON1
#define ADCON1_MX0		0x01
#define ADCON1_MX1		0x02
#define ADCON1_MX2		0x04
#define ADCON1_ADCL		0x80
#endif

#ifdef ADCON__ADC_1__ADC_0__ADEX__ADCI__ADCS__AADR2__AADR1__AADR0
#undef ADCON__ADC_1__ADC_0__ADEX__ADCI__ADCS__AADR2__AADR1__AADR0
sfr at 0xC5 ADCON	; // A/D control, P80C552 specific
// Not directly accessible Bits.
#define AADR0	0x01
#define AADR1	0x02
#define AADR2	0x04
#define ADCS	0x08
#define ADCI	0x10
#define ADEX	0x20
#define ADC_0	0x40	// different name as ADC0 in P5
#define ADC_1	0x80	// different name as ADC1 in P5
#endif

#ifdef ADDAT
#undef ADDAT
sfr at 0xD9 ADDAT   ; // A/D-converter data register SAB80515 specific
#endif

#ifdef ADDATH
#undef ADDATH
sfr at 0xD9 ADDATH      ; // A/D data high byte SAB80515A specific
#endif

#ifdef ADDATL
#undef ADDATL
sfr at 0xDA ADDATL      ; // A/D data low byte SAB80515A specific
#endif

#ifdef ARCON
#undef ARCON
sfr at 0xEF ARCON       ; // arithmetic control register SAB80517
#endif

#ifdef AP
#undef AP
sfr at 0x9C AP          ; // DS80C390
#endif

#ifdef B
#undef B
sfr at 0xF0 B    ;
// Bit registers
sbit at 0xF0 BREG_F0        ;
sbit at 0xF1 BREG_F1        ;
sbit at 0xF2 BREG_F2        ;
sbit at 0xF3 BREG_F3        ;
sbit at 0xF4 BREG_F4        ;
sbit at 0xF5 BREG_F5        ;
sbit at 0xF6 BREG_F6        ;
sbit at 0xF7 BREG_F7        ;
#endif

#ifdef BP2
#undef BP2
sfr at 0xC3 BP2    ;
// Not directly accessible bits
#define MS0   0x01
#define MS1   0x02
#define MS2   0x04
#define LB1   0x08
#define LB2   0x10
#define LB3   0x20
#endif

#ifdef C0C
#undef C0C
sfr at 0xA3 C0C         ; // DS80C390 specific
// Not directly accessible bits
#define SWINT   0x01
#define ERCS    0x02
#define AUTOB   0x04
#define CRST    0x08
#define SIESTA  0x10
#define PDE     0x20
#define STIE    0x40
#define ERIE    0x80
#endif

#ifdef C0IR
#undef C0IR
sfr at 0xA5 C0IR        ; // DS80C390 specific
// Not directly accessible bits
#define INTIN0     0x01
#define INTIN1     0x02
#define INTIN2     0x04
#define INTIN3     0x08
#define INTIN4     0x10
#define INTIN5     0x20
#define INTIN6     0x40
#define INTIN7     0x80
#endif

#ifdef C0M1C
#undef C0M1C
sfr at 0xAB C0M1C       ; // DS80C390 specific
// Not directly accessible bits
#define DTUP     0x01
#define ROW_TIH  0x02
#define MTRQ     0x04
#define EXTRQ    0x08
#define INTRQ    0x10
#define ERI      0x20
#define ETI      0x40
#define MSRDY    0x80
#endif

#ifdef C0M2C
#undef C0M2C
sfr at 0xAC C0M2C       ; // DS80C390 specific
#endif

#ifdef C0M3C
#undef C0M3C
sfr at 0xAD C0M3C       ; // DS80C390 specific
#endif

#ifdef C0M4C
#undef C0M4C
sfr at 0xAE C0M4C       ; // DS80C390 specific
#endif

#ifdef C0M5C
#undef C0M5C
sfr at 0xAF C0M5C       ; // DS80C390 specific
#endif

#ifdef C0M6C
#undef C0M6C
sfr at 0xB3 C0M6C       ; // DS80C390 specific
#endif

#ifdef C0M7C
#undef C0M7C
sfr at 0xB4 C0M7C       ; // DS80C390 specific
#endif

#ifdef C0M8C
#undef C0M8C
sfr at 0xB5 C0M8C       ; // DS80C390 specific
#endif

#ifdef C0M9C
#undef C0M9C
sfr at 0xB6 C0M9C       ; // DS80C390 specific
#endif

#ifdef C0M10C
#undef C0M10C
sfr at 0xB7 C0M10C       ; // DS80C390 specific
#endif

#ifdef C0M11C
#undef C0M11C
sfr at 0xBB C0M11C       ; // DS80C390 specific
#endif

#ifdef C0M12C
#undef C0M12C
sfr at 0xBC C0M12C       ; // DS80C390 specific
#endif

#ifdef C0M13C
#undef C0M13C
sfr at 0xBD C0M13C       ; // DS80C390 specific
#endif

#ifdef C0M14C
#undef C0M14C
sfr at 0xBE C0M14C       ; // DS80C390 specific
#endif

#ifdef C0M15C
#undef C0M15C
sfr at 0xBF C0M15C       ; // DS80C390 specific
#endif

#ifdef C0RE
#undef C0RE
sfr at 0xA7 C0RE        ; // DS80C390 specific
#endif

#ifdef C0RMS0
#undef C0RMS0
sfr at 0x96 C0RMS0      ; // DS80C390 specific
#endif

#ifdef C0RMS1
#undef C0RMS1
sfr at 0x97 C0RMS1      ; // DS80C390 specific
#endif

#ifdef C0S
#undef C0S
sfr at 0xA4 C0S         ; // DS80C390 specific
// Not directly accessible bits
#define ER0     0x01
#define ER1     0x02
#define ER2     0x04
#define TXS     0x08
#define RXS     0x10
#define WKS     0x20
#define EC96_128    0x40
#define BSS     0x80
#endif

#ifdef C0TE
#undef C0TE
sfr at 0xA6 C0TE        ; // DS80C390 specific
#endif

#ifdef C0TMA0
#undef C0TMA0
sfr at 0x9E C0TMA0      ; // DS80C390 specific
#endif

#ifdef C0TMA1
#undef C0TMA1
sfr at 0x9F C0TMA1      ; // DS80C390 specific
#endif

#ifdef C1C
#undef C1C
sfr at 0xE3 C1C         ; // DS80C390 specific
// Not directly accessible bits
#define SWINT   0x01
#define ERCS    0x02
#define AUTOB   0x04
#define CRST    0x08
#define SIESTA  0x10
#define PDE     0x20
#define STIE    0x40
#define ERIE    0x80
#endif

#ifdef C1IR
#undef C1IR
sfr at 0xE5 C1IR         ; // DS80C390 specific
// Not directly accessible bits
#define INTIN0  0x01
#define INTIN1  0x02
#define INTIN2  0x04
#define INTIN3  0x08
#define INTIN4  0x10
#define INTIN5  0x20
#define INTIN6  0x40
#define INTIN7  0x80
#endif

#ifdef C1IRE
#undef C1IRE
sfr at 0xE7 C1RE         ; // DS80C390 specific
#endif

#ifdef C1M1C
#undef C1M1C
sfr at 0xEB C1M1C        ; // DS80C390 specific
#endif

#ifdef C1M2C
#undef C1M2C
sfr at 0xEC C1M2C        ; // DS80C390 specific
#endif

#ifdef C1M3C
#undef C1M3C
sfr at 0xED C1M3C        ; // DS80C390 specific
#endif

#ifdef C1M4C
#undef C1M4C
sfr at 0xEE C1M4C        ; // DS80C390 specific
#endif

#ifdef C1M5C
#undef C1M5C
sfr at 0xEF C1M5C        ; // DS80C390 specific
#endif

#ifdef C1M6C
#undef C1M6C
sfr at 0xF3 C1M6C        ; // DS80C390 specific
#endif

#ifdef C1M7C
#undef C1M7C
sfr at 0xF4 C1M7C        ; // DS80C390 specific
#endif

#ifdef C1M8C
#undef C1M8C
sfr at 0xF5 C1M8C        ; // DS80C390 specific
#endif

#ifdef C1M9C
#undef C1M9C
sfr at 0xF6 C1M9C        ; // DS80C390 specific
#endif

#ifdef C1M10C
#undef C1M10C
sfr at 0xF7 C1M10C       ; // DS80C390 specific
#endif

#ifdef C1M11C
#undef C1M11C
sfr at 0xFB C1M11C       ; // DS80C390 specific
#endif

#ifdef C1M12C
#undef C1M12C
sfr at 0xFC C1M12C       ; // DS80C390 specific
#endif

#ifdef C1M13C
#undef C1M13C
sfr at 0xFD C1M13C        ; // DS80C390 specific
#endif

#ifdef C1M14C
#undef C1M14C
sfr at 0xFE C1M14C        ; // DS80C390 specific
#endif

#ifdef C1M15C
#undef C1M15C
sfr at 0xFF C1M15C        ; // DS80C390 specific
#endif

#ifdef C1S
#undef C1S
sfr at 0xE4 C1S          ; // DS80C390 specific
// Not directly accessible bits
#define ER0     0x01
#define ER1     0x02
#define ER2     0x04
#define TXS     0x08
#define RXS     0x10
#define WKS     0x20
#define CECE    0x40
#define BSS     0x80
#endif

#ifdef C1ITE
#undef C1ITE
sfr at 0xE6 C1TE         ; // DS80C390 specific
#endif

#ifdef C1RSM0
#undef C1RSM0
sfr at 0xD6 C1RSM0      ; // DS80C390 specific
#endif

#ifdef C1RSM1
#undef C1RSM1
sfr at 0xD7 C1RSM1      ; // DS80C390 specific
#endif

#ifdef C1TMA0
#undef C1TMA0
sfr at 0xDE C1TMA0      ; // DS80C390 specific
#endif

#ifdef C1TMA1
#undef C1TMA1
sfr at 0xDF C1TMA1      ; // DS80C390 specific
#endif

#ifdef CC4EN
#undef CC4EN
sfr at 0xC9 CC4EN       ; // compare/capture 4 enable register SAB80517 specific
#endif

#ifdef CCEN
#undef CCEN
sfr at 0xC1 CCEN        ; // compare/capture enable register SAB80515 specific
#endif

#ifdef CCH1
#undef CCH1
sfr at 0xC3 CCH1        ; // compare/capture register 1, high byte SAB80515 specific
#endif

#ifdef CCH2
#undef CCH2
sfr at 0xC5 CCH2        ; // compare/capture register 2, high byte SAB80515 specific
#endif

#ifdef CCH3
#undef CCH3
sfr at 0xC7 CCH3        ; // compare/capture register 3, high byte SAB80515 specific
#endif

#ifdef CCH4
#undef CCH4
sfr at 0xCF CCH4        ; // compare/capture register 4, high byte SAB80515 specific
#endif

#ifdef CCL1
#undef CCL1
sfr at 0xC2 CCL1        ; // compare/capture register 1, low byte SAB80515 specific
#endif

#ifdef CCL2
#undef CCL2
sfr at 0xC4 CCL2        ; // compare/capture register 2, low byte SAB80515 specific
#endif

#ifdef CCL3
#undef CCL3
sfr at 0xC6 CCL3        ; // compare/capture register 3, low byte SAB80515 specific
#endif

#ifdef CCL4
#undef CCL4
sfr at 0xCE CCL4        ; // compare/capture register 4, low byte SAB80515 specific
#endif

#ifdef CKCON
#undef CKCON
sfr at 0x8E CKCON       ; // DS80C320 & DS80C390 specific
// Not directly accessible Bits.
#define MD0    0x01
#define MD1    0x02
#define MD2    0x04
#define T0M    0x08
#define T1M    0x10
#define T2M    0x20
#define WD0    0x40
#define WD1    0x80
#endif

#ifdef CKMOD
#undef CKMOD
sfr at 0x96 CKMOD       ; // DS89C420 specific
// Not directly accessible Bits.
#define T0MH   0x08
#define T1MH   0x10
#define T2MH   0x20
#endif

#ifdef CMEN
#undef CMEN
sfr at 0xF6 CMEN    ; // compare enable register SAB80517 specific
#endif

#ifdef CMH0
#undef CMH0
sfr at 0xD3 CMH0    ; // compare register 0 high byte SAB80517 specific
#endif

#ifdef CMH1
#undef CMH1
sfr at 0xD5 CMH1    ; // compare register 1 high byte SAB80517 specific
#endif

#ifdef CMH2
#undef CMH2
sfr at 0xD7 CMH2    ; // compare register 2 high byte SAB80517 specific
#endif

#ifdef CMH3
#undef CMH3
sfr at 0xE3 CMH3    ; // compare register 3 high byte SAB80517 specific
#endif

#ifdef CMH4
#undef CMH4
sfr at 0xE5 CMH4    ; // compare register 4 high byte SAB80517 specific
#endif

#ifdef CMH5
#undef CMH5
sfr at 0xE7 CMH5    ; // compare register 5 high byte SAB80517 specific
#endif

#ifdef CMH6
#undef CMH6
sfr at 0xF3 CMH6    ; // compare register 6 high byte SAB80517 specific
#endif

#ifdef CMH7
#undef CMH7
sfr at 0xF5 CMH7    ; // compare register 7 high byte SAB80517 specific
#endif

#ifdef CMH0_AT_0XC9
#undef CMH0_AT_0XC9
sfr at 0xC9 CMH0	; // Compare high 0, P80C552 specific
#endif

#ifdef CMH1_AT_0XCA
#undef CMH1_AT_0XCA
sfr at 0xCA CMH1	; // Compare high 1, P80C552 specific
#endif

#ifdef CMH2_AT_0XCB
#undef CMH2_AT_0XCB
sfr at 0xCB CMH2	; // Compare high 2, P80C552 specific
#endif

#ifdef CML0
#undef CML0
sfr at 0xD2 CML0    ; // compare register 0 low byte SAB80517 specific
#endif

#ifdef CML1
#undef CML1
sfr at 0xD4 CML1    ; // compare register 1 low byte SAB80517 specific
#endif

#ifdef CML2
#undef CML2
sfr at 0xD6 CML2    ; // compare register 2 low byte SAB80517 specific
#endif

#ifdef CML3
#undef CML3
sfr at 0xE2 CML3    ; // compare register 3 low byte SAB80517 specific
#endif

#ifdef CML4
#undef CML4
sfr at 0xE4 CML4    ; // compare register 4 low byte SAB80517 specific
#endif

#ifdef CML5
#undef CML5
sfr at 0xE6 CML5    ; // compare register 5 low byte SAB80517 specific
#endif

#ifdef CML6
#undef CML6
sfr at 0xF2 CML6    ; // compare register 6 low byte SAB80517 specific
#endif

#ifdef CML7
#undef CML7
sfr at 0xF4 CML7    ; // compare register 7 low byte SAB80517 specific
#endif

#ifdef CML0_AT_0XA9
#undef CML0_AT_0XA9
sfr at 0xA9 CML0	; // Compare low 0, P80C552 specific
#endif

#ifdef CML1_AT_0XAA
#undef CML1_AT_0XAA
sfr at 0xAA CML1	; // Compare low 1, P80C552 specific
#endif

#ifdef CML2_AT_0XAB
#undef CML2_AT_0XAB
sfr at 0xAB CML2	; // Compare low 2, P80C552 specific
#endif

#ifdef CMSEL
#undef CMSEL
sfr at 0xF7 CMSEL   ; // compare input select SAB80517
#endif

#ifdef COR
#undef COR
sfr at 0xCE COR     ; // Dallas DS80C390 specific
#define CLKOE       0x01
#define COD0        0x02
#define COD1        0x04
#define C0BPR6      0x08
#define C0BPR7      0x10
#define C1BPR6      0x20
#define C1BPR7      0x40
#define IRDACK      0x80
#endif

#ifdef CRC
#undef CRC
sfr at 0xC1 CRC     ; // Dallas DS5001 specific
#define CRC_        0x01
#define MDM         0x02
#define RNGE0       0x10
#define RNGE1       0x20
#define RNGE2       0x40
#define RNGE3       0x80
#endif

#ifdef CRCH
#undef CRCH
sfr at 0xCB CRCH    ; // compare/reload/capture register, high byte SAB80515 specific
#endif

#ifdef CRCHIGH
#undef CRCHIGH
sfr at 0xC3 CRCHIGH ; // DS5001 specific
#endif

#ifdef CRCL
#undef CRCL
sfr at 0xCA CRCL    ; // compare/reload/capture register, low byte SAB80515 specific
#endif

#ifdef CRCLOW
#undef CRCLOW
sfr at 0xC2 CRCLOW  ; // DS5001 specific
#endif

#ifdef CTCOM_AT_0XE1
#undef CTCOM_AT_0XE1
sfr at 0xE1 CTCON    ; // com.timer control register SAB80517
#endif

#ifdef CTCON__CTN3__CTP3__CTN2__CTP2__CTN1__CTP1__CTN0__CTP0
#undef CTCON__CTN3__CTP3__CTN2__CTP2__CTN1__CTP1__CTN0__CTP0
sfr at 0xEB CTCON	; // Capture control, P80C552 specific
// Not directly accessible Bits.
#define CTP0	0x01
#define CTN0	0x02
#define CTP1	0x04
#define CTN1	0x08
#define CTP2	0x10
#define CTN2	0x20
#define CTP3	0x40
#define CTN3	0x80
#endif

#ifdef CTH0_AT_0XCC
#undef CTH0_AT_0XCC
sfr at 0xCC CTH0	; // Capture high 0, P80C552 specific
#endif

#ifdef CTH1_AT_0XCD
#undef CTH1_AT_0XCD
sfr at 0xCD CTH1	; // Capture high 1, P80C552 specific
#endif

#ifdef CTH2_AT_0XCE
#undef CTH2_AT_0XCE
sfr at 0xCE CTH2	; // Capture high 2, P80C552 specific
#endif

#ifdef CTH3_AT_0XCF
#undef CTH3_AT_0XCF
sfr at 0xCF CTH3	; // Capture high 3, P80C552 specific
#endif

#ifdef CTL0_AT_0XAC
#undef CTL0_AT_0XAC
sfr at 0xAC CTL0	; // Capture low 0, P80C552 specific
#endif

#ifdef CTL1_AT_0XAD
#undef CTL1_AT_0XAD
sfr at 0xAD CTL1	; // Capture low 1, P80C552 specific
#endif

#ifdef CTL2_AT_0XAE
#undef CTL2_AT_0XAE
sfr at 0xAE CTL2	; // Capture low 2, P80C552 specific
#endif

#ifdef CTL3_AT_0XAF
#undef CTL3_AT_0XAF
sfr at 0xAF CTL3	; // Capture low 3, P80C552 specific
#endif

#ifdef CTRELH
#undef CTRELH
sfr at 0xDF CTRELH  ; // com.timer rel register high byte SAB80517
#endif

#ifdef CTRELL
#undef CTRELL
sfr at 0xDE CTRELL  ; // com.timer rel register low byte SAB80517
#endif

#ifdef DAPR__SAB80515
#undef DAPR__SAB80515
sfr at 0xD8 DAPR    ; // D/A-converter program register SAB80515 specific
#endif

#ifdef DAPR__SAB80517
#undef DAPR__SAB80517
sfr at 0xDA DAPR    ; // D/A-converter program register SAB80517 specific
#endif

#ifdef DPH
#undef DPH
sfr at 0x83 DPH  ;
sfr at 0x83 DP0H ;  // Alternate name for AT89S53
#endif

#ifdef DPH1
#undef DPH1
sfr at 0x85 DPH1  ; // DS80C320 specific
sfr at 0x85 DP1H  ; // Alternate name for AT89S53
#endif

#ifdef DPL
#undef DPL
sfr at 0x82 DPL  ;  // Alternate name for AT89S53
sfr at 0x82 DP0L ;
#endif

#ifdef DPL1
#undef DPL1
sfr at 0x84 DPL1  ; // DS80C320 specific
sfr at 0x84 DP1L  ; // Alternate name for AT89S53
#endif

#ifdef DPS__x__x__x__x__x__x__x__SEL
#undef DPS__x__x__x__x__x__x__x__SEL
sfr at 0x86 DPS  ;
// Not directly accessible DPS Bit. DS80C320 & DPS8XC520 specific
#define SEL    0x01
#endif

#ifdef DPS__ID1__ID0__TSL__x__x__x__x__SEL
#undef DPS__ID1__ID0__TSL__x__x__x__x__SEL
sfr at 0x86 DPS  ;
// Not directly accessible DPS Bit. DS89C390 specific
#define SEL    0x01
#define TSL    0x20
#define ID0    0x40
#define ID1    0x80
#endif

#ifdef DPS__ID1__ID0__TSL__AID__x__x__x__SEL
#undef DPS__ID1__ID0__TSL__AID__x__x__x__SEL
sfr at 0x86 DPS  ;
// Not directly accessible DPS Bit. DS89C420 specific
#define SEL    0x01
#define AID    0x10
#define TSL    0x20
#define ID0    0x40
#define ID1    0x80
#endif

#ifdef DPSEL
#undef DPSEL
sfr at 0x92 DPSEL   ; // data pointer select register SAB80517
#endif

#ifdef DPX
#undef DPX
sfr at 0x93 DPX1  ; // DS80C390 specific
#endif

#ifdef DPX1
#undef DPX1
sfr at 0x95 DPX1  ; // DS80C390 specific
#endif

#ifdef EIE__x__x__x__EWDI__EX5__EX4__EX3__EX2
#undef EIE__x__x__x__EWDI__EX5__EX4__EX3__EX2
sfr at 0xE8 EIE  ;
// Bit registers DS80C320 specific
sbit at 0xE8 EX2    ;
sbit at 0xE9 EX3    ;
sbit at 0xEA EX4    ;
sbit at 0xEB EX5    ;
sbit at 0xEC EWDI   ;
#endif

#ifdef EIE__CANBIE__C0IE__C1IE__EWDI__EX5__EX4__EX3__EX2
#undef EIE__CANBIE__C0IE__C1IE__EWDI__EX5__EX4__EX3__EX2
sfr at 0xE8 EIE  ;
// Bit registers DS80C390 specific
sbit at 0xE8 EX2    ;
sbit at 0xE9 EX3    ;
sbit at 0xEA EX4    ;
sbit at 0xEB EX5    ;
sbit at 0xEC EWDI   ;
sbit at 0xED C1IE   ;
sbit at 0xEE C0IE   ;
sbit at 0xEF CANBIE ;
#endif

#ifdef EIP__x__x__x__PWDI__PX5__PX4__PX3__PX2__PX1__PX0
#undef EIP__x__x__x__PWDI__PX5__PX4__PX3__PX2__PX1__PX0
sfr at 0xF8 EIP  ;
// Bit registers DS80C320 specific
sbit at 0xF8 PX2    ;
sbit at 0xF9 PX3    ;
sbit at 0xFA PX4    ;
sbit at 0xFB PX5    ;
sbit at 0xFC PWDI   ;
#endif

#ifdef EIP__CANBIP__C0IP__C1IP__PWDI__PX5__PX4__PX3__PX2__PX1__PX0
#undef EIP__CANBIP__C0IP__C1IP__PWDI__PX5__PX4__PX3__PX2__PX1__PX0
sfr at 0xF8 EIP  ;
// Bit registers DS80C320 specific
sbit at 0xF8 PX2    ;
sbit at 0xF9 PX3    ;
sbit at 0xFA PX4    ;
sbit at 0xFB PX5    ;
sbit at 0xFC PWDI   ;
sbit at 0xFD C1IP   ;
sbit at 0xFE C0IP   ;
sbit at 0xFF CANBIP ;
#endif

#ifdef ESP
#undef ESP
sfr at 0x9B ESP  ;
// Not directly accessible Bits DS80C390 specific
#define ESP_0   0x01
#define ESP_1   0x02
#endif

#ifdef EXIF__IE5__IE4__IE3__IE2__x__RGMD__RGSL__BGS
#undef EXIF__IE5__IE4__IE3__IE2__x__RGMD__RGSL__BGS
sfr at 0x91 EXIF  ;
// Not directly accessible EXIF Bits DS80C320 specific
#define BGS    0x01
#define RGSL   0x02
#define RGMD   0x04
#define IE2    0x10
#define IE3    0x20
#define IE4    0x40
#define IE5    0x80
#endif

#ifdef EXIF__IE5__IE4__IE3__IE2__XT_RG__RGMD__RGSL__BGS
#undef EXIF__IE5__IE4__IE3__IE2__XT_RG__RGMD__RGSL__BGS
sfr at 0x91 EXIF  ;
// Not directly accessible EXIF Bits DS87C520 specific
#define BGS    0x01
#define RGSL   0x02
#define RGMD   0x04
#define XT_RG  0x08
#define IE2    0x10
#define IE3    0x20
#define IE4    0x40
#define IE5    0x80
#endif

#ifdef EXIF__IE5__IE4__IE3__IE2__CKRY__RGMD__RGSL__BGS
#undef EXIF__IE5__IE4__IE3__IE2__CKRY__RGMD__RGSL__BGS
sfr at 0x91 EXIF  ;
// Not directly accessible EXIF Bits DS80C390 & DS89C420 specific
#define BGS    0x01
#define RGSL   0x02
#define RGMD   0x04
#define CKRY   0x08
#define IE2    0x10
#define IE3    0x20
#define IE4    0x40
#define IE5    0x80
#endif

#ifdef IE__EA__x__x__ES__ET1__EX1__ET0__EX0
#undef IE__EA__x__x__ES__ET1__EX1__ET0__EX0
sfr at 0xA8 IE   ;
// Bit registers
sbit at 0xA8 EX0  ;
sbit at 0xA9 ET0  ;
sbit at 0xAA EX1  ;
sbit at 0xAB ET1  ;
sbit at 0xAC ES   ;
sbit at 0xAF EA   ;
#endif

#ifdef IE__EA__x__ET2__ES__ET1__EX1__ET0__EX0
#undef IE__EA__x__ET2__ES__ET1__EX1__ET0__EX0
sfr at 0xA8 IE   ;
// Bit registers
sbit at 0xA8 EX0  ;
sbit at 0xA9 ET0  ;
sbit at 0xAA EX1  ;
sbit at 0xAB ET1  ;
sbit at 0xAC ES   ;
sbit at 0xAD ET2  ; // Enable timer2 interrupt
sbit at 0xAF EA   ;
#endif // IE

#ifdef IE__EA__EAD__ES1__ES0__ET1__EX1__ET0__EX0
#undef IE__EA__EAD__ES1__ES0__ET1__EX1__ET0__EX0
sfr at 0xA8 IE		; // same as IEN0 - Interrupt enable 0, P80C552 specific
sfr at 0xA8 IEN0    ; // alternate name   
// Bit registers
sbit at 0xA8 EX0	;
sbit at 0xA9 ET0	;
sbit at 0xAA EX1	;
sbit at 0xAB ET1	;
sbit at 0xAC ES0	;
sbit at 0xAD ES1	;
sbit at 0xAE EAD	;
sbit at 0xAF EEA	;
#endif

#ifdef IE__EA__ES1__ET2__ES__ET1__EX1__ET0__EX0
#undef IE__EA__ES1__ET2__ES__ET1__EX1__ET0__EX0
sfr at 0xA8 IE   ;
// Bit registers
sbit at 0xA8 EX0  ;
sbit at 0xA9 ET0  ;
sbit at 0xAA EX1  ;
sbit at 0xAB ET1  ;
sbit at 0xAC ES   ;
sbit at 0xAC ES0  ; // Alternate name
sbit at 0xAD ET2  ; // Enable timer2 interrupt
sbit at 0xAE ES1  ;
sbit at 0xAF EA   ;
#endif // IE

#ifdef IE__EA_WDT_ET2_ES_ET1_EX1_ET0_EX0
#undef IE__EA_WDT_ET2_ES_ET1_EX1_ET0_EX0
sfr at 0xA8 IE    ;
sfr at 0xA8 IEN0  ; // Alternate name
// Bit registers for the SAB80515 and compatible IE
sbit at 0xA8 EX0  ;
sbit at 0xA9 ET0  ;
sbit at 0xAA EX1  ;
sbit at 0xAB ET1  ;
sbit at 0xAC ES   ;
sbit at 0xAC ES0  ;
sbit at 0xAD ET2  ; // Enable timer 2 overflow SAB80515 specific
sbit at 0xAE WDT  ; // watchdog timer reset - SAB80515 specific
sbit at 0xAF EA   ;
sbit at 0xAF EAL  ; // EA as called by Infineon / Siemens
#endif

#ifdef IEN1__ET2__ECM2__ECM1__ECM0__ECT3__ECT2__ECT1__ECT0
#undef IEN1__ET2__ECM2__ECM1__ECM0__ECT3__ECT2__ECT1__ECT0
sfr at 0xE8 IEN1	; // Interrupt enable 1, P80C552 specific
// Bit registers
sbit at 0xE8 ECT0	;
sbit at 0xE9 ECT1	;
sbit at 0xEA ECT2	;
sbit at 0xEB ECT3	;
sbit at 0xEC ECM0	;
sbit at 0xED ECM1	;
sbit at 0xEE ECM2	;
sbit at 0xEF ET2	;
#endif

#ifdef IEN1__EXEN2__SWDT__EX6__EX5__EX4__EX3__EX2__EADC
#undef IEN1__EXEN2__SWDT__EX6__EX5__EX4__EX3__EX2__EADC
sfr at 0xB8 IEN1        ; // interrupt enable register - SAB80515 specific
// Bit registers
sbit at 0xB8 EADC       ; // A/D converter interrupt enable
sbit at 0xB9 EX2        ;
sbit at 0xBA EX3        ;
sbit at 0xBB EX4        ;
sbit at 0xBC EX5        ;
sbit at 0xBD EX6        ;
sbit at 0xBE SWDT       ; // watchdog timer start/reset
sbit at 0xBF EXEN2      ; // timer2 external reload interrupt enable
#endif

#ifdef IEN2__SAB80517
#undef IEN2__SAB80517
sfr at 0x9A IEN2        ; // interrupt enable register 2 SAB80517
#endif

#ifdef IP__x__x__x__PS__PT1__PX1__PT0__PX0
#undef IP__x__x__x__PS__PT1__PX1__PT0__PX0
sfr at 0xB8 IP   ;
// Bit registers
sbit at 0xB8 PX0  ;
sbit at 0xB9 PT0  ;
sbit at 0xBA PX1  ;
sbit at 0xBB PT1  ;
sbit at 0xBC PS   ;
#endif

#ifdef IP__x__x__PT2__PS__PT1__PX1__PT0__PX0
#undef IP__x__x__PT2__PS__PT1__PX1__PT0__PX0
sfr at 0xB8 IP    ;
// Bit registers
sbit at 0xB8 PX0  ;
sbit at 0xB9 PT0  ;
sbit at 0xBA PX1  ;
sbit at 0xBB PT1  ;
sbit at 0xBC PS   ;
sbit at 0xBC PS0  ;  // alternate name
sbit at 0xBD PT2  ;
#endif

#ifdef IP__x__PAD__PS1__PS0__PT1__PX1__PT0__PX0
#undef IP__x__PAD__PS1__PS0__PT1__PX1__PT0__PX0
sfr at 0xB8 IP		; // Interrupt priority 0, P80C552 specific
sfr at 0xB8 IP0		; // alternate name
// Bit registers
sbit at 0xB8 PX0	;
sbit at 0xB9 PT0	;
sbit at 0xBA PX1	;
sbit at 0xBB PT1	;
sbit at 0xBC PS0	;
sbit at 0xBD PS1	;
sbit at 0xBE PAD	;
#endif

#ifdef IP__x__PS1__PT2__PS__PT1_PX1__PT0__PX0
#undef IP__x__PS1__PT2__PS__PT1_PX1__PT0__PX0
sfr at 0xB8 IP   ;
// Bit registers
sbit at 0xB8 PX0  ;
sbit at 0xB9 PT0  ;
sbit at 0xBA PX1  ;
sbit at 0xBB PT1  ;
sbit at 0xBC PS   ;
sbit at 0xBD PT2  ;
sbit at 0xBE PS1  ;
#endif

#ifdef IP__RWT__x__x__PS__PT1__PX1__PT0__PX0
#undef IP__RWT__x__x__PS__PT1__PX1__PT0__PX0
sfr at 0xB8 IP   ;
// Bit registers
sbit at 0xB8 PX0  ;
sbit at 0xB9 PT0  ;
sbit at 0xBA PX1  ;
sbit at 0xBB PT1  ;
sbit at 0xBC PS   ;
sbit at 0xBF RWT  ;
#endif

#ifdef IP0__x__WDTS__IP0_5__IP0_4__IP0_3__IP0_2__IP0_1__IP0_0
#undef IP0__x__WDTS__IP0_5__IP0_4__IP0_3__IP0_2__IP0_1__IP0_0
sfr at 0xA9 IP0   ; // interrupt priority register SAB80515 specific
// Not directly accessible IP0 bits
#define IP0_0    0x01
#define IP0_1    0x02
#define IP0_2    0x04
#define IP0_3    0x08
#define IP0_4    0x10
#define IP0_5    0x20
#define WDTS     0x40
#endif

#ifdef IP0__x__LPS1__LPT2__LPS0__LPT1__LPX1__LPT0__LPX0
#undef IP0__x__LPS1__LPT2__LPS0__LPT1__LPX1__LPT0__LPX0
sfr at 0xB8 IP0   ; // interrupt priority register DS89C420 specific
// Not directly accessible IP0 bits
#define LPX0    0x01
#define LPT0    0x02
#define LPX1    0x04
#define LPT1    0x08
#define LPS0    0x10
#define LPT2    0x20
#define LPS1    0x40
#endif

#ifdef IP1__x__x__IP1_5__IP1_4__IP1_3__IP1_2__IP1_1__IP1_0
#undef IP1__x__x__IP1_5__IP1_4__IP1_3__IP1_2__IP1_1__IP1_0
sfr at 0xB9 IP1   ; // interrupt priority register SAB80515 specific
// Not directly accessible IP1 bits
#define IP1_0    0x01
#define IP1_1    0x02
#define IP1_2    0x04
#define IP1_3    0x08
#define IP1_4    0x10
#define IP1_5    0x20
#endif

#ifdef IP1__x__MPS1__MPT2__MPS0__MPT1__MPX1__MPT0__MPX0
#undef IP1__x__MPS1__MPT2__MPS0__MPT1__MPX1__MPT0__MPX0
sfr at 0xB1 IP1   ; // interrupt priority register DS89C420 specific
// Not directly accessible IP0 bits
#define LPX0    0x01
#define LPT0    0x02
#define LPX1    0x04
#define LPT1    0x08
#define LPS0    0x10
#define LPT2    0x20
#define LPS1    0x40
#endif

#ifdef IP1__PT2__PCM2__PCM1__PCM0__PCT3__PCT2__PCT1__PCT0
#undef IP1__PT2__PCM2__PCM1__PCM0__PCT3__PCT2__PCT1__PCT0
sfr at 0xF8 IP1		; // Interrupt priority 1, P80C552 specific
// Bit registers
sbit at 0xF8 PCT0	;
sbit at 0xF9 PCT1	;
sbit at 0xFA PCT2	;
sbit at 0xFB PCT3	;
sbit at 0xFC PCM0	;
sbit at 0xFD PCM1	;
sbit at 0xFE PCM2	;
sbit at 0xFF PT2	;
#endif

#ifdef IRCON
#undef IRCON
sfr at 0xC0 IRCON       ; // interrupt control register - SAB80515 specific
// Bit registers
sbit at 0xC0 IADC       ; // A/D converter irq flag
sbit at 0xC1 IEX2       ; // external interrupt edge detect flag
sbit at 0xC2 IEX3       ;
sbit at 0xC3 IEX4       ;
sbit at 0xC4 IEX5       ;
sbit at 0xC5 IEX6       ;
sbit at 0xC6 TF2        ; // timer 2 owerflow flag
sbit at 0xC7 EXF2       ; // timer2 reload flag
#endif

#ifdef IRCON0
#undef IRCON0
sfr at 0xC0 IRCON0       ; // interrupt control register - SAB80515 specific
// Bit registers
sbit at 0xC0 IADC       ; // A/D converter irq flag
sbit at 0xC1 IEX2       ; // external interrupt edge detect flag
sbit at 0xC2 IEX3       ;
sbit at 0xC3 IEX4       ;
sbit at 0xC4 IEX5       ;
sbit at 0xC5 IEX6       ;
sbit at 0xC6 TF2        ; // timer 2 owerflow flag
sbit at 0xC7 EXF2       ; // timer2 reload flag
#endif

#ifdef IRCON1
#undef IRCON1
sfr at 0xD1 IRCON1      ; // interrupt control register - SAB80515 specific
#endif

#ifdef MA
#undef MA
sfr at 0xD3 MA          ; // DS80C390
#endif

#ifdef MB
#undef MB
sfr at 0xD4 MB          ; // DS80C390
#endif

#ifdef MC
#undef MC
sfr at 0xD5 MC          ; // DS80C390
#endif

#ifdef MCNT0
#undef MCNT0
sfr at 0xD1 MCNT0       ; // DS80C390
#define MAS0     0x01
#define MAS1     0x02
#define MAS2     0x04
#define MAS3     0x08
#define MAS4     0x10
#define SCB      0x20
#define CSE      0x40
#define LSHIFT   0x80
#endif

#ifdef MCNT1
#undef MCNT1
sfr at 0xD2 MCNT1       ; // DS80C390
#define CLM      0x10
#define MOF      0x40
#define MST      0x80
#endif

#ifdef MCON__IDM1__IDM0__CMA__x__PDCE3__PDCE2__PDCE1__PDCE0
#undef MCON__IDM1__IDM0__CMA__x__PDCE3__PDCE2__PDCE1__PDCE0
sfr at 0xC6 MCON        ; // DS80C390
#define PDCE0    0x01
#define PDCE1    0x02
#define PDCE2    0x04
#define PDCE3    0x08
#define CMA      0x20
#define IDM0     0x40
#define IDM1     0x80
#endif

#ifdef MCON__PA3__PA2__PA1__PA0__RA32_8__ECE2__PAA__SL
#undef MCON__PA3__PA2__PA1__PA0__RA32_8__ECE2__PAA__SL
sfr at 0xC6 MCON        ; // DS5000
#define SL       0x01
#define PAA      0x02
#define ECE2     0x04
#define RA32_8   0x08
#define PA0      0x10
#define PA1      0x20
#define PA2      0x40
#define PA3      0x80
#endif

#ifdef MCON__PA3__PA2__PA1__PA0__RG1__PES__PM__SL
#undef MCON__PA3__PA2__PA1__PA0__RG1__PES__PM__SL
sfr at 0xC6 MCON        ; // DS5001
#define SL       0x01
#define PM       0x02
#define PES      0x04
#define RG1      0x08
#define PA0      0x10
#define PA1      0x20
#define PA2      0x40
#define PA3      0x80
#endif

#ifdef MD0
#undef MD0
sfr at 0xE9 MD0         ; // MUL / DIV register 0 SAB80517
#endif

#ifdef MD1
#undef MD1
sfr at 0xEA MD1         ; // MUL / DIV register 1 SAB80517
#endif

#ifdef MD2
#undef MD2
sfr at 0xEB MD2         ; // MUL / DIV register 2 SAB80517
#endif

#ifdef MD3
#undef MD3
sfr at 0xEC MD3         ; // MUL / DIV register 3 SAB80517
#endif

#ifdef MD4
#undef MD4
sfr at 0xED MD4         ; // MUL / DIV register 4 SAB80517
#endif

#ifdef MD5
#undef MD5
sfr at 0xEE MD5         ; // MUL / DIV register 5 SAB80517
#endif

#ifdef MXAX
#undef MXAX
sfr at 0xEA MXAX        ; // Dallas DS80C390
#endif

#ifdef P0
#undef P0
sfr at 0x80 P0   ;
//  Bit Registers
sbit at 0x80 P0_0 ;
sbit at 0x81 P0_1 ;
sbit at 0x82 P0_2 ;
sbit at 0x83 P0_3 ;
sbit at 0x84 P0_4 ;
sbit at 0x85 P0_5 ;
sbit at 0x86 P0_6 ;
sbit at 0x87 P0_7 ;
#endif

#ifdef P1
#undef P1
sfr at 0x90 P1   ;
// Bit registers
sbit at 0x90 P1_0 ;
sbit at 0x91 P1_1 ;
sbit at 0x92 P1_2 ;
sbit at 0x93 P1_3 ;
sbit at 0x94 P1_4 ;
sbit at 0x95 P1_5 ;
sbit at 0x96 P1_6 ;
sbit at 0x97 P1_7 ;
#endif

#ifdef P1_EXT__INT5__INT4__INT3__INT2__TXD1__RXD1__T2EX__T2
#undef P1_EXT__INT5__INT4__INT3__INT2__TXD1__RXD1__T2EX__T2
// P1 alternate functions
sbit at 0x90 T2   ;
sbit at 0x91 T2EX ;
sbit at 0x92 RXD1 ;
sbit at 0x93 TXD1 ;
sbit at 0x94 INT2 ;
sbit at 0x95 INT3 ;
sbit at 0x96 INT4 ;
sbit at 0x97 INT5 ;
#endif

#ifdef P1_EXT__T2__CLKOUT__T2EX__INT2__INT6_CC3__INT5_CC2__INT4_CC1__INT3_CC0
sbit at 0x90 INT3_CC0   ; // P1 alternate functions - SAB80515 specific
sbit at 0x91 INT4_CC1   ;
sbit at 0x92 INT5_CC2   ;
sbit at 0x93 INT6_CC3   ;
sbit at 0x94 INT2       ;
sbit at 0x95 T2EX       ;
sbit at 0x96 CLKOUT     ;
sbit at 0x97 T2         ;
#endif

#ifdef P1_EXT__CT0I__CT1I__CT2I__CT3I__T2__RT2__SCL__SDA
#undef P1_EXT__CT0I__CT1I__CT2I__CT3I__T2__RT2__SCL__SDA
// Bit registers
sbit at 0x90 CT0I	; // Port 1 alternate functions, P80C552 specific
sbit at 0x91 CT1I	;
sbit at 0x92 CT2I	;
sbit at 0x93 CT3I	;
sbit at 0x94 T2		;
sbit at 0x95 RT2	;
sbit at 0x96 SCL	;
sbit at 0x97 SDA	;
#endif

#ifdef P1_EXT__x__x__x__x__x__x__T2EX__T2
#undef P1_EXT__x__x__x__x__x__x__T2EX__T2
// P1 alternate functions
sbit at 0x90 T2         ;
sbit at 0x91 T2EX       ;
#endif

#ifdef P2
#undef P2
sfr at 0xA0 P2   ;
// Bit registers
sbit at 0xA0 P2_0 ;
sbit at 0xA1 P2_1 ;
sbit at 0xA2 P2_2 ;
sbit at 0xA3 P2_3 ;
sbit at 0xA4 P2_4 ;
sbit at 0xA5 P2_5 ;
sbit at 0xA6 P2_6 ;
sbit at 0xA7 P2_7 ;
#endif

#ifdef P3
#undef P3
sfr at 0xB0 P3   ;
// Bit registers
sbit at 0xB0 P3_0 ;
sbit at 0xB1 P3_1 ;
sbit at 0xB2 P3_2 ;
sbit at 0xB3 P3_3 ;
sbit at 0xB4 P3_4 ;
sbit at 0xB5 P3_5 ;
#ifndef MCS51REG_EXTERNAL_RAM
sbit at 0xB6 P3_6 ;
sbit at 0xB7 P3_7 ;
#endif
// alternate names
sbit at 0xB0 RXD  ;
sbit at 0xB0 RXD0  ;
sbit at 0xB1 TXD  ;
sbit at 0xB1 TXD0  ;
sbit at 0xB2 INT0 ;
sbit at 0xB3 INT1 ;
sbit at 0xB4 T0   ;
sbit at 0xB5 T1   ;
#ifndef MCS51REG_EXTERNAL_RAM
sbit at 0xB6 WR   ;
sbit at 0xB7 RD   ;
#endif
#endif

#ifdef P4_AT_0X80
#undef P4_AT_0X80
sfr at 0x80 P4          ; // Port 4 - DS80C390
// Bit registers
sbit at 0x80 P4_0       ;
sbit at 0x81 P4_1       ;
sbit at 0x82 P4_2       ;
sbit at 0x83 P4_3       ;
sbit at 0x84 P4_4       ;
sbit at 0x85 P4_5       ;
sbit at 0x86 P4_6       ;
sbit at 0x87 P4_7       ;
#endif

#ifdef P4_AT_0XC0
#undef P4_AT_0XC0
sfr at 0xC0 P4		; // Port 4, P80C552 specific
// Bit registers
sbit at 0xC0 CMSR0	;
sbit at 0xC1 CMSR1	;
sbit at 0xC2 CMSR2	;
sbit at 0xC3 CMSR3	;
sbit at 0xC4 CMSR4	;
sbit at 0xC5 CMSR5	;
sbit at 0xC6 CMT0	;
sbit at 0xC7 CMT1	;
#endif

#ifdef P4_AT_0XE8
#undef P4_AT_0XE8
sfr at 0xE8 P4          ; // Port 4 - SAB80515 & compatible microcontrollers
// Bit registers
sbit at 0xE8 P4_0       ;
sbit at 0xE9 P4_1       ;
sbit at 0xEA P4_2       ;
sbit at 0xEB P4_3       ;
sbit at 0xEC P4_4       ;
sbit at 0xED P4_5       ;
sbit at 0xEE P4_6       ;
sbit at 0xEF P4_7       ;
#endif

#ifdef P4CNT
#undef P4CNT
sfr at 0x92 P4CNT       ; // DS80C390
// Not directly accessible bits
#define P4CNT_0  0x01
#define P4CNT_1  0x02
#define P4CNT_2  0x04
#define P4CNT_3  0x08
#define P4CNT_4  0x10
#define P4CNT_5  0x20
#define SBCAN    0x40
#endif

#ifdef P5_AT_0XA1
#undef P5_AT_0XA1
sfr at 0xA1 P5          ; // Port 5 - DS80C390
#endif

#ifdef P5CNT
#undef P5CNT
sfr at 0xA2 P5CNT       ; // DS80C390
// Not directly accessible bits
#define P5CNT_0  0x01
#define P5CNT_1  0x02
#define P5CNT_2  0x04
#define C0_I_O   0x08
#define C1_I_O   0x10
#define SP1EC    0x20
#define SBCAN0BA 0x40
#define SBCAN1BA 0x80
#endif

#ifdef P5_AT_0XC4
#undef P5_AT_0XC4
sfr at 0xC4 P5		; // Port 5, P80C552 specific
// Not directly accessible Bits.
#define ADC0	0x01
#define ADC1	0x02
#define ADC2	0x04
#define ADC3	0x08
#define ADC4	0x10
#define ADC5	0x20
#define ADC6	0x40
#define ADC7	0x80
#endif

#ifdef P5_AT_0XF8
#undef P5_AT_0XF8
sfr at 0xF8 P5          ; // Port 5 - SAB80515 & compatible microcontrollers
// Bit registers
sbit at 0xF8 P5_0       ;
sbit at 0xF9 P5_1       ;
sbit at 0xFA P5_2       ;
sbit at 0xFB P5_3       ;
sbit at 0xFC P5_4       ;
sbit at 0xFD P5_5       ;
sbit at 0xFE P5_6       ;
sbit at 0xFF P5_7       ;
#endif

#ifdef P6_AT_0XDB
#undef P6_AT_0XDB
sfr at 0xDB P6          ; // Port 6 - SAB80515 & compatible microcontrollers
#endif

#ifdef P6_AT_0XFA
#undef P6_AT_0XFA
sfr at 0xFA P6          ; // Port 6 - SAB80517 specific
#endif

#ifdef P7_AT_0XDB
#undef P7_AT_0XDB
sfr at 0xDB P7          ; // Port 7 - SAB80517 specific
#endif

#ifdef P8_AT_0XDD
#undef P8_AT_0XDD
sfr at 0xDD P8          ; // Port 6 - SAB80517 specific
#endif

#ifdef PCON__SMOD__x__x__x__x__x__x__x
#undef PCON__SMOD__x__x__x__x__x__x__x
sfr at 0x87 PCON ;
// Not directly accessible PCON bits
#define SMOD    0x80
#endif

#ifdef PCON__SMOD__x__x__x__GF1__GF0__PD__IDL
#undef PCON__SMOD__x__x__x__GF1__GF0__PD__IDL
sfr at 0x87 PCON ;
// Not directly accessible PCON bits
#define IDL             0x01
#define PD              0x02
#define GF0             0x04
#define GF1             0x08
#define SMOD            0x80
#endif

#ifdef PCON__SMOD__x__x__WLE__GF1__GF0__PD__IDL
#undef PCON__SMOD__x__x__WLE__GF1__GF0__PD__IDL
sfr at 0x87 PCON	; // PCON, P80C552 specific
// Not directly accessible Bits.
#define IDL	0x01
#define IDLE    0x01  ; same as IDL
#define PD	0x02
#define GF0	0x04
#define GF1	0x08
#define WLE	0x10
#define SMOD	0x80
#endif

#ifdef PCON__SMOD__PDS__IDLS__x__x__x__PD__IDL
#undef PCON__SMOD__PDS__IDLS__x__x__x__PD__IDL
sfr at 0x87 PCON ;
// Not directly accessible PCON bits
#define IDL             0x01
#define IDLE            0x01  ; same as IDL
#define PD              0x02  ;
#define PDE             0x02  ; same as PD
#define IDLS            0x20
#define PDS             0x40
#define SMOD            0x80
// alternate names
#define PCON_IDLE       0x01
#define PCON_PDE        0x02
#define PCON_GF0        0x04
#define PCON_GF1        0x08
#define PCON_IDLS       0x20
#define PCON_PDS        0x40
#define PCON_SMOD       0x80
#endif

#ifdef PCON__SMOD__POR__PFW__WTR__EPFW__EWT__STOP__IDL
#undef PCON__SMOD__POR__PFW__WTR__EPFW__EWT__STOP__IDL
sfr at 0x87 PCON ;
// Not directly accessible PCON bits
#define IDL             0x01
#define IDLE            0x01  ; same as IDL
#define STOP            0x02  ;
#define EWT             0x04
#define EPFW            0x08
#define WTR             0x10
#define PFW             0x20
#define POR             0x40
#define SMOD            0x80
#endif

#ifdef PCON__SMOD__SMOD0__x__x__GF1__GF0__STOP__IDLE
#undef PCON__SMOD__SMOD0__x__x__GF1__GF0__STOP__IDLE
sfr at 0x87 PCON ;
// Not directly accessible PCON bits
#define IDL             0x01
#define IDLE            0x01  ; same as IDL
#define STOP            0x02  ;
#define GF0             0x04
#define GF1             0x08
#define SMOD0           0x40
#define SMOD            0x80
#endif

#ifdef PCON__SMOD__SMOD0__OFDF__OFDE__GF1__GF0__STOP__IDLE
#undef PCON__SMOD__SMOD0__OFDF__OFDE__GF1__GF0__STOP__IDLE
sfr at 0x87 PCON ;
// Not directly accessible PCON bits
#define IDL             0x01
#define IDLE            0x01  ; same as IDL
#define STOP            0x02  ;
#define GF0             0x04
#define GF1             0x08
#define OFDE            0x10
#define OFDF            0x20
#define SMOD0           0x40
#define SMOD            0x80
#define SMOD_0          0x80  ; same as SMOD
#endif

#ifdef PMR__CD1__CD0__SWB__x__XTOFF__ALEOFF__DME1_DME0
#undef PMR__CD1__CD0__SWB__x__XTOFF__ALEOFF__DME1_DME0
sfr at 0xC4 PMR  ;   // DS87C520, DS83C520
// Not directly accessible bits
#define DME0    0x01
#define DME1    0x02
#define ALEOFF  0x04
#define XTOFF   0x08
#define SWB     0x20
#define CD0     0x40
#define CD1     0x80
#endif

#ifdef PMR__CD1__CD0__SWB__CTM__4X_2X__ALEOFF__x__x
#undef PMR__CD1__CD0__SWB__CTM__4X_2X__ALEOFF__x__x
sfr at 0xC4 PMR  ;   // DS80C390
// Not directly accessible bits
#define ALEOFF  0x04
#define XTOFF   0x08
#define _4X_2X  0x10
#define SWB     0x20
#define CD0     0x40
#define CD1     0x80
#endif

#ifdef PSW
#undef PSW
sfr at 0xD0 PSW  ;
// Bit registers
sbit at 0xD0 P    ;
sbit at 0xD1 F1   ;
sbit at 0xD2 OV   ;
sbit at 0xD3 RS0  ;
sbit at 0xD4 RS1  ;
sbit at 0xD5 F0   ;
sbit at 0xD6 AC   ;
sbit at 0xD7 CY   ;
#endif

#ifdef PWM0_AT_0XFC
#undef PWM0_AT_0XFC
sfr at 0xFC PWM0	; // PWM register 0, P80C552 specific
#endif

#ifdef PWM1_AT_0XFD
#undef PWM1_AT_0XFD
sfr at 0xFD PWM1	; // PWM register 1, P80C552 specific
#endif

#ifdef PWMP_AT_0XFE
#undef PWMP_AT_0XFE
sfr at 0xFE PWMP	; // PWM prescaler, P80C552 specific
#endif

#ifdef RCAP2H
#undef RCAP2H
sfr at 0xCB RCAP2H  ;
#endif

#ifdef RCAP2L
#undef RCAP2L
sfr at 0xCA RCAP2L  ;
#endif

#ifdef RNR
#undef RNR
sfr at 0xCF RNR  ;
#endif

#ifdef ROMSIZE__x__x__x__x__x__RMS2__RMS1__RMS0
#undef ROMSIZE__x__x__x__x__x__RMS2__RMS1__RMS0
sfr at 0xC2 ROMSIZE  ;   // DS87C520, DS83C520
// Not directly accessible bits
#define RSM0    0x01
#define RSM1    0x02
#define RSM2    0x04
#endif

#ifdef ROMSIZE__HBPF__BPF__TE__MOVCX__PRAME__RMS2__RMS1__RMS0
#undef ROMSIZE__HBPF__BPF__TE__MOVCX__PRAME__RMS2__RMS1__RMS0
sfr at 0xC2 ROMSIZE  ;   // DS87C520, DS83C520
// Not directly accessible bits
#define RSM0    0x01
#define RSM1    0x02
#define RSM2    0x04
#define PRAME   0x08
#define MOVCX   0x10
#define TE      0x20
#define BPF     0x40
#define HBPF    0x80
#endif

#ifdef RPCTL
#undef RPCTL
sfr at 0xD8 RPCTL     ;  // Dallas DS5001 specific
sbit at 0xD8 RG0      ;
sbit at 0xD9 RPCON    ;
sbit at 0xDA DMA      ;
sbit at 0xDB IBI      ;
sbit at 0xDC AE       ;
sbit at 0xDD EXBS     ;
sbit at 0xDF RNR_FLAG ;
#endif

#ifdef RTE__TP47__TP46__RP45__RP44__RP43__RP42__RP41__RP40
#undef RTE__TP47__TP46__RP45__RP44__RP43__RP42__RP41__RP40
sfr at 0xEF RTE	    ; // Reset/toggle enable, P80C552 specific
// Not directly accessible Bits.
#define RP40	0x01
#define RP41	0x02
#define RP42	0x04
#define RP43	0x08
#define RP44	0x10
#define RP45	0x20
#define TP46	0x40
#define TP47	0x80
#endif

#ifdef S0BUF
#undef S0BUF
sfr at 0x99 S0BUF ; // serial channel 0 buffer register SAB80517 specific
#endif

#ifdef S0CON__SM0__SM1__SM2__REN__TB8__RB8__TI__RI
#undef S0CON__SM0__SM1__SM2__REN__TB8__RB8__TI__RI
sfr at 0x98 S0CON ; // serial channel 0 control register P80C552 specific
// Bit registers
// Already defined in SCON
//sbit at 0x98 RI0  ;
//sbit at 0x99 TI0  ;
//sbit at 0x9A RB8  ;
//sbit at 0x9B TB8  ;
//sbit at 0x9C REN  ;
//sbit at 0x9D SM2  ;
//sbit at 0x9E SM1  ;
//sbit at 0x9F SM0  ;
#endif
 
#ifdef S0CON__SM0__SM1__SM20__REN0__TB80__RB80__TI0__RI0
#undef S0CON__SM0__SM1__SM20__REN0__TB80__RB80__TI0__RI0
// serial channel 0 buffer register SAB80517 specific(same as stock SCON)
sfr at 0x98 S0CON ;
sbit at 0x98 RI0  ;
sbit at 0x99 TI0  ;
sbit at 0x9A RB80 ;
sbit at 0x9B TB80  ;
sbit at 0x9C REN0  ;
sbit at 0x9D SM20  ;
sbit at 0x9E SM1  ;
sbit at 0x9F SM0  ;

#endif


#ifdef S0RELL
#undef S0RELL
sfr at 0xAA S0RELL ; // serial channel 0 reload register low byte SAB80517 specific
#endif

#ifdef S0RELH
#undef S0RELH
sfr at 0xBA S0RELH ; // serial channel 0 reload register high byte SAB80517 specific
#endif

#ifdef S1ADR__x__x__x__x__x__x__x__GC
#undef S1ADR__x__x__x__x__x__x__x__GC
sfr at 0xDB S1ADR	; // Serial 1 address, P80C552 specific
// Not directly accessible Bits.
#define GC	0x01
#endif

#ifdef S1BUF
#undef S1BUF
sfr at 0x9C S1BUF ; // serial channel 1 buffer register SAB80517 specific
#endif

#ifdef S1CON_AT_0X9B
#undef S1CON_AT_0X9B
sfr at 0x9B S1CON ; // serial channel 1 control register SAB80517 specific
#endif

#ifdef S1CON__CR2__ENS1__STA__ST0__SI__AA__CR1__CR0
#undef S1CON__CR2__ENS1__STA__ST0__SI__AA__CR1__CR0
sfr at 0xD8 S1CON	; // Serial 1 control, P80C552 specific
sfr at 0xD8 SICON	; // sometimes called SICON
// Bit register
sbit at 0xD8 CR0	;
sbit at 0xD9 CR1	;
sbit at 0xDA AA		;
sbit at 0xDB SI		;
sbit at 0xDC ST0	;
sbit at 0xDD STA	;
sbit at 0xDE ENS1	;
sbit at 0xDF CR2	;
#endif

#ifdef S1DAT_AT_0XDA
#undef S1DAT_AT_0XDA
sfr at 0xDA S1DAT	; // Serial 1 data, P80C552 specific
sfr at 0xDA SIDAT	; // sometimes called SIDAT
#endif

#ifdef S1RELL
#undef S1RELL
sfr at 0x9D S1RELL ; // serial channel 1 reload register low byte SAB80517 specific
#endif

#ifdef S1RELH
#undef S1RELH
sfr at 0xBB S1RELH ; // serial channel 1 reload register high byte SAB80517 specific
#endif

#ifdef S1STA__SC4__SC3__SC2__SC1__SC0__x__x__x
#undef S1STA__SC4__SC3__SC2__SC1__SC0__x__x__x
sfr at 0xD9 S1STA	; // Serial 1 status, P80C552 specific
// Not directly accessible Bits.
#define SC0	0x08
#define SC1	0x10
#define SC2	0x20
#define SC3	0x40
#define SC4	0x80
#endif

#ifdef SADDR0
#undef SADDR0
// DS80C320 specific
sfr at 0xA9 SADDR0  ;
#endif

#ifdef SADDR1
#undef SADDR1
// DS80C320 specific
sfr at 0xAA SADDR1  ;
#endif

#ifdef SADEN0
#undef SADEN0
// DS80C320 & DS80C390 specific
sfr at 0xB9 SADEN0  ;
#endif

#ifdef SADEN1
#undef SADEN1
// DS80C320 & DS80C390 specific
sfr at 0xBA SADEN1  ;
#endif

#ifdef SBUF
#undef SBUF
sfr at 0x99 SBUF ;
sfr at 0x99 SBUF0 ;
#endif

#ifdef SBUF1
#undef SBUF1
// DS80C320 & DS80C390 specific
sfr at 0xC1 SBUF1 ;
#endif

#ifdef SCON
#undef SCON
sfr at 0x98 SCON ;
// Bit registers
sbit at 0x98 RI   ;
sbit at 0x99 TI   ;
sbit at 0x9A RB8  ;
sbit at 0x9B TB8  ;
sbit at 0x9C REN  ;
sbit at 0x9D SM2  ;
sbit at 0x9E SM1  ;
sbit at 0x9F SM0  ;
#endif

#ifdef SCON0
#undef SCON0
sfr at 0x98 SCON0 ;
// Bit registers
sbit at 0x98 RI_0   ;
sbit at 0x99 TI_0   ;
sbit at 0x9A RB8_0  ;
sbit at 0x9B TB8_0  ;
sbit at 0x9C REN_0  ;
sbit at 0x9D SM2_0  ;
sbit at 0x9E SM1_0  ;
sbit at 0x9F SM0_0  ;
sbit at 0x9F FE_0   ;
sbit at 0x9F SM0_FE_0  ;
#endif

#ifdef SCON1
#undef SCON1
// DS80C320 - 80C390 specific
sfr at 0xC0 SCON1  ;
// Bit registers
sbit at 0xC0 RI_1         ;
sbit at 0xC1 TI_1         ;
sbit at 0xC2 RB8_1        ;
sbit at 0xC3 TB8_1        ;
sbit at 0xC4 REN_1        ;
sbit at 0xC5 SM2_1        ;
sbit at 0xC6 SM1_1        ;
sbit at 0xC7 SM0_1        ;
sbit at 0xC7 FE_1         ;
sbit at 0xC7 SM0_FE_1     ;
#endif

#ifdef SP
#undef SP
sfr at 0x81 SP   ;
#endif

#ifdef SPCR
#undef SPCR
sfr at 0xD5 SPCR   ;   // AT89S53 specific
// Not directly accesible bits
#define SPR0 0x01
#define SPR1 0x02
#define CPHA 0x04
#define CPOL 0x08
#define MSTR 0x10
#define DORD 0x20
#define SPE  0x40
#define SPIE 0x80
#endif

#ifdef SPDR
#undef SPDR
sfr at 0x86 SPDR   ;   // AT89S53 specific
// Not directly accesible bits
#define SPD_0 0x01
#define SPD_1 0x02
#define SPD_2 0x04
#define SPD_3 0x08
#define SPD_4 0x10
#define SPD_5 0x20
#define SPD_6 0x40
#define SPD_7 0x80
#endif

#ifdef SPSR
#undef SPSR
sfr at 0xAA SPSR   ;   // AT89S53 specific
// Not directly accesible bits
#define SPIF 0x40
#define WCOL 0x80
#endif

#ifdef SRELH
#undef SRELH
sfr at 0xBA SRELH       ; // Baudrate generator reload high
#endif

#ifdef SRELL
#undef SRELL
sfr at 0xAA SRELL       ; // Baudrate generator reload low
#endif

#ifdef STATUS__PIP__HIP__LIP__x__x__x__x__x
#undef STATUS__PIP__HIP__LIP__x__x__x__x__x
// DS80C320 specific
sfr at 0xC5 STATUS ;
// Not directly accessible Bits. DS80C320 specific
#define LIP  0x20
#define HIP  0x40
#define PIP  0x80
#endif

#ifdef STATUS__PIP__HIP__LIP__x__SPTA1__SPRA1__SPTA0__SPRA0
#undef STATUS__PIP__HIP__LIP__x__SPTA1__SPRA1__SPTA0__SPRA0
sfr at 0xC5 STATUS ; // DS80C390 specific
// Not directly accessible Bits.
#define SPRA0  0x01
#define SPTA0  0x02
#define SPRA1  0x04
#define SPTA1  0x08
#define LIP    0x20
#define HIP    0x40
#define PIP    0x80
#endif

#ifdef STATUS__PIP__HIP__LIP__XTUP__SPTA2__SPTA1__SPTA0__SPRA0
#undef STATUS__PIP__HIP__LIP__XTUP__SPTA2__SPTA1__SPTA0__SPRA0
sfr at 0xC5 STATUS ; // DS87C520 & DS83520specific
// Not directly accessible Bits.
#define SPRA0  0x01
#define SPTA0  0x02
#define SPTA1  0x04
#define SPTA2  0x08
#define XTUP   0x10
#define LIP    0x20
#define HIP    0x40
#define PIP    0x80
#endif

#ifdef STATUS__ST7__ST6__ST5__ST4__IA0__F0__IBF__OBF
#undef STATUS__ST7__ST6__ST5__ST4__IA0__F0__IBF__OBF
sfr at 0xDA STATUS ; // DS5001specific
// Not directly accessible Bits.
#define OBF    0x01
#define IBF    0x02
#define F0     0x04
#define IA0    0x08
#define ST4    0x10
#define ST5    0x20
#define ST6    0x40
#define ST7    0x80
#endif

#ifdef STE__TG47__TG46__SP45__SP44__SP43__SP42__SP41__SP40
#undef STE__TG47__TG46__SP45__SP44__SP43__SP42__SP41__SP40
sfr at 0xEE STE		; // Set enable, P80C552 specific
// Not directly accessible Bits.
#define SP40	0x01
#define SP41	0x02
#define SP42	0x04
#define SP43	0x08
#define SP44	0x10
#define SP45	0x20
#define TG46	0x40
#define TG47	0x80
#endif

#ifdef SYSCON
#undef SYSCON
sfr at 0xB1 SYSCON      ; // XRAM Controller Access Control
// SYSCON bits
#define SYSCON_XMAP0	0x01
#define SYSCON_XMAP1	0x02
#define SYSCON_RMAP		0x10
#define SYSCON_EALE		0x20
#endif

#ifdef T2CON__TF2__EXF2__RCLK__TCLK__EXEN2__TR2__C_T2__CP_RL2
#undef T2CON__TF2__EXF2__RCLK__TCLK__EXEN2__TR2__C_T2__CP_RL2
sfr at 0xC8 T2CON ;
// Definitions for the 8052 compatible microcontrollers.
// Bit registers
sbit at 0xC8 CP_RL2  ;
sbit at 0xC9 C_T2    ;
sbit at 0xCA TR2     ;
sbit at 0xCB EXEN2   ;
sbit at 0xCC TCLK    ;
sbit at 0xCD RCLK    ;
sbit at 0xCE EXF2    ;
sbit at 0xCF TF2     ;
// alternate names
sbit at 0xC8 T2CON_0 ;
sbit at 0xC9 T2CON_1 ;
sbit at 0xCA T2CON_2 ;
sbit at 0xCB T2CON_3 ;
sbit at 0xCC T2CON_4 ;
sbit at 0xCD T2CON_5 ;
sbit at 0xCE T2CON_6 ;
sbit at 0xCF T2CON_7 ;
#endif

#ifdef T2CON__T2PS__I3FR__I2FR__T2R1__T2R0__T2CM__T2I1__T2I0
#undef T2CON__T2PS__I3FR__I2FR__T2R1__T2R0__T2CM__T2I1__T2I0
sfr at 0xC8 T2CON ;
// Definitions for the Infineon / Siemens SAB80515, SAB80515A, SAB80517
// Bit registers
sbit at 0xC8 T2I0 ;
sbit at 0xC9 T2I1 ;
sbit at 0xCA T2CM ;
sbit at 0xCB T2R0 ;
sbit at 0xCC T2R1 ;
sbit at 0xCD I2FR ;
sbit at 0xCE I3FR ;
sbit at 0xCF T2PS ;
// alternate names
sbit at 0xC8 T2CON_0 ;
sbit at 0xC9 T2CON_1 ;
sbit at 0xCA T2CON_2 ;
sbit at 0xCB T2CON_3 ;
sbit at 0xCC T2CON_4 ;
sbit at 0xCD T2CON_5 ;
sbit at 0xCE T2CON_6 ;
sbit at 0xCF T2CON_7 ;
#endif

#ifdef T2MOD__x__x__x__D13T1__D13T2__x__T2OE__DCEN
#undef T2MOD__x__x__x__D13T1__D13T2__x__T2OE__DCEN
// Definitions for the timer/counter 2 of the Atmel & Dallas microcontrollers
sfr at 0xC9 T2MOD  ;
// Not not directly accessible T2MOD bits
#define DCEN            0x01
#define T2OE            0x02
#define D13T2           0x08
#define D13T1           0x10
#endif

#ifdef T2MOD__x__x__x__x__x__x__T2OE__DCEN
#undef T2MOD__x__x__x__x__x__x__T2OE__DCEN
// Definitions for the timer/counter 2 of the Atmel 89x52 microcontroller
sfr at 0xC9 T2MOD  ;
// Not not directly accessible T2MOD bits
#define DCEN            0x01
#define T2OE            0x02
// Alternate names
#define DCEN_           0x01
#define T2OE_           0x02
#endif

#ifdef T3_AT_0XFF
#undef T3_AT_0XFF
sfr at 0xFF T3		; // Timer 3, P80C552 specific
#endif

#ifdef TA
#undef TA
// DS500x, DS80C320 & DS80C390 specific
sfr at 0xC7 TA ;
#endif

#ifdef TCON
#undef TCON
sfr at 0x88 TCON ;
//  Bit registers
sbit at 0x88 IT0  ;
sbit at 0x89 IE0  ;
sbit at 0x8A IT1  ;
sbit at 0x8B IE1  ;
sbit at 0x8C TR0  ;
sbit at 0x8D TF0  ;
sbit at 0x8E TR1  ;
sbit at 0x8F TF1  ;
#endif

#ifdef TH0
#undef TH0
sfr at 0x8C TH0  ;
#endif

#ifdef TH1
#undef TH1
sfr at 0x8D TH1  ;
#endif

#ifdef TH2
#undef TH2
sfr at 0xCD TH2     ;
#endif

#ifdef TL0
#undef TL0
sfr at 0x8A TL0  ;
#endif

#ifdef TL1
#undef TL1
sfr at 0x8B TL1  ;
#endif

#ifdef TL2
#undef TL2
sfr at 0xCC TL2     ;
#endif

#ifdef TMOD
#undef TMOD
sfr at 0x89 TMOD ;
// Not directly accessible TMOD bits
#define T0_M0           0x01
#define T0_M1           0x02
#define T0_CT           0x04
#define T0_GATE         0x08
#define T1_M0           0x10
#define T1_M1           0x20
#define T1_CT           0x40
#define T1_GATE         0x80

#define T0_MASK         0x0F
#define T1_MASK         0xF0
#endif

#ifdef TM2CON__T2IS1__T2IS0__T2ER__T2B0__T2P1__T2P0__T2MS1__T2MS0
#undef TM2CON__T2IS1__T2IS0__T2ER__T2B0__T2P1__T2P0__T2MS1__T2MS0
sfr at 0xEA TM2CON	; // Timer 2 control, P80C552 specific
// Not directly accessible Bits.
#define T2MS0	0x01
#define T2MS1	0x02
#define T2P0	0x04
#define T2P1	0x08
#define T2B0	0x10
#define T2ER	0x20
#define T2IS0	0x40
#define T2IS1	0x80
#endif

#ifdef TM2IR__T20V__CMI2__CMI1__CMI0__CTI3__CTI2__CTI1__CTI0
#undef TM2IR__T20V__CMI2__CMI1__CMI0__CTI3__CTI2__CTI1__CTI0
sfr at 0xC8 TM2IR	; // Timer 2 int flag reg, P80C552 specific
// Bit register
sbit at 0xC8 CTI0	;
sbit at 0xC9 CTI1	;
sbit at 0xCA CTI2	;
sbit at 0xCB CTI3	;
sbit at 0xCC CMI0	;
sbit at 0xCD CMI1	;
sbit at 0xCE CMI2	;
sbit at 0xCF T20V	;
#endif

#ifdef TMH2_AT_0XED
#undef TMH2_AT_0XED
sfr at 0xED TMH2	; // Timer high 2, P80C552 specific
#endif

#ifdef TML2_AT_0XEC
#undef TML2_AT_0XEC
sfr at 0xEC TML2	; // Timer low 2, P80C552 specific
#endif

#ifdef WCON
#undef WCON
sfr at 0x96 WCON   ;   // AT89S53 specific
// Not directly accesible bits
#define WDTEN  0x01
#define WDTRST 0x02
#define DPS    0x04
#define PS0    0x20
#define PS1    0x40
#define PS2    0x80
#endif

#ifdef WDCON
#undef WDCON
// DS80C320 - 390 specific
sfr at 0xD8 WDCON ;
//  Bit registers
sbit at 0xD8 RWT    ;
sbit at 0xD9 EWT    ;
sbit at 0xDA WTRF   ;
sbit at 0xDB WDIF   ;
sbit at 0xDC PFI    ;
sbit at 0xDD EPFI   ;
sbit at 0xDE POR    ;
sbit at 0xDF SMOD_1 ;
#endif

#ifdef WDTREL
#undef WDTREL
sfr at 0x86 WDTREL    ; // Watchdof Timer reload register
#endif

#ifdef XPAGE
#undef XPAGE
sfr at 0x91 XPAGE     ; // Page Address Register for Extended On-Chip Ram - Infineon / Siemens SAB80515A specific
#endif


/////////////////////////
/// Interrupt vectors ///
/////////////////////////

// Interrupt numbers: address = (number * 8) + 3
#define IE0_VECTOR      0       // 0x03 external interrupt 0
#define TF0_VECTOR      1       // 0x0b timer 0
#define IE1_VECTOR      2       // 0x13 external interrupt 1
#define TF1_VECTOR      3       // 0x1b timer 1
#define SI0_VECTOR      4       // 0x23 serial port 0

#ifdef MICROCONTROLLER_AT89S53
#define TF2_VECTOR      5       /* 0x2B timer 2 */
#define EX2_VECTOR      5       /* 0x2B external interrupt 2 */
#endif

#ifdef MICROCONTROLLER_AT89X52
#define TF2_VECTOR      5       /* 0x2B timer 2 */
#define EX2_VECTOR      5       /* 0x2B external interrupt 2 */
#endif

#ifdef MICROCONTROLLER_AT89X55
#define TF2_VECTOR      5       /* 0x2B timer 2 */
#define EX2_VECTOR      5       /* 0x2B external interrupt 2 */
#endif

#ifdef MICROCONTROLLER_DS5000
#define PFW_VECTOR      5       /* 0x2B */
#endif

#ifdef MICROCONTROLLER_DS5001
#define PFW_VECTOR      5       /* 0x2B */
#endif

#ifdef MICROCONTROLLER_DS80C32X
#define TF2_VECTOR      5  /* 0x2B */
#define PFI_VECTOR      6  /* 0x33 */
#define SIO1_VECTOR     7  /* 0x3B */
#define IE2_VECTOR      8  /* 0x43 */
#define IE3_VECTOR      9  /* 0x4B */
#define IE4_VECTOR      10 /* 0x53 */
#define IE5_VECTOR      11 /* 0x5B */
#define WDI_VECTOR      12 /* 0x63 */
#endif

#ifdef MICROCONTROLLER_DS8XC520
#define TF2_VECTOR      5  /* 0x2B */
#define PFI_VECTOR      6  /* 0x33 */
#define SIO1_VECTOR     7  /* 0x3B */
#define IE2_VECTOR      8  /* 0x43 */
#define IE3_VECTOR      9  /* 0x4B */
#define IE4_VECTOR      10 /* 0x53 */
#define IE5_VECTOR      11 /* 0x5B */
#define WDI_VECTOR      12 /* 0x63 */
#endif

#ifdef MICROCONTROLLER_P80C552
#define SIO1_VECTOR     5  	// 0x2B SIO1 (I2C)
#define CT0_VECTOR      6  	// 0x33 T2 capture 0
#define CT1_VECTOR      7   // 0x3B T2 capture 1
#define CT2_VECTOR      8  	// 0x43 T2 capture 2
#define CT3_VECTOR      9  	// 0x4B T2 capture 3
#define ADC_VECTOR     10 	// 0x53 ADC completion
#define CM0_VECTOR     11 	// 0x5B T2 compare 0
#define CM1_VECTOR     12 	// 0x63 T2 compare 1
#define CM2_VECTOR     13 	// 0x6B T2 compare 2
#define TF2_VECTOR     14	// 0x73 T2 overflow
#endif

#ifdef MICROCONTROLLER_SAB80515
#define TF2_VECTOR      5       // 0x2B timer 2
#define EX2_VECTOR      5       // 0x2B external interrupt 2
#define IADC_VECTOR     8       // 0x43 A/D converter interrupt
#define IEX2_VECTOR     9       // 0x4B external interrupt 2
#define IEX3_VECTOR    10       // 0x53 external interrupt 3
#define IEX4_VECTOR    11       // 0x5B external interrupt 4
#define IEX5_VECTOR    12       // 0x63 external interrupt 5
#define IEX6_VECTOR    13       // 0x6B external interrupt 6
#endif

#ifdef MICROCONTROLLER_SAB80515A
#define TF2_VECTOR      5       // 0x2B timer 2
#define EX2_VECTOR      5       // 0x2B external interrupt 2
#define IADC_VECTOR     8       // 0x43 A/D converter interrupt
#define IEX2_VECTOR     9       // 0x4B external interrupt 2
#define IEX3_VECTOR    10       // 0x53 external interrupt 3
#define IEX4_VECTOR    11       // 0x5B external interrupt 4
#define IEX5_VECTOR    12       // 0x63 external interrupt 5
#define IEX6_VECTOR    13       // 0x6B external interrupt 6
#endif

#ifdef MICROCONTROLLER_SAB80517
#define TF2_VECTOR      5       // 0x2B timer 2
#define EX2_VECTOR      5       // 0x2B external interrupt 2
#define IADC_VECTOR     8       // 0x43 A/D converter interrupt
#define IEX2_VECTOR     9       // 0x4B external interrupt 2
#define IEX3_VECTOR    10       // 0x53 external interrupt 3
#define IEX4_VECTOR    11       // 0x5B external interrupt 4
#define IEX5_VECTOR    12       // 0x63 external interrupt 5
#define IEX6_VECTOR    13       // 0x6B external interrupt 6
                                // 0x73 not used
                                // 0x7B not used
#define SI1_VECTOR     16       // 0x83 serial port 1
                                // 0x8B not used
                                // 0x93 not used
#define COMPARE_VECTOR 19       // 0x9B compare
#endif

#endif	// End of the header -> #ifndef MCS51REG_H
