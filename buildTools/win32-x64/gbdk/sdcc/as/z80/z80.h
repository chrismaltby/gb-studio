/* z80.h */

/*
 * (C) Copyright 1989-1995
 * All Rights Reserved
 *
 * Alan R. Baldwin
 * 721 Berkeley St.
 * Kent, Ohio  44240
 */

/*
 * Extensions: P. Felber
 */

/*)BUILD
	$(PROGRAM) =	ASZ80
	$(INCLUDE) = {
		ASM.H
		Z80.H
	}
	$(FILES) = {
		Z80EXT.C
		Z80MCH.C
		Z80ADR.C
		Z80PST.C
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
 * Indirect Addressing delimeters
 */
#define	LFIND	'('
#define RTIND	')'

/*
 * Registers
 */
#define B	0
#define C	1
#define D	2
#define E	3
#define H	4
#define L	5
#define A	7

#define I	0107
#define R	0117

#define BC	0
#define DE	1
#define HL	2
#define SP	3
#define AF	4
#ifndef GAMEBOY
#define IX	5
#define IY	6
#else /* GAMEBOY */
#define HLD	5
#define HLI	6
#endif /* GAMEBOY */

/*
 * Conditional definitions
 */
#define	NZ	0
#define	Z	1
#define	NC	2
#define	CS	3
#ifndef GAMEBOY
#define	PO	4
#define	PE	5
#define	P	6
#define	M	7
#endif /* GAMEBOY */

/*
 * Symbol types
 */
#define	S_IMMED	30
#define	S_R8	31
#define	S_R8X	32
#define	S_R16	33
#define	S_R16X	34
#define	S_CND	35
#define	S_FLAG	36

/*
 * Indexing modes
 */
#define	S_INDB	40
#define	S_IDC	41
#define	S_INDR	50
#define	S_IDBC	50
#define	S_IDDE	51
#define	S_IDHL	52
#define	S_IDSP	53
#ifndef GAMEBOY
#define	S_IDIX	55
#define	S_IDIY	56
#else /* GAMEBOY */
#define	S_IDHLD	55
#define	S_IDHLI	56
#endif /* GAMEBOY */
#define	S_INDM	57

/*
 * Instruction types
 */
#define	S_LD	60
#define	S_CALL	61
#define	S_JP	62
#define	S_JR	63
#define	S_RET	64
#define	S_BIT	65
#define	S_INC	66
#define	S_DEC	67
#define	S_ADD	68
#define	S_ADC	69
#define	S_AND	70
#ifndef GAMEBOY
#define	S_EX	71
#endif /* GAMEBOY */
#define	S_PUSH	72
#ifndef GAMEBOY
#define	S_IN	73
#define	S_OUT	74
#endif /* GAMEBOY */
#define	S_RL	75
#define	S_RST	76
#define	S_IM	77
#define	S_INH1	78
#ifndef GAMEBOY
#define	S_INH2	79
#define	S_DJNZ	80
#endif /* GAMEBOY */
#define	S_SUB	81
#define	S_SBC	82
#ifdef GAMEBOY
#define	S_STOP	83
#define	S_LDH	84
#define	S_LDA	85
#define	S_LDHL	86
#endif /* GAMEBOY */

/*
 * HD64180 Instructions
 */
#define	X_HD64	90
#define	X_INH2	91
#define	X_IN	92
#define	X_OUT	93
#define	X_MLT	94
#define	X_TST	95
#define	X_TSTIO	96

struct adsym
{
	char	a_str[4];	/* addressing string */
	int	a_val;		/* addressing mode value */
};

extern	struct	adsym	R8[];
extern	struct	adsym	R8X[];
extern	struct	adsym	R16[];
extern	struct	adsym	R16X[];
extern	struct	adsym	CND[];

	/* machine dependent functions */

	/* z80adr.c */
extern	int		addr();
extern	int		admode();
extern	int		any();
extern	int		srch();

	/* z80mch.c */
extern	int		comma();
extern	int		genop();
extern	int		gixiy();
extern	VOID		minit();
extern	VOID		machine(struct mne *mp) ;
