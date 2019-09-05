/*
 * Simulator of microcontrollers (regs51.h)
 *
 * Copyright (C) 1999,99 Drotos Daniel, Talker Bt.
 * 
 * To contact author send email to drdani@mazsola.iit.uni-miskolc.hu
 *
 */

/* This file is part of microcontroller simulator: ucsim.

UCSIM is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

UCSIM is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with UCSIM; see the file COPYING.  If not, write to the Free
Software Foundation, 59 Temple Place - Suite 330, Boston, MA
02111-1307, USA. */
/*@1@*/

#ifndef REGS51_HEADER
#define REGS51_HEADER


/* Address of SFR registers */

#define ACC	0xe0 /* Accumulator */
#define B	0xf0 /* B register (scondary accumulator) */
#define PSW	0xd0 /* Program Status Word */
#define SP	0x81 /* Stack Pointer */
#define DPL	0x82 /* Data Pointer Low byte */
#define DPH	0x83 /* Data Pointer High byte */
#define P0	0x80 /* Port #0 */
#define P1	0x90 /* Port #1 */
#define P2	0xa0 /* Port #2 */
#define P3	0xb0 /* Port #3 */
#define IP	0xb8 /* Intrrupt Priority */
#define IE	0xa8 /* Interrupt Enable */
#define TMOD	0x89 /* Timer MODe */
#define TCON	0x88 /* Timer CONtrol */
#define T2CON	0xc8 /* Timer #2 CONtrol */
#define TH0	0x8c /* Timer #0 High byte */
#define TL0	0x8a /* Timer #0 Low byte */
#define TH1	0x8d /* Timer #1 High byte */
#define TL1	0x8b /* Timer #1 Low byte */
#define SCON	0x98 /* Serial line CONtrol */
#define TH2	0xcd /* Timer #2 High byte */
#define TL2	0xcc /* Timer #2 Low byte */
#define RCAP2H	0xcb /* Capture Register of Timer #2 High byte */
#define RCAP2L	0xca /* Capture Register of Timer #2 Low byte */
#define SBUF	0x99 /* Serial line BUFfer */
#define PCON	0x87 /* Power CONtrol */

#define AUXR	0x8e /* Auxiliary Register */
#define AUXR1	0xa2 /* Secondary Aux Register */

#define DPXL	0x84 /* */
#define DPL1	0x84 /* 2nd Data Pointer Low byte */
#define DPH1	0x85 /* 2nd Data Pointer High byte */
#define DPS	0x86 /* DPS 1H=DPTR is DPL1/DPH1,... */
#define WDTRST	0xa6 /* */
#define IE0	0xa8 /* */
#define SADDR	0xa9 /* */
#define IPH0	0xb7 /* */
#define IPH	0xb7
#define IPL0	0xb8 /* */
#define SADEN	0xb9 /* */
#define SPH	0xbd /* */
#define T2MOD	0xc9 /* */
#define PSW1	0xd1 /* */
#define CCON	0xd8 /* */
#define CMOD	0xd9 /* */
#define CCAPM0	0xda /* */
#define CCAPM1	0xdb /* */
#define CCAPM2	0xdc /* */
#define CCAPM3	0xdd /* */
#define CCAPM4	0xde /* */
#define CL	0xe9 /* */
#define CCAP0L	0xea /* */
#define CCAP1L	0xeb /* */
#define CCAP2L	0xec /* */
#define CCAP3L	0xed /* */
#define CCAP4L	0xee /* */
#define CH	0xf9 /* */
#define CCAP0H	0xfa /* */
#define CCAP1H	0xfb /* */
#define CCAP2H	0xfc /* */
#define CCAP3H	0xfd /* */
#define CCAP4H	0xfe /* */

/* Bit masks of flag bits in PSW (0xd0)*/

#define bmCY	0x80 /* carry */
#define bmAC	0x40 /* acarry */
#define bmF0	0x20 /* flag 0 */
#define bmRS1	0x10 /* register select 1 */
#define bmRS0	0x08 /* register select 0 */
#define bmOV	0x04 /* arithmetic overflow */
#define bmP	0x01 /* parity, set by hardware */

/* Bit masks in PCON (0x87) */

#define bmSMOD1	0x80
#define bmSMOD	0x80
#define bmSMOD0	0x40
#define bmPOF	0x10
#define bmGF1	0x08
#define bmGF0	0x04
#define bmPD	0x02
#define bmIDL	0x01

/* Bit masks in IE (0xa8) */

#define bmEA	0x80
#define bmEC	0x40
#define bmET2	0x20
#define bmES	0x10
#define bmET1	0x08
#define bmEX1	0x04
#define bmET0	0x02
#define bmEX0	0x01

/* Bit masks in IP (0xb8) */

#define bmPPC	0x40
#define bmPT2	0x20
#define bmPS	0x10
#define bmPT1	0x08
#define bmPX1	0x04
#define bmPT0	0x02
#define bmPX0	0x01

/* Bit masks in IPL0 (0xb8) */

#define bmIPL0_6 0x40
#define bmIPL0_5 0x20
#define bmIPL0_4 0x10
#define bmIPL0_3 0x08
#define bmIPL0_2 0x04
#define bmIPL0_1 0x02
#define bmIPL0_0 0x01

/* Bit masks in IPH0 (0xb7) */

#define bmIPH0_6 0x40
#define bmIPH0_5 0x20
#define bmIPH0_4 0x10
#define bmIPH0_3 0x08
#define bmIPH0_2 0x04
#define bmIPH0_1 0x02
#define bmIPH0_0 0x01

/* Bit masks in P1 (0x90) */

#define bmCEX4	0x80
#define bmCEX3	0x40
#define bmCEX2	0x20
#define bmCEX1	0x10
#define bmCEX0	0x08
#define bmECI	0x04
#define bmT2EX	0x02
#define bmT2	0x01

/* Bit masks in P3 (0xb0) */

#define bmRXD	0x01
#define bmTXD	0x02
#define bm_INT0	0x04
#define bm_INT1	0x08
#define bmT0	0x10
#define bmT1	0x20
#define bm_WR	0x40
#define bm_RD	0x80

/* Bit masks in TMOD (0x89) */

#define bmGATE1	0x80
#define bmC_T1	0x40
#define bmM11	0x20
#define bmM01	0x10
#define bmGATE0	0x08
#define bmC_T0	0x04
#define bmM10	0x02
#define bmM00	0x01

/* Bit masks in TCON (0x88) */

#define bmTF1	0x80
#define bmTR1	0x40
#define bmTF0	0x20
#define bmTR0	0x10
#define bmIE1	0x08
#define bmIT1	0x04
#define bmIE0	0x02
#define bmIT0	0x01

/* Bit masks in AUXR (0x8e) */

#define bmEXTRAM  0x02
#define bmDISABLE 0x01

/* Bit masks in AUXR1 (0xa2) */

#define bmENBOOT  0x20
#define bmGF2     0x08
#define bmDPS     0x01

/* Bit masks in T2CON (0xc8) */

#define bmTF2	 0x80
#define bmEXF2	 0x40
#define bmRCLK	 0x20
#define bmTCLK	 0x10
#define bmEXEN2	 0x08
#define bmTR2	 0x04
#define bmC_T2	 0x02
#define bmCP_RL2 0x01

/* Bit masks in SCON (0x98) */

#define bmFE_SM0 0x80
#define bmFE	0x80
#define bmSM0	0x80
#define bmSM1	0x40
#define bmSM2	0x20
#define bmREN	0x10
#define bmTB8	0x08
#define bmRB8	0x04
#define bmTI	0x02
#define bmRI	0x01

/* Bit masks in T2MOD (0xc9) */

#define bmT2OE	0x02
#define bmDCEN	0x01

/* Bit masks in CMOD (0xd9) */

#define bmCIDL	0x80
#define bmWDTE	0x40
#define bmCPS1	0x04
#define bmCPS0	0x02
#define bmECF	0x01

/* Bit masks in CCON (0xd8) */

#define bmCF	0x80
#define bmCR	0x40
#define bmCCF4	0x10
#define bmCCF3	0x08
#define bmCCF2	0x04
#define bmCCF1	0x02
#define bmCCF0	0x01

/* Bit masks in CCAPM0 (0xda) */

#define bmECOM0	0x40
#define bmCAPP0	0x20
#define bmCAPN0	0x10
#define bmMAT0	0x08
#define bmTOG0	0x04
#define bmPWM0	0x02
#define bmECCF0	0x01

/* Bit masks in CCAPM1 (0xdb) */

#define bmECOM1	0x40
#define bmCAPP1	0x20
#define bmCAPN1	0x10
#define bmMAT1	0x08
#define bmTOG1	0x04
#define bmPWM1	0x02
#define bmECCF1	0x01

/* Bit masks in CCAPM2 (0xdc) */

#define bmECOM2	0x40
#define bmCAPP2	0x20
#define bmCAPN2	0x10
#define bmMAT2	0x08
#define bmTOG2	0x04
#define bmPWM2	0x02
#define bmECCF2	0x01

/* Bit masks in CCAPM3 (0xdd) */

#define bmECOM3	0x40
#define bmCAPP3	0x20
#define bmCAPN3	0x10
#define bmMAT3	0x08
#define bmTOG3	0x04
#define bmPWM3	0x02
#define bmECCF3	0x01

/* Bit masks in CCAPM4 (0xde) */

#define bmECOM4	0x40
#define bmCAPP4	0x20
#define bmCAPN4	0x10
#define bmMAT4	0x08
#define bmTOG4	0x04
#define bmPWM4	0x02
#define bmECCF4	0x01

#define bmECOM	0x40
#define bmCAPP	0x20
#define bmCAPN	0x10
#define bmMAT	0x08
#define bmTOG	0x04
#define bmPWM	0x02
#define bmEDDF	0x01


#endif

/* End of s51.src/regs51.h */
