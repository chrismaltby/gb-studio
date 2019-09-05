/*-------------------------------------------------------------------------
  Register Declarations for ATMEL 89S8252 and 89LS8252 Processors

   Written By - Dipl.-Ing. (FH) Michael Schmitt
    mschmitt@mainz-online.de
    michael.schmitt@t-online.de

    Bug-Fix Jun 29 1999

    Additional definitions Nov 23 1999
      by Bernd Krueger-Knauber <bkk@infratec-plus.de>

    based on reg51.h by Sandeep Dutta sandeep.dutta@usa.net
    KEIL C compatible definitions are included

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

#ifndef AT89S8252_H
#define AT89S8252_H

/* BYTE addressable registers */
sfr at 0x80 P0          ;
sfr at 0x81 SP          ;
sfr at 0x82 DPL         ;
sfr at 0x82 DP0L        ; /* as called by Atmel */
sfr at 0x83 DPH         ;
sfr at 0x83 DP0H        ; /* as called by Atmel */
sfr at 0x84 DP1L        ; /* at89S8252 specific register */
sfr at 0x85 DP1H        ; /* at89S8252 specific register */
sfr at 0x86 SPDR        ; /* at89S8252 specific register */
sfr at 0x87 PCON        ;
sfr at 0x88 TCON        ;
sfr at 0x89 TMOD        ;
sfr at 0x8A TL0         ;
sfr at 0x8B TL1         ;
sfr at 0x8C TH0         ;
sfr at 0x8D TH1         ;
sfr at 0x90 P1          ;
sfr at 0x96 WMCON       ; /* at89S8252 specific register */
sfr at 0x98 SCON        ;
sfr at 0x99 SBUF        ;
sfr at 0xA0 P2          ;
sfr at 0xA8 IE          ;
sfr at 0xAA SPSR        ; /* at89S8252 specific register */
sfr at 0xB0 P3          ;
sfr at 0xB8 IP          ;
sfr at 0xC8 T2CON       ;
sfr at 0xC9 T2MOD       ;
sfr at 0xCA RCAP2L      ;
sfr at 0xCB RCAP2H      ;
sfr at 0xCC TL2         ;
sfr at 0xCD TH2         ;
sfr at 0xD0 PSW         ;
sfr at 0xD5 SPCR        ; /* at89S8252 specific register */
sfr at 0xE0 ACC         ;
sfr at 0xE0 A           ;
sfr at 0xF0 B           ;


/* BIT addressable registers */
/* P0 */
sbit at 0x80 P0_0       ;
sbit at 0x81 P0_1       ;
sbit at 0x82 P0_2       ;
sbit at 0x83 P0_3       ;
sbit at 0x84 P0_4       ;
sbit at 0x85 P0_5       ;
sbit at 0x86 P0_6       ;
sbit at 0x87 P0_7       ;

/* TCON */
sbit at 0x88 IT0        ;
sbit at 0x89 IE0        ;
sbit at 0x8A IT1        ;
sbit at 0x8B IE1        ;
sbit at 0x8C TR0        ;
sbit at 0x8D TF0        ;
sbit at 0x8E TR1        ;
sbit at 0x8F TF1        ;

/* P1 */
sbit at 0x90 P1_0       ;
sbit at 0x91 P1_1       ;
sbit at 0x92 P1_2       ;
sbit at 0x93 P1_3       ;
sbit at 0x94 P1_4       ;
sbit at 0x95 P1_5       ;
sbit at 0x96 P1_6       ;
sbit at 0x97 P1_7       ;

sbit at 0x90 T2         ;
sbit at 0x91 T2EX       ;

/* P1 SPI portpins */
sbit at 0x94 SS;      	/* SPI: SS - Slave port select input */
sbit at 0x95 MOSI;     	/* SPI: MOSI - Master data output, slave data input */
sbit at 0x96 MISO;     	/* SPI: MISO - Master data input, slave data output */
sbit at 0x97 SCK;      	/* SPI: SCK - Master clock output, slave clock input */


/* SCON */
sbit at 0x98 RI         ;
sbit at 0x99 TI         ;
sbit at 0x9A RB8        ;
sbit at 0x9B TB8        ;
sbit at 0x9C REN        ;
sbit at 0x9D SM2        ;
sbit at 0x9E SM1        ;
sbit at 0x9F SM0        ;

/* P2 */
sbit at 0xA0 P2_0       ;
sbit at 0xA1 P2_1       ;
sbit at 0xA2 P2_2       ;
sbit at 0xA3 P2_3       ;
sbit at 0xA4 P2_4       ;
sbit at 0xA5 P2_5       ;
sbit at 0xA6 P2_6       ;
sbit at 0xA7 P2_7       ;

/* IE */
sbit at 0xA8 EX0        ;
sbit at 0xA9 ET0        ;
sbit at 0xAA EX1        ;
sbit at 0xAB ET1        ;
sbit at 0xAC ES         ;
sbit at 0xAD ET2        ;
sbit at 0xAF EA         ;

/* P3 */
sbit at 0xB0 P3_0       ;
sbit at 0xB1 P3_1       ;
sbit at 0xB2 P3_2       ;
sbit at 0xB3 P3_3       ;
sbit at 0xB4 P3_4       ;
sbit at 0xB5 P3_5       ;
sbit at 0xB6 P3_6       ;
sbit at 0xB7 P3_7       ;

sbit at 0xB0 RXD        ;
sbit at 0xB1 TXD        ;
sbit at 0xB2 INT0       ;
sbit at 0xB3 INT1       ;
sbit at 0xB4 T0         ;
sbit at 0xB5 T1         ;
sbit at 0xB6 WR         ;
sbit at 0xB7 RD         ;

/* IP */
sbit at 0xB8 PX0        ;
sbit at 0xB9 PT0        ;
sbit at 0xBA PX1        ;
sbit at 0xBB PT1        ;
sbit at 0xBC PS         ;
sbit at 0xBD PT2        ;

/* T2CON */
sbit at 0xC8 T2CON_0    ;
sbit at 0xC9 T2CON_1    ;
sbit at 0xCA T2CON_2    ;
sbit at 0xCB T2CON_3    ;
sbit at 0xCC T2CON_4    ;
sbit at 0xCD T2CON_5    ;
sbit at 0xCE T2CON_6    ;
sbit at 0xCF T2CON_7    ;

sbit at 0xC8 CP_RL2     ;
sbit at 0xC9 C_T2       ;
sbit at 0xCA TR2        ;
sbit at 0xCB EXEN2      ;
sbit at 0xCC TCLK       ;
sbit at 0xCD RCLK       ;
sbit at 0xCE EXF2       ;
sbit at 0xCF TF2        ;

/* PSW */
sbit at 0xD0 P          ;
sbit at 0xD1 FL         ;
sbit at 0xD2 OV         ;
sbit at 0xD3 RS0        ;
sbit at 0xD4 RS1        ;
sbit at 0xD5 F0         ;
sbit at 0xD6 AC         ;
sbit at 0xD7 CY         ;

/* B */
sbit at 0xF0 BREG_F0    ;
sbit at 0xF1 BREG_F1    ;
sbit at 0xF2 BREG_F2    ;
sbit at 0xF3 BREG_F3    ;
sbit at 0xF4 BREG_F4    ;
sbit at 0xF5 BREG_F5    ;
sbit at 0xF6 BREG_F6    ;
sbit at 0xF7 BREG_F7    ;


/* BIT definitions for bits that are not directly accessible */
/* PCON bits */
#define IDL             0x01
#define PD              0x02
#define GF0             0x04
#define GF1             0x08
#define SMOD            0x80

#define IDL_            0x01
#define PD_             0x02
#define GF0_            0x04
#define GF1_            0x08
#define SMOD_           0x80

/* TMOD bits */
#define M0_0            0x01
#define M1_0            0x02
#define C_T0            0x04
#define GATE0           0x08
#define M0_1            0x10
#define M1_1            0x20
#define C_T1            0x40
#define GATE1           0x80

#define M0_0_           0x01
#define M1_0_           0x02
#define C_T0_           0x04
#define GATE0_          0x08
#define M0_1_           0x10
#define M1_1_           0x20
#define C_T1_           0x40
#define GATE1_          0x80

#define T0_M0           0x01
#define T0_M1           0x02
#define T0_CT           0x04
#define T0_GATE         0x08
#define T1_M0           0x10
#define T1_M1           0x20
#define T1_CT           0x40
#define T1_GATE         0x80

#define T0_M0_          0x01
#define T0_M1_          0x02
#define T0_CT_          0x04
#define T0_GATE_        0x08
#define T1_M0_          0x10
#define T1_M1_          0x20
#define T1_CT_          0x40
#define T1_GATE_        0x80

#define T0_MASK         0x0F
#define T1_MASK         0xF0

#define T0_MASK_        0x0F
#define T1_MASK_        0xF0

/* T2MOD bits */
#define DCEN            0x01
#define T2OE            0x02

#define DCEN_           0x01
#define T2OE_           0x02

/* WMCON bits */
#define WMCON_WDTEN     0x01
#define WMCON_WDTRST    0x02
#define WMCON_DPS       0x04
#define WMCON_EEMEN     0x08
#define WMCON_EEMWE     0x10
#define WMCON_PS0       0x20
#define WMCON_PS1       0x40
#define WMCON_PS2       0x80

/* SPCR-SPI bits */
#define SPCR_SPR0       0x01
#define SPCR_SPR1       0x02
#define SPCR_CPHA       0x04
#define SPCR_CPOL       0x08
#define SPCR_MSTR       0x10
#define SPCR_DORD       0x20
#define SPCR_SPE        0x40
#define SPCR_SPIE       0x80

/* SPSR-SPI bits */
#define SPSR_WCOL       0x40
#define SPSR_SPIF       0x80

/* SPDR-SPI bits */
#define SPDR_SPD0       0x10
#define SPDR_SPD1       0x20
#define SPDR_SPD2       0x40
#define SPDR_SPD3       0x80
#define SPDR_SPD4       0x10
#define SPDR_SPD5       0x20
#define SPDR_SPD6       0x40
#define SPDR_SPD7       0x80

/* Interrupt numbers: address = (number * 8) + 3 */
#define IE0_VECTOR      0       /* 0x03 external interrupt 0 */
#define EX0_VECTOR      0       /* 0x03 external interrupt 0 */
#define TF0_VECTOR      1       /* 0x0b timer 0 */
#define IE1_VECTOR      2       /* 0x13 external interrupt 1 */
#define EX1_VECTOR      2       /* 0x13 external interrupt 1 */
#define TF1_VECTOR      3       /* 0x1b timer 1 */
#define SI0_VECTOR      4       /* 0x23 serial port 0 */
#define TF2_VECTOR      5       /* 0x2B timer 2 */
#define EX2_VECTOR      5       /* 0x2B external interrupt 2 */


/* This is one of the addons comming from Bernd Krueger-Knauber */

/* ALE (0x8E) Bit Values */
sfr at 0x8E ALE;     	/* at89S8252 specific register */

/* Macro to enable and disable the toggling of the ALE-pin (EMV) */

/* Explanation : Orignal Intel 8051 Cores (Atmel has to use the  */
/* Intel Core) have a festure that ALE is only active during     */
/* MOVX or MOVC instruction. Otherwise the ALE-Pin is weakly     */
/* pulled high. This can be used to force some external devices  */
/* into stanby mode and reduced EMI noise                        */

#define ALE_OFF  ALE = ALE | 0x01
#define ALE_ON   ALE = ALE & 0xFE

#endif

