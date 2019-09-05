/* aslist.c */

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
#include <string.h>
#if defined(__APPLE__) && defined(__MACH__)
#include <sys/types.h>
#include <sys/malloc.h>
#else
#include <malloc.h>
#endif

#include "asm.h"

/*)Module	aslist.c
 *
 *	The module aslist.c contains all the functions used
 *	to generate the assembler list and symbol output files.
 *
 *	aslist.c contains the following functions:
 *		VOID	list()
 *		VOID	list1()
 *		VOID	list2()
 *		VOID	slew()
 *		VOID	lstsym()
 *
 *	The module aslist.c contains no local/static variables
 */

/*)Function	VOID	list()
 *
 *	The function list() generates the listing output
 *	which includes the input source, line numbers,
 *	and generated code.  Numerical output may be selected
 *	as hexadecimal, decimal, or octal.
 * 
 *	local variables:
 *		int *	wp		pointer to the assembled data bytes
 *		int *	wpt		pointer to the data byte mode
 *		int	nb		computed number of assembled bytes
 *
 *	global variables:
 *		int	cb[]		array of assembler output values
 *		int	cbt[]		array of assembler relocation types
 *					describing the data in cb[]
 *		int *	cp		pointer to assembler output array cb[]
 *		int *	cpt		pointer to assembler relocation type
 *					output array cbt[]
 *		char	eb[]		array of generated error codes
 *		char *	ep		pointer into error list
 *					array eb[]
 *		char	ib[]		assembler-source text line
 *		FILE *	lfp		list output file handle
 *		int	line		current assembler source line number
 *		int	lmode		listing mode
 *		int	xflag		-x, listing radix flag
 *
 *	functions called:
 *		int	fprintf()	c_library
 *		VOID	list1()		aslist.c
 *		int	putc()		c_library
 *		VOID	slew()		asslist.c
 *
 *	side effects:
 *		Listing or symbol output updated.
 */

#ifndef MLH_LST
VOID
list()
{
	register char *wp;
	register int *wpt;
	register int nb;

	if (lfp == NULL || lmode == NLIST)
		return;

	/*
	 * Get Correct Line Number
	 */
	if (incfil >= 0) {
		line = incline[incfil];
		if (line == 0) {
			if (incfil > 0) {
				line = incline[incfil-1];
			} else {
				line = srcline[cfile];
			}
		}
	} else {
		line = srcline[cfile];
	}

	/*
	 * Move to next line.
	 */
	slew(lfp, pflag);

	/*
	 * Output a maximum of NERR error codes with listing.
	 */
	while (ep < &eb[NERR])
		*ep++ = ' ';
	fprintf(lfp, "%.2s", eb);

	/*
	 * Source listing only option.
	 */
	if (lmode == SLIST) {
		fprintf(lfp, "%24s%5u %s\n", "", line, ib);
		return;
	}
#ifndef SDK
	if (lmode == ALIST) {
		outchk(HUGE,HUGE);
	}
#endif

	/*
	 * HEX output Option.
	 */
	if (xflag == 0) {		/* HEX */
		/*
		 * Equate only
		 */
		if (lmode == ELIST) {
			fprintf(lfp, "%18s%04X", "", laddr);
			fprintf(lfp, "  %5u %s\n", line, ib);
			return;
		}

		/*
		 * Address (with allocation)
		 */
		fprintf(lfp, " %04X", laddr);
		if (lmode == ALIST || lmode == BLIST) {
			fprintf(lfp, "%19s%5u %s\n", "", line, ib);
#ifndef SDK
			outdot();
#endif
			return;
		}
		wp = cb;
		wpt = cbt;
		nb = (int) (cp - cb);

		/*
		 * First line of output for this source line with data.
		 */
		list1(wp, wpt, nb, 1);
		fprintf(lfp, " %5u %s\n", line, ib);

		/*
		 * Subsequent lines of output if more data.
		 */
		while ((nb -= 6) > 0) {
			wp += 6;
			wpt += 6;
			slew(lfp, 0);
			fprintf(lfp, "%7s", "");
			list1(wp, wpt, nb, 0);
			putc('\n', lfp);
		}
	} else
	/*
	 * OCTAL output Option.
	 */
	if (xflag == 1) {		/* OCTAL */
		/*
		 * Equate only
		 */
		if (lmode == ELIST) {
			fprintf(lfp, "%16s%06o", "", laddr);
			fprintf(lfp, "  %5u %s\n", line, ib);
			return;
		}

		/*
		 * Address (with allocation)
		 */
		fprintf(lfp, " %06o", laddr);
		if (lmode == ALIST || lmode == BLIST) {
			fprintf(lfp, "%17s%5u %s\n", "", line, ib);
#ifndef SDK
			outdot();
#endif
			return;
		}
		wp = cb;
		wpt = cbt;
		nb = (int) (cp - cb);

		/*
		 * First line of output for this source line with data.
		 */
		list1(wp, wpt, nb, 1);
		fprintf(lfp, " %5u %s\n", line, ib);

		/*
		 * Subsequent lines of output if more data.
		 */
		while ((nb -= 4) > 0) {
			wp += 4;
			wpt += 4;
			slew(lfp, 0);
			fprintf(lfp, "%9s", "");
			list1(wp, wpt, nb, 0);
			putc('\n', lfp);
		}
	} else
	/*
	 * DECIMAL output Option.
	 */
	if (xflag == 2) {		/* DECIMAL */
		/*
		 * Equate only
		 */
		if (lmode == ELIST) {
			fprintf(lfp, "%16s%05u", "", laddr);
			fprintf(lfp, "   %5u %s\n", line, ib);
			return;
		}

		/*
		 * Address (with allocation)
		 */
		fprintf(lfp, "  %05u", laddr);
		if (lmode == ALIST || lmode == BLIST) {
			fprintf(lfp, "%17s%5u %s\n", "", line, ib);
#ifndef SDK
			outdot();
#endif
			return;
		}
		wp = cb;
		wpt = cbt;
		nb = (int) (cp - cb);

		/*
		 * First line of output for this source line with data.
		 */
		list1(wp, wpt, nb, 1);
		fprintf(lfp, " %5u %s\n", line, ib);

		/*
		 * Subsequent lines of output if more data.
		 */
		while ((nb -= 4) > 0) {
			wp += 4;
			wpt += 4;
			slew(lfp, 0);
			fprintf(lfp, "%9s", "");
			list1(wp, wpt, nb, 0);
			putc('\n', lfp);
		}
	}
}
#else
VOID
list()
{
	register char *wp;
	register int *wpt;
	register nb;

	if (lfp == NULL || lmode == NLIST)
		return;

	/*
	 * Get Correct Line Number
	 */
	if (incfil >= 0) {
		line = incline[incfil];
		if (line == 0) {
			if (incfil > 0) {
				line = incline[incfil-1];
			} else {
				line = srcline[cfile];
			}
		}
	} else {
		line = srcline[cfile];
	}

	/*
	 * HEX output Option.
	 */
		/* Output filename relative_address line_number */

	if (incfil >= 0) {
		fprintf(lfp, "%s ", incfn[incfil]);
	}
        else {
		fprintf(lfp, "%s ", srcfn[cfile]);
	}
	fprintf(lfp, "%u %04X\n", line, laddr);
#if 0
		wp = cb;
		wpt = cbt;
		nb = (int) (cp - cb);

		/*
		 * First line of output for this source line with data.
		 */
		list1(wp, wpt, nb, 1);
		fprintf(lfp, " %5u %s\n", line, ib);

		/*
		 * Subsequent lines of output if more data.
		 */
		while ((nb -= 6) > 0) {
			wp += 6;
			wpt += 6;
			slew(lfp, 0);
			fprintf(lfp, "%7s", "");
			list1(wp, wpt, nb, 0);
			putc('\n', lfp);
		}
#endif
}
#endif /* MLH_LST */

/*)Function	VOID	list1(wp, wpt, nw, f)
 *
 *		int	f		fill blank fields (1)
 *		int	nb		number of data bytes
 *		int *	wp		pointer to data bytes
 *		int *	wpt		pointer to data byte mode
 *
 *	local variables:
 *		int	i		loop counter
 *
 *	global variables:
 *		int	xflag		-x, listing radix flag
 *
 *	functions called:
 *		VOID	list2()		asslist.c
 *		int	fprintf()	c_library
 *
 *	side effects:
 *		Data formatted and output to listing.
 */

VOID
list1(wp, wpt, nb, f)
register char *wp;
register int *wpt, nb, f;
{
	register int i;

	/*
	 * HEX output Option.
	 */
	if (xflag == 0) {		/* HEX */
		/*
		 * Bound number of words to HEX maximum per line.
		 */
		if (nb > 6)
			nb = 6;

		/*
		 * Output bytes.
		 */
		for (i=0; i<nb; ++i) {
			list2(*wpt++);
			fprintf(lfp, "%02X", (*wp++)&0377);
		}

		/*
		 * Output blanks if required.
		 */
		if (f) {
			while (i < 6) {
				fprintf(lfp, "   ");
				++i;
			}
		}
	} else
	/*
	 * OCTAL output Option.
	 */
	if (xflag == 1) {		/* OCTAL */
		/*
		 * Bound number of words to OCTAL maximum per line.
		 */
		if (nb > 4)
			nb = 4;

		/*
		 * Output bytes.
		 */
		for (i=0; i<nb; ++i) {
			list2(*wpt++);
			fprintf(lfp, "%03o", (*wp++)&0377);
		}

		/*
		 * Output blanks if required.
		 */
		if (f) {
			while (i < 4) {
				fprintf(lfp, "    ");
				++i;
			}
		}
	} else
	/*
	 * DECIMAL output Option.
	 */
	if (xflag == 2) {		/* DECIMAL */
		/*
		 * Bound number of words to DECIMAL maximum per line.
		 */
		if (nb > 4)
			nb = 4;

		/*
		 * Output bytes.
		 */
		for (i=0; i<nb; ++i) {
			list2(*wpt++);
			fprintf(lfp, "%03u", (*wp++)&0377);
		}

		/*
		 * Output blanks if required.
		 */
		if (f) {
			while (i < 4) {
				fprintf(lfp, "    ");
				++i;
			}
		}
	}
}

/*)Function	VOID	list2(wpt)
 *
 *		int *	wpt		pointer to relocation mode
 *
 *	The function list2() outputs the selected
 *	relocation flag as specified by fflag.
 *
 *	local variables:
 *		int	c		relocation flag character
 *		int	t		relocation mode
 *
 *	global variables:
 *		int	fflag		-f(f), relocations flagged flag
 *
 *	functions called:
 *		int	putc()		c_library
 *
 *	side effects:
 *		Relocation flag output to listing file.
 */

VOID
list2(t)
register int t;
{
	register int c;

	c = ' ';

	/*
	 * Designate a relocatable word by `.
	 */
	if (fflag == 1) {
		if (t & R_RELOC) {
			c = '`';
		}
	} else
	/*
	 * Designate a relocatable word by its mode:
	 *	page0 or paged		*
	 *	unsigned		u (v)
	 *	operand offset		p (q)
	 *	relocatable symbol	r (s)
	 */
	if (fflag >= 2) {
		if (t & R_RELOC) {
			if (t & (R_PAG0|R_PAG)) {
				c = '*';
			} else if (t & R_USGN) {
				c = 'u';
			} else if (t & R_PCR) {
				c = 'p';
			} else {
				c = 'r';
			}
			if (t & R_HIGH) c += 1;
		}
	}

	/*
	 * Output the selected mode.
	 */
	putc(c, lfp);
}

/*)Function	VOID	slew(fp, flag)
 *
 *		FILE *	fp		file handle for listing
 *		int	flag		enable pagination
 *
 *	The function slew() increments the page line count.
 *	If the page overflows and pagination is enabled:
 *		1)	put out a page skip,
 *		2)	a title,
 *		3)	a subtitle,
 *		4)	and reset the line count.
 *
 *	local variables:
 *		none
 *
 *	global variables:
 *		char	cpu[]		cpu type string
 *		int	lop		current line number on page
 *		int	page		current page number
 *		char	stb[]		Subtitle string buffer
 *		char	tb[]		Title string buffer
 *
 *	functions called:
 *		int	fprintf()	c_library
 *
 *	side effects:
 *		Increments page line counter, on overflow
 *		a new page header is output to the listing file.
 */

VOID
slew(fp,flag)
FILE *fp;
int flag;
{
	if ((lop++ >= NLPP) && flag) {
		fprintf(fp, "\fASxxxx Assembler %s  (%s), page %u.\n",
			VERSION, cpu, ++page);
		fprintf(fp, "%s\n", tb);
		fprintf(fp, "%s\n\n", stb);
		lop = 5;
	}
}

/*)Function	VOID	lstsym(fp)
 *
 *		FILE *	fp		file handle for output
 *
 *	The function lstsym() outputs alphabetically
 *	sorted symbol and area tables.
 *
 *	local variables:
 *		int	c		temporary
 *		int	i		loop counter
 *		int	j		temporary
 *		int	k		temporary
 *		char *	ptr		pointer to an id string
 *		int	nmsym		number of symbols
 *		int	narea		number of areas
 *		sym *	sp		pointer to symbol structure
 *		sym **	p		pointer to an array of
 *					pointers to symbol structures
 *		area *	ap		pointer to an area structure
 *
 *	global variables:
 *		area *	areap		pointer to an area structure
 *		char	aretbl[]	string "Area Table"
 *		sym	dot		defined as sym[0]
 *		char	stb[]		Subtitle string buffer
 *		sym * symhash[]		array of pointers to NHASH
 *					linked symbol lists
 *		char	symtbl[]	string "Symbol Table"
 *		FILE *	tfp		symbol table output file handle
 *		int	xflag		-x, listing radix flag
 *
 *	functions called:
 *		int	fprintf()	c_library
 *		int	putc()		c_library
 *		VOID	slew()		aslist.c
 *		int	strcmp()	c_library
 *		char *	strcpy()	c_library
 *
 *	side effects:
 *		Symbol and area tables output.
 */

VOID
lstsym(fp)
FILE *fp;
{
	register int c, i, j, k;
	register char *ptr;
	int nmsym, narea;
	struct sym *sp;
	struct sym **p;
	struct area *ap;

	/*
	 * Symbol Table Header
	 */
	strcpy(stb, &symtbl[0]);
	lop = NLPP;
	if (fp == tfp)
		page = 0;
	slew(fp, 1);

	/*
	 * Find number of symbols
	 */
	nmsym = 0;
	for (i=0; i<NHASH; i++) {
		sp = symhash[i];
		while (sp) {
			if (sp != &dot)
				++nmsym;
			sp = sp->s_sp;
		}
	}
	if (nmsym == 0)
		goto atable;

	/*
	 * Allocate space for an array of pointers to symbols
	 * and load array.
	 */
	if ((p = (struct sym **) malloc(sizeof((struct sym *) sp)*nmsym))
		== NULL) {
		fprintf(fp, "Insufficient space to build Symbol Table.\n");
		return;
	}
	nmsym = 0;
	for (i=0; i<NHASH; i++) {
		sp = symhash[i];
		while (sp) {
			if (sp != &dot)
				p[nmsym++] = sp;
			sp = sp->s_sp;
		}
	}

	/*
	 * Bubble Sort on Symbol Table Array
	 */
	j = 1;
	c = nmsym - 1;
	while (j) {
		j = 0;
		for (i=0; i<c; ++i) {
			if (strcmp(&p[i]->s_id[0],&p[i+1]->s_id[0]) > 0) {
				j = 1;
				sp = p[i+1];
				p[i+1] = p[i];
				p[i] = sp;
			}
		}
	}

	/*
	 * Symbol Table Output
	 */
	for (i=0; i<nmsym;) {
		sp = p[i];
		if (sp->s_area) {
			j = sp->s_area->a_ref;
			if (xflag == 0) {
				fprintf(fp, " %2X ", j);
			} else
			if (xflag == 1) {
				fprintf(fp, "%3o ", j);
			} else
			if (xflag == 2) {
				fprintf(fp, "%3u ", j);
			}
		} else {
			fprintf(fp, "    ");
		}
		ptr = &sp->s_id[0];
		while (ptr < &sp->s_id[NCPS]) {
			if ((c = *ptr++) != 0) {
				putc(c, fp);
			} else {
				putc(' ', fp);
			}
		}
		if (sp->s_flag & S_ASG) {
			putc('=', fp);
		} else {
			putc(' ', fp);
		}
		if (sp->s_type == S_NEW) {
			if (xflag == 0) {
				fprintf(fp, "  **** ");
			} else
			if (xflag == 1) {
				fprintf(fp, "****** ");
			} else
			if (xflag == 2) {
				fprintf(fp, " ***** ");
			}
		} else {
			j = sp->s_addr;
			if (xflag == 0) {
				fprintf(fp, "  %04X ", j);
			} else
			if (xflag == 1) {
				fprintf(fp, "%06o ", j);
			} else
			if (xflag == 2) {
				fprintf(fp, " %05u ", j);
			}
		}
		j = 0;
		if (sp->s_flag & S_GBL) {
			putc('G', fp);
			++j;
		}
		if (sp->s_area != NULL) {
			putc('R', fp);
			++j;
		}
		if (sp->s_type == S_NEW) {
			putc('X', fp);
			++j;
		}
#if NCPS-8
		putc('\n', fp);
		slew(fp, 0);
		++i;
#else
		if (++i % 3 == 0) {
			putc('\n', fp);
			slew(fp, pflag);
		} else
		if (i < nmsym) {
			while (j++ < 4)
				putc(' ', fp);
			fprintf(fp, "| ");
		}
#endif
	}
	putc('\n', fp);

	/*
	 * Area Table Header
	 */

atable:
	strcpy(stb, &aretbl[0]);
	lop = NLPP;
	slew(fp, 1);

	/*
	 * Area Table Output
	 */
	narea = 0;
	ap = areap;
	while (ap) {
		++narea;
		ap = ap->a_ap;
	}
	for (i=0; i<narea; ++i) {
		ap = areap;
		for (j=i+1; j<narea; ++j)
			ap = ap->a_ap;
		j = ap->a_ref;
		if (xflag == 0) {
			fprintf(fp, "  %2X ", j);
		} else
		if (xflag == 1) {
			fprintf(fp, " %3o ", j);
		} else
		if (xflag == 2) {
			fprintf(fp, " %3u ", j);
		}
		ptr = &ap->a_id[0];
		while (ptr < &ap->a_id[NCPS]) {
			if ((c = *ptr++) != 0) {
				putc(c, fp);
			} else {
				putc(' ', fp);
			}
		}
		j = ap->a_size;
		k = ap->a_flag;
		if (xflag==0) {
			fprintf(fp, "   size %4X   flags %X\n", j, k);
		} else
		if (xflag==1) {
			fprintf(fp, "   size %6o   flags %o\n", j, k);
		} else
		if (xflag==2) {
			fprintf(fp, "   size %5u   flags %u\n", j, k);
		}
	}		
}
