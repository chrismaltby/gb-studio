/* z80pst.c */

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

#include <stdio.h>
#include <setjmp.h>
#include "asm.h"
#include "z80.h"

struct	mne	mne[] = {

	/* machine */

	/* system */

    { NULL,	"CON",		S_ATYP,		0,	A_CON },
    { NULL,	"OVR",		S_ATYP,		0,	A_OVR },
    { NULL,	"REL",		S_ATYP,		0,	A_REL },
    { NULL,	"ABS",		S_ATYP,		0,	A_ABS|A_OVR },
    { NULL,	"NOPAG",	S_ATYP,		0,	A_NOPAG },
    { NULL,	"PAG",		S_ATYP,		0,	A_PAG },

    { NULL,	".byte",	S_BYTE,		0,	0 },
    { NULL,	".db",		S_BYTE,		0,	0 },
    { NULL,	".word",	S_WORD,		0,	0 },
    { NULL,	".dw",		S_WORD,		0,	0 },
    { NULL,	".df",		S_FLOAT,	0,	0 },
    { NULL,	".ascii",	S_ASCII,	0,	0 },
    { NULL,	".asciz",	S_ASCIZ,	0,	0 },
    { NULL,	".blkb",	S_BLK,		0,	1 },
    { NULL,	".ds",		S_BLK,		0,	1 },
    { NULL,	".blkw",	S_BLK,		0,	2 },
    { NULL,	".page",	S_PAGE,		0,	0 },
    { NULL,	".title",	S_TITLE,	0,	0 },
    { NULL,	".sbttl",	S_SBTL,		0,	0 },
    { NULL,	".globl",	S_GLOBL,	0,	0 },
    { NULL,	".area",	S_DAREA,	0,	0 },
    { NULL,	".even",	S_EVEN,		0,	0 },
    { NULL,	".odd",		S_ODD,		0,	0 },
    { NULL,	".if",		S_IF,		0,	0 },
    { NULL,	".else",	S_ELSE,		0,	0 },
    { NULL,	".endif",	S_ENDIF,	0,	0 },
    { NULL,	".include",	S_INCL,		0,	0 },
    { NULL,	".radix",	S_RADIX,	0,	0 },
    { NULL,	".org",		S_ORG,		0,	0 },
    { NULL,	".module",	S_MODUL,	0,	0 },
    { NULL,	".ascis",	S_ASCIS,	0,	0 },

	/* z80 / hd64180 */

    { NULL,	"ld",		S_LD,		0,	0x40 },

    { NULL,	"call",		S_CALL,		0,	0xC4 },
    { NULL,	"jp",		S_JP,		0,	0xC2 },
    { NULL,	"jr",		S_JR,		0,	0x18 },
#ifndef GAMEBOY
    { NULL,	"djnz",		S_DJNZ,		0,	0x10 },
#endif /* GAMEBOY */
    { NULL,	"ret",		S_RET,		0,	0xC0 },

    { NULL,	"bit",		S_BIT,		0,	0x40 },
    { NULL,	"res",		S_BIT,		0,	0x80 },
    { NULL,	"set",		S_BIT,		0,	0xC0 },

    { NULL,	"inc",		S_INC,		0,	0x04 },
    { NULL,	"dec",		S_DEC,		0,	0x05 },

    { NULL,	"add",		S_ADD,		0,	0x80 },
    { NULL,	"adc",		S_ADC,		0,	0x88 },
    { NULL,	"sub",		S_SUB,		0,	0x90 },
    { NULL,	"sbc",		S_SBC,		0,	0x98 },

    { NULL,	"and",		S_AND,		0,	0xA0 },
    { NULL,	"cp",		S_AND,		0,	0xB8 },
    { NULL,	"or",		S_AND,		0,	0xB0 },
    { NULL,	"xor",		S_AND,		0,	0xA8 },

#ifndef GAMEBOY
    { NULL,	"ex",		S_EX,		0,	0xE3 },
#endif /* GAMEBOY */

    { NULL,	"push",		S_PUSH,		0,	0xC5 },
    { NULL,	"pop",		S_PUSH,		0,	0xC1 },

#ifndef GAMEBOY
    { NULL,	"in",		S_IN,		0,	0xDB },
    { NULL,	"out",		S_OUT,		0,	0xD3 },
#endif /* GAMEBOY */

    { NULL,	"rl",		S_RL,		0,	0x10 },
    { NULL,	"rlc",		S_RL,		0,	0x00 },
    { NULL,	"rr",		S_RL,		0,	0x18 },
    { NULL,	"rrc",		S_RL,		0,	0x08 },
    { NULL,	"sla",		S_RL,		0,	0x20 },
    { NULL,	"sra",		S_RL,		0,	0x28 },
    { NULL,	"srl",		S_RL,		0,	0x38 },

    { NULL,	"rst",		S_RST,		0,	0xC7 },

#ifndef GAMEBOY
    { NULL,	"im",		S_IM,		0,	0xED },
#endif /* GAMEBOY */

    { NULL,	"ccf",		S_INH1,		0,	0x3F },
    { NULL,	"cpl",		S_INH1,		0,	0x2F },
    { NULL,	"daa",		S_INH1,		0,	0x27 },
    { NULL,	"di",		S_INH1,		0,	0xF3 },
    { NULL,	"ei",		S_INH1,		0,	0xFB },
#ifndef GAMEBOY
    { NULL,	"exx",		S_INH1,		0,	0xD9 },
#endif /* GAMEBOY */
    { NULL,	"nop",		S_INH1,		0,	0x00 },
    { NULL,	"halt",		S_INH1,		0,	0x76 },
    { NULL,	"rla",		S_INH1,		0,	0x17 },
    { NULL,	"rlca",		S_INH1,		0,	0x07 },
    { NULL,	"rra",		S_INH1,		0,	0x1F },
    { NULL,	"rrca",		S_INH1,		0,	0x0F },
    { NULL,	"scf",		S_INH1,		0,	0x37 },

#ifndef GAMEBOY
    { NULL,	"cpd",		S_INH2,		0,	0xA9 },
    { NULL,	"cpdr",		S_INH2,		0,	0xB9 },
    { NULL,	"cpi",		S_INH2,		0,	0xA1 },
    { NULL,	"cpir",		S_INH2,		0,	0xB1 },
    { NULL,	"ind",		S_INH2,		0,	0xAA },
    { NULL,	"indr",		S_INH2,		0,	0xBA },
    { NULL,	"ini",		S_INH2,		0,	0xA2 },
    { NULL,	"inir",		S_INH2,		0,	0xB2 },
    { NULL,	"ldd",		S_INH2,		0,	0xA8 },
    { NULL,	"lddr",		S_INH2,		0,	0xB8 },
    { NULL,	"ldi",		S_INH2,		0,	0xA0 },
    { NULL,	"ldir",		S_INH2,		0,	0xB0 },
    { NULL,	"neg",		S_INH2,		0,	0x44 },
    { NULL,	"otdr",		S_INH2,		0,	0xBB },
    { NULL,	"otir",		S_INH2,		0,	0xB3 },
    { NULL,	"outd",		S_INH2,		0,	0xAB },
    { NULL,	"outi",		S_INH2,		0,	0xA3 },
    { NULL,	"reti",		S_INH2,		0,	0x4D },
    { NULL,	"retn",		S_INH2,		0,	0x45 },
    { NULL,	"rld",		S_INH2,		0,	0x6F },
    { NULL,	"rrd",		S_INH2,		0,	0x67 },

	/* 64180 */

    { NULL,	".hd64",	X_HD64,		0,	0 },

    { NULL,	"otdm",		X_INH2,		0,	0x8B },
    { NULL,	"otdmr",	X_INH2,		0,	0x9B },
    { NULL,	"otim",		X_INH2,		0,	0x83 },
    { NULL,	"otimr",	X_INH2,		0,	0x93 },
    { NULL,	"slp",		X_INH2,		0,	0x76 },

    { NULL,	"in0",		X_IN,		0,	0x00 },
    { NULL,	"out0",		X_OUT,		0,	0x01 },

    { NULL,	"mlt",		X_MLT,		0,	0x4C },

    { NULL,	"tst",		X_TST,		0,	0x04 },
    { NULL,	"tstio",	X_TSTIO,	S_END,	0x7 }
#else /* GAMEBOY */
    { NULL,	"stop",		S_STOP,		0,	0x10 },
    { NULL,	"swap",		S_RL,		0,	0x30 },
    { NULL,	"reti",		S_INH1,		0,	0xD9 },
    { NULL,	"ldh",		S_LDH,		0,	0xE0 },
    { NULL,	"lda",		S_LDA,		0,	0xE8 },
    { NULL,	"ldhl",		S_LDHL,		S_END,	0xF }
#endif /* GAMEBOY */
};
