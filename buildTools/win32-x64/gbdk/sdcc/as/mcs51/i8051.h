/* i8051.h */

/*
 * (C) Copyright 1989,1990
 * All Rights Reserved
 *
 * Alan R. Baldwin
 * 721 Berkeley St.
 * Kent, Ohio  44240
 *
 * Ported from 8085 to 8051 by John Hartman 30-Apr-1995
 * Continued, 2-Jun-95
 */

/*)BUILD
	$(PROGRAM) =	AS8051
	$(INCLUDE) = {
		ASM.H
		I8051.H
	}
	$(FILES) = {
		I51EXT.C
		I51MCH.C
		I51PST.C
		ASMAIN.C
		ASLEX.C
		ASSYM.C
		ASSUBR.C
		ASEXPR.C
		ASDATA.C
		ASLIST.C
		ASOUT.C
	}
	$(STACK) = 2000
*/

/*
 * Symbol types.
 */
#define	S_INH	50		/* One byte inherent */
#define	S_JMP11	51		/* Jump and call 11 bit. */
#define	S_JMP16	52		/* Jump and call 16 bit */
#define	S_ACC	53		/* Accumulator */
#define	S_TYP1	54		/* Type 1 (inc and dec) */
#define	S_TYP2	55		/* Type 2 (arith ops) */
#define	S_TYP3	56		/* Type 3 (logic ops) */
#define	S_TYP4	57		/* Type 4 (XCH) */
#define	S_MOV	58		/* MOV */
#define	S_BITBR	59		/* bit branch */
#define	S_BR	60		/* branch */
#define	S_ACBIT	61		/* CLR, CPL */
#define	S_CJNE	62		/* CJNE */
#define	S_DJNZ	63		/* DJNZ */
#define S_JMP   64              /* JMP */
#define S_MOVC  65              /* MOVC */
#define S_MOVX  66              /* MOVX */
#define S_AB    67              /* AB (div and mul) */
#define S_CPL   68              /* CPL */
#define S_SETB  69              /* SETB */
#define S_DIRECT 70             /* DIRECT (pusha and pop) */
#define S_XCHD  71              /* XCHD */

/* Addressing modes */
#define S_A	 30		/* A */
/* #define S_B	 31 */		/* B */
#define S_C	 32		/* C (carry) */
#define S_RAB	 33		/* AB */
#define	S_DPTR	 34		/* DPTR */
#define	S_REG	 35		/* Register R0-R7 */
#define S_IMMED  36             /* immediate */
#define S_DIR    37		/* direct */
#define S_EXT	 38		/* extended */
#define S_PC	 39		/* PC (for addressing mode) */

#define S_AT_R   40             /* @R0 or @R1 */
#define S_AT_DP  41             /* @DPTR */
#define S_AT_APC 42             /* @A+PC */
#define S_AT_ADP 43             /* @A+DPTR */
#define S_NOT_BIT 44             /* /BIT (/DIR) */

/*
 * Registers.  Value  == address in RAM, except for PC
 */
#define R0      0
#define R1      1
#define R2      2
#define R3      3
#define R4      4
#define R5      5
#define R6      6
#define R7      7
#define A       0xE0
#define DPTR    0x82
#define PC      0xFF		/* dummy number for register ID only */
#define AB      0xFE		/* dummy number for register ID only */
#define C       0xFD		/* dummy number for register ID only */

struct adsym
{
	char	a_str[5];	/* addressing string (length for DPTR+null)*/
	int	a_val;		/* addressing mode value */
};

/* pre-defined symbol structure: name and value */
struct PreDef
{
   char id[NCPS];
   int  value;
};
extern struct PreDef preDef[];

	/* machine dependent functions */

	/* i51mch.c */
extern	int		comma();
extern	VOID		minit();
extern	int		reg();
