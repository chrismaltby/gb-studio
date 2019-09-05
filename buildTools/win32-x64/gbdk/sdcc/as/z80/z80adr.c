/* z80adr.c */

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

/*
 * Read an address specifier. Pack the
 * address information into the supplied
 * `expr' structure. Return the mode of
 * the address.
 *
 * This addr(esp) routine performs the following addressing decoding:
 *
 *	address		mode		flag		addr		base
 *	#n		S_IMMED		0		n		NULL
 *	label		s_type		----		s_addr		s_area
 *	[REG]		S_IND+icode	0		0		NULL
 *	[label]		S_INDM		----		s_addr		s_area
 *	offset[REG]	S_IND+icode	----		offset		----
 */
int
addr(esp)
register struct expr *esp;
{
	register int c, mode = 0, indx;

	if ((c = getnb()) == '#') {
		expr(esp, 0);
		esp->e_mode = S_IMMED;
	} else
	if (c == LFIND) {
		if ((indx = admode(R8)) != 0) {
			mode = S_INDB;
		} else
		if ((indx = admode(R16)) != 0) {
			mode = S_INDR;
		} else	
		if ((indx = admode(R8X)) != 0) {
			mode = S_R8X;
			aerr();
		} else
		if ((indx = admode(R16X)) != 0) {
			mode = S_R16X;
			aerr();
		} else {
			expr(esp, 0);
			esp->e_mode = S_INDM;
		}
		if (indx) {
			esp->e_mode = (mode + indx)&0xFF;
			esp->e_base.e_ap = NULL;
		}
		if ((c = getnb()) != RTIND)
			qerr();
	} else {
		unget(c);
		if ((indx = admode(R8)) != 0) {
			mode = S_R8;
		} else
		if ((indx = admode(R16)) != 0) {
			mode = S_R16;
		} else	
		if ((indx = admode(R8X)) != 0) {
			mode = S_R8X;
		} else
		if ((indx = admode(R16X)) != 0) {
			mode = S_R16X;
		} else {
			expr(esp, 0);
			esp->e_mode = S_USER;
		}
		if (indx) {
			esp->e_addr = indx&0xFF;
			esp->e_mode = mode;
			esp->e_base.e_ap = NULL;
		}
		if ((c = getnb()) == LFIND) {
#ifndef GAMEBOY
			if ((indx=admode(R16))!=0
				&& ((indx&0xFF)==IX || (indx&0xFF)==IY)) {
#else /* GAMEBOY */
			if ((indx=admode(R16))!=0) {
#endif /* GAMEBOY */
				esp->e_mode = S_INDR + (indx&0xFF);
			} else {
				aerr();
			}
			if ((c = getnb()) != RTIND)
				qerr();
		} else {
			unget(c);
		}
	}
	return (esp->e_mode);
}

/*
 * Enter admode() to search a specific addressing mode table
 * for a match. Return the addressing value on a match or
 * zero for no match.
 */
int
admode(sp)
register struct adsym *sp;
{
	register char *ptr;
	register int i;
	register char *ips;

	ips = ip;
	unget(getnb());

	i = 0;
	while ( *(ptr = (char *) &sp[i]) ) {
		if (srch(ptr)) {
			return(sp[i].a_val);
		}
		i++;
	}
	ip = ips;
	return(0);
}

/*
 *      srch --- does string match ?
 */
int
srch(str)
register char *str;
{
	register char *ptr;
	ptr = ip;

#if	CASE_SENSITIVE
	while (*ptr && *str) {
		if (*ptr != *str)
			break;
		ptr++;
		str++;
	}
	if (*ptr == *str) {
		ip = ptr;
		return(1);
	}
#else
	while (*ptr && *str) {
		if (ccase[(unsigned char)(*ptr)] != ccase[(unsigned char)(*str)])
			break;
		ptr++;
		str++;
	}
	if (ccase[(unsigned char)(*ptr)] == ccase[(unsigned char)(*str)]) {
		ip = ptr;
		return(1);
	}
#endif

	if (!*str)
		if (any(*ptr," \t\n,);")) {
			ip = ptr;
			return(1);
		}
	return(0);
}

/*
 *      any --- does str contain c?
 */
int
any(c,str)
char    c, *str;
{
	while (*str)
		if(*str++ == c)
			return(1);
	return(0);
}

/*
 * Registers
 */

struct	adsym	R8[] = {
    { "b",	B|0400 },
    { "c",	C|0400 },
    { "d",	D|0400 },
    { "e",	E|0400 },
    { "h",	H|0400 },
    { "l",	L|0400 },
    { "a",	A|0400 },
    { "",	000 }
};

struct	adsym	R8X[] = {
    { "i",	I|0400 },
    { "r",	R|0400 },
    { "",	000 }
};

struct	adsym	R16[] = {
    { "bc",	BC|0400 },
    { "de",	DE|0400 },
    { "hl",	HL|0400 },
    { "sp",	SP|0400 },
#ifndef GAMEBOY
    { "ix",	IX|0400 },
    { "iy",	IY|0400 },
#else /* GAMEBOY */
    { "hl-",	HLD|0400 },
    { "hl+",	HLI|0400 },
    { "hld",	HLD|0400 },
    { "hli",	HLI|0400 },
#endif /* GAMEBOY */
    { "",	000 }
};

struct	adsym	R16X[] = {
    { "af",	AF|0400 },
#ifndef GAMEBOY
    { "af'",	AF|0400 },
#endif /* GAMEBOY */
    { "",	000 }
};

/*
 * Conditional definitions
 */

struct	adsym	CND[] = {
    { "NZ",	NZ|0400 },
    { "Z",	Z |0400 },
    { "NC",	NC|0400 },
    { "C",	CS|0400 },
#ifndef GAMEBOY
    { "PO",	PO|0400 },
    { "PE",	PE|0400 },
    { "P",	P |0400 },
    { "M",	M |0400 },
#endif /* GAMEBOY */
    { "",	000 }
};
