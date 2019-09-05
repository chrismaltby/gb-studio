/* lklist.c */

/*
 * (C) Copyright 1989-1995
 * All Rights Reserved
 *
 * Alan R. Baldwin
 * 721 Berkeley St.
 * Kent, Ohio  44240
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "aslink.h"

/*)Module	lklist.c
 *
 *	The module lklist.c contains the functions which
 *	output the linker .map file and produce a relocated
 *	listing .rst file.
 *
 *	lklist.c contains the following functions:
 *		int	dgt()
 *		VOID	lstarea()
 *		VOID	lkulist()
 *		VOID	lkalist()
 *		VOID	lkglist()
 *		VOID	newpag()
 *		VOID	slew()
 *
 *	lklist.c contains no local variables.
 */

/*)Function	VOID	slew(fp)
 *
 *		FILE *	fp		output file handle
 *
 *	The function slew() increments the page line counter.
 *	If the number of lines exceeds the maximum number of
 *	lines per page then a page skip and a page header are
 *	output.
 *
 *	local variables:
 *		int	i		loop counter
 *
 *	global variables:
 *		int	lop		current line number on page
 *		int	xflag		Map file radix type flag
 *
 *	functions called:
 *		int	fprintf()	c_library
 *		VOID	newpag()	lklist.c
 *
 *	side effects:
 *		The page line and the page count may be updated.
 */

VOID
slew(fp)
FILE *fp;
{
	register int i;

	if (lop++ >= NLPP) {
		newpag(fp);
		if (xflag == 0) {
			fprintf(fp, "Hexidecimal\n\n");
		} else
		if (xflag == 1) {
			fprintf(fp, "Octal\n\n");
		} else
		if (xflag == 2) {
			fprintf(fp, "Decimal\n\n");
		}
		fprintf(fp, "Area       Addr   Size");
		fprintf(fp, "   Decimal Bytes (Attributes)\n");
		for(i=0;i<4;++i)
			fprintf(fp, "      Value--Global");
		fprintf(fp, "\n\n");
		lop += 6;
	}
}

/*)Function	VOID	newpag()
 *
 *	The function newpag() outputs a page skip, writes the
 *	first page header line, sets the line count to 1, and
 *	increments the page counter.
 *
 *	local variables:
 *		none
 *
 *	global variables:
 *		int	lop		current line number on page
 *		int	page		current page number
 *
 *	functions called:
 *		int	fprintf()	c_library
 *
 *	side effects:
 *		The page and line counters are updated.
 */

VOID
newpag(fp)
FILE *fp;
{
	fprintf(fp, "\fASxxxx Linker %s,  page %u.\n", VERSION, ++page);
	lop = 1;
}

#if	NCPS-8

/* NCPS != 8 */
/*)Function	VOID	lstarea(xp)
 *
 *		area *	xp		pointer to an area structure
 *
 *	The function lstarea() creates the linker map output for
 *	the area specified by pointer xp.  The generated output
 *	area header includes the area name, starting address,
 *	size of area, number of words (in decimal), and the
 *	area attributes.  The symbols defined in this area are
 *	sorted by ascending address and output one per line
 *	in the selected radix.
 *
 *	local variables:
 *		areax *	oxp		pointer to an area extension structure
 *		int	c		character value
 *		int	i		loop counter
 *		int	j		bubble sort update status
 *		char *	ptr		pointer to an id string
 *		int	nmsym		number of symbols in area
 *		Addr_T	a0		temporary
 *		Addr_T	ai		temporary
 *		Addr_T	aj		temporary
 *		sym *	sp		pointer to a symbol structure
 *		sym **	p		pointer to an array of
 *					pointers to symbol structures
 *
 *	global variables:
 *		FILE	*mfp		Map output file handle
 *		sym *symhash[NHASH] 	array of pointers to NHASH
 *				      	linked symbol lists
 *		int	xflag		Map file radix type flag
 *
 *	functions called:
 *		int	fprintf()	c_library
 *		VOID	free()		c_library
 *		char *	malloc()	c_library
 *		char	putc()		c_library
 *		VOID	slew()		lklist.c
 *
 *	side effects:
 *		Map output generated.
 */

#ifndef MLH_MAP
VOID
lstarea(xp)
struct area *xp;
{
	register struct area *op;
	register struct areax *oxp;
	register c, i, j;
	register char *ptr;
	int nmsym;
	Addr_T a0, ai, aj;
	struct sym *sp;
	struct sym **p;

	putc('\n', mfp);
	if (xflag == 0) {
		fprintf(mfp, "Hexidecimal\n\n");
	} else
	if (xflag == 1) {
		fprintf(mfp, "Octal\n\n");
	} else
	if (xflag == 2) {
		fprintf(mfp, "Decimal\n\n");
	}
	fprintf(mfp, "Area                               ");
	fprintf(mfp, "Addr   Size   Decimal Bytes (Attributes)\n");
	fprintf(mfp, "--------------------------------   ");
	fprintf(mfp, "----   ----   ------- ----- ------------\n");
	/*
	 * Output Area Header
	 */
	ptr = &xp->a_id[0];
	while (ptr < &xp->a_id[NCPS]) {
		if ((c = *ptr++) != 0) {
			putc(c, mfp);
		} else {
			putc(' ', mfp);
		}
	}
	ai = xp->a_addr;
	aj = xp->a_size;
	if (xflag == 0) {
		fprintf(mfp, "   %04X   %04X", ai, aj);
	} else
	if (xflag == 1) {
		fprintf(mfp, " %06o %06o", ai, aj);
	} else
	if (xflag == 2) {
		fprintf(mfp, "  %05u  %05u", ai, aj);
	}
	fprintf(mfp, " = %6u. bytes ", aj);
	if (xp->a_flag & A_ABS) {
		fprintf(mfp, "(ABS");
	} else {
		fprintf(mfp, "(REL");
	}
	if (xp->a_flag & A_OVR) {
		fprintf(mfp, ",OVR");
	} else {
		fprintf(mfp, ",CON");
	}
	if (xp->a_flag & A_PAG) {
		fprintf(mfp, ",PAG");
	}
	fprintf(mfp, ")");
	if (xp->a_flag & A_PAG) {
		ai = (ai & 0xFF);
		aj = (aj > 256);
		if (ai || aj) { fprintf(mfp, "  "); }
		if (ai)      { fprintf(mfp, " Boundary"); }
		if (ai & aj)  { fprintf(mfp, " /"); }
		if (aj)      { fprintf(mfp, " Length"); }
		if (ai || aj) { fprintf(mfp, " Error"); }
	}

	/*
	 * Find number of symbols in area
	 */
	nmsym = 0;
	oxp = xp->a_axp;
	while (oxp) {
		for (i=0; i<NHASH; i++) {
			sp = symhash[i];
			while (sp != NULL) {
				if (oxp == sp->s_axp)
					++nmsym;
				sp = sp->s_sp;
			}
		}
		oxp = oxp->a_axp;
	}
	if (nmsym == 0) {
		putc('\n', mfp);
		return;
	}

	/*
	 * Allocate space for an array of pointers to symbols
	 * and load array.
	 */
	if ( (p = (struct sym **) malloc(nmsym*sizeof(struct sym *)))
		== NULL) {
		fprintf(mfp, "\nInsufficient space to build Map Segment.\n");
		return;
	}
	nmsym = 0;
	oxp = xp->a_axp;
	while (oxp) {
		for (i=0; i<NHASH; i++) {
			sp = symhash[i];
			while (sp != NULL) {
				if (oxp == sp->s_axp) {
					p[nmsym++] = sp;
				}
				sp = sp->s_sp;
			}
		}
		oxp = oxp->a_axp;
	}

	/*
	 * Bubble Sort of Addresses in Symbol Table Array
	 */
	j = 1;
	while (j) {
		j = 0;
		sp = p[0];
		a0 = sp->s_addr + sp->s_axp->a_addr;
		for (i=1; i<nmsym; ++i) {
			sp = p[i];
			ai = sp->s_addr + sp->s_axp->a_addr;
			if (a0 > ai) {
				j = 1;
				p[i] = p[i-1];
				p[i-1] = sp;
			}
			a0 = ai;
		}
	}

	/*
	 * Symbol Table Output
	 */
	i = 0;
	fprintf(mfp, "\n\n");
	fprintf(mfp, "      Value  Global\n");
	fprintf(mfp, "      -----  --------------------------------");
	while (i < nmsym) {
		fprintf(mfp, "\n");
		fprintf(mfp, "     ");

		sp = p[i];
		aj = sp->s_addr + sp->s_axp->a_addr;
		if (xflag == 0) {
			fprintf(mfp, "  %04X  ", aj);
		} else
		if (xflag == 1) {
			fprintf(mfp, "%06o  ", aj);
		} else
		if (xflag == 2) {
			fprintf(mfp, " %05u  ", aj);
		}
		ptr = &sp->s_id[0];
		while (ptr < &sp->s_id[NCPS]) {
			if ((c = *ptr++) != 0) {
				putc(c, mfp);
			} else {
				putc(' ', mfp);
			}
		}
		i++;
	}
	putc('\n', mfp);
	free(p);
}
#else
VOID lstarea(struct area *xp)
{
	register struct areax *oxp;
	register int i, j;
	int nmsym;
	Addr_T a0, ai = 0, aj = 0;
	struct sym *sp;
	struct sym **p;

	/*
	 * Find number of symbols in area
	 */
	nmsym = 0;
	oxp = xp->a_axp;
	while (oxp) {
		for (i=0; i<NHASH; i++) {
			sp = symhash[i];
			while (sp != NULL) {
				if (oxp == sp->s_axp)
					++nmsym;
				sp = sp->s_sp;
			}
		}
		oxp = oxp->a_axp;
	}

	/*
	 * Symbol Table Output
	 */
	if (!((xp->a_size==0)&&(xp->a_addr==0)&&(nmsym==0))) {
		fprintf(mfp, "AREA %s\n", xp->a_id );
		switch (xflag) {
			case 1:
				fprintf(mfp, "\tRADIX OCTAL\n" );
				break;
			case 2:
				fprintf(mfp, "\tRADIX DEC\n" );
				break;
			default:
				fprintf(mfp, "\tRADIX HEX\n" );
				break;
		}
		fprintf( mfp,	"\tBASE %04X\n"
				"\tSIZE %04X\n"
				"\tATTRIB "
			, xp->a_addr, xp->a_size );
		if (xp->a_flag & A_ABS) {
			fprintf(mfp, "ABS");
		} else {
			fprintf(mfp, "REL");
		}
		if (xp->a_flag & A_OVR) {
			fprintf(mfp, " OVR");
		} else {
			fprintf(mfp, " CON");
		}
		if (xp->a_flag & A_PAG) {
			fprintf(mfp, " PAG");
		}
		if (xp->a_flag & A_PAG) {
			ai = (ai & 0xFF);
			aj = (aj > 256);
			if (ai || aj) { fprintf(mfp, "  "); }
			if (ai)      { fprintf(mfp, " Boundary"); }
			if (ai & aj)  { fprintf(mfp, " /"); }
			if (aj)      { fprintf(mfp, " Length"); }
			if (ai || aj) { fprintf(mfp, " Error"); }
		}

		fprintf( mfp,"\n");
		if (nmsym>0) {
			/*
			 * Allocate space for an array of pointers to symbols
			 * and load array.
			 */
			if ( (p = (struct sym **) malloc(nmsym*sizeof(struct sym *)))
			    == NULL) {
				fprintf(mfp, "\nInsufficient space to build Map Segment.\n");
				return;
			}
			nmsym = 0;
			oxp = xp->a_axp;
			while (oxp) {
				for (i=0; i<NHASH; i++) {
					sp = symhash[i];
					while (sp != NULL) {
						if (oxp == sp->s_axp) {
							p[nmsym++] = sp;
						}
						sp = sp->s_sp;
					}
				}
				oxp = oxp->a_axp;
			}

			/*
			 * Bubble Sort of Addresses in Symbol Table Array
			 */
			j = 1;
			while (j) {
				j = 0;
				sp = p[0];
				a0 = sp->s_addr + sp->s_axp->a_addr;
				for (i=1; i<nmsym; ++i) {
					sp = p[i];
					ai = sp->s_addr + sp->s_axp->a_addr;
					if (a0 > ai) {
						j = 1;
						p[i] = p[i-1];
						p[i-1] = sp;
					}
					a0 = ai;
				}
			}

			fprintf( mfp, "\tGLOBALS\n");
			i = 0;
			while (i < nmsym) {
				fprintf(mfp, "\t\t%s\t%04X\n", p[i]->s_id, p[i]->s_addr + p[i]->s_axp->a_addr );
				i++;
			}
			free(p);
		}
	}
}
#endif /* MLH_MAP */
#else

/* NCPS == 8 */
/*)Function	VOID	lstarea(xp)
 *
 *		area *	xp		pointer to an area structure
 *
 *	The function lstarea() creates the linker map output for
 *	the area specified by pointer xp.  The generated output
 *	area header includes the area name, starting address,
 *	size of area, number of words (in decimal), and the
 *	area attributes.  The symbols defined in this area are
 *	sorted by ascending address and output four per line
 *	in the selected radix.
 *
 *	local variables:
 *		areax *	oxp		pointer to an area extension structure
 *		int	c		character value
 *		int	i		loop counter
 *		int	j		bubble sort update status
 *		char *	ptr		pointer to an id string
 *		int	nmsym		number of symbols in area
 *		Addr_T	a0		temporary
 *		Addr_T	ai		temporary
 *		Addr_T	aj		temporary
 *		sym *	sp		pointer to a symbol structure
 *		sym **	p		pointer to an array of
 *					pointers to symbol structures
 *
 *	global variables:
 *		FILE	*mfp		Map output file handle
 *		sym *symhash[NHASH] 	array of pointers to NHASH
 *				      	linked symbol lists
 *		int	xflag		Map file radix type flag
 *
 *	functions called:
 *		int	fprintf()	c_library
 *		VOID	free()		c_library
 *		char *	malloc()	c_library
 *		char	putc()		c_library
 *		VOID	slew()		lklist.c
 *
 *	side effects:
 *		Map output generated.
 */

VOID
lstarea(xp)
struct area *xp;
{
	register struct areax *oxp;
	register c, i, j;
	register char *ptr;
	int nmsym;
	Addr_T a0, ai, aj;
	struct sym *sp;
	struct sym **p;

	putc('\n', mfp);
	slew(mfp);
	/*
	 * Output Area Header
	 */
	ptr = &xp->a_id[0];
	while (ptr < &xp->a_id[NCPS]) {
		if ((c = *ptr++) != 0) {
			putc(c, mfp);
		} else {
			putc(' ', mfp);
		}
	}
	ai = xp->a_addr;
	aj = xp->a_size;
	if (xflag == 0) {
		fprintf(mfp, "   %04X   %04X", ai, aj);
	} else
	if (xflag == 1) {
		fprintf(mfp, " %06o %06o", ai, aj);
	} else
	if (xflag == 2) {
		fprintf(mfp, "  %05u  %05u", ai, aj);
	}
	fprintf(mfp, " = %6u. bytes ", aj);
	if (xp->a_flag & A_ABS) {
		fprintf(mfp, "(ABS");
	} else {
		fprintf(mfp, "(REL");
	}
	if (xp->a_flag & A_OVR) {
		fprintf(mfp, ",OVR");
	} else {
		fprintf(mfp, ",CON");
	}
	if (xp->a_flag & A_PAG) {
		fprintf(mfp, ",PAG");
	}
	fprintf(mfp, ")");
	if (xp->a_flag & A_PAG) {
		ai = (ai & 0xFF);
		aj = (aj > 256);
		if (ai || aj) { fprintf(mfp, "  "); }
		if (ai)      { fprintf(mfp, " Boundary"); }
		if (ai & aj)  { fprintf(mfp, " /"); }
		if (aj)      { fprintf(mfp, " Length"); }
		if (ai || aj) { fprintf(mfp, " Error"); }
	}

	/*
	 * Find number of symbols in area
	 */
	nmsym = 0;
	oxp = xp->a_axp;
	while (oxp) {
		for (i=0; i<NHASH; i++) {
			sp = symhash[i];
			while (sp != NULL) {
				if (oxp == sp->s_axp)
					++nmsym;
				sp = sp->s_sp;
			}
		}
		oxp = oxp->a_axp;
	}
	if (nmsym == 0) {
		putc('\n', mfp);
		slew(mfp);
		return;
	}

	/*
	 * Allocate space for an array of pointers to symbols
	 * and load array.
	 */
	if ( (p = (struct sym **) malloc(nmsym*sizeof(struct sym *)))
		== NULL) {
		fprintf(mfp, "\nInsufficient space to build Map Segment.\n");
		slew(mfp);
		return;
	}
	nmsym = 0;
	oxp = xp->a_axp;
	while (oxp) {
		for (i=0; i<NHASH; i++) {
			sp = symhash[i];
			while (sp != NULL) {
				if (oxp == sp->s_axp) {
					p[nmsym++] = sp;
				}
				sp = sp->s_sp;
			}
		}
		oxp = oxp->a_axp;
	}

	/*
	 * Bubble Sort of Addresses in Symbol Table Array
	 */
	j = 1;
	while (j) {
		j = 0;
		sp = p[0];
		a0 = sp->s_addr + sp->s_axp->a_addr;
		for (i=1; i<nmsym; ++i) {
			sp = p[i];
			ai = sp->s_addr + sp->s_axp->a_addr;
			if (a0 > ai) {
				j = 1;
				p[i] = p[i-1];
				p[i-1] = sp;
			}
			a0 = ai;
		}
	}

	/*
	 * Symbol Table Output
	 */
	i = 0;
	while (i < nmsym) {
		if (i % 4 == 0) {
			fprintf(mfp, "\n");
			slew(mfp);
			fprintf(mfp, "     ");
		}
		sp = p[i];
		aj = sp->s_addr + sp->s_axp->a_addr;
		if (xflag == 0) {
			fprintf(mfp, "  %04X  ", aj);
		} else
		if (xflag == 1) {
			fprintf(mfp, "%06o  ", aj);
		} else
		if (xflag == 2) {
			fprintf(mfp, " %05u  ", aj);
		}
		ptr = &sp->s_id[0];
		while (ptr < &sp->s_id[NCPS]) {
			if ((c = *ptr++) != 0) {
				putc(c, mfp);
			} else {
				putc(' ', mfp);
			}
		}
		if (++i < nmsym)
			if (i % 4 != 0)
				fprintf(mfp, " | ");
	}
	putc('\n', mfp);
	free(p);
	slew(mfp);
}
#endif

#ifdef SDK
VOID lstareatosym(struct area *xp)
{
	/* Output the current area symbols to a NO$GMB .sym file */
	register struct areax *oxp;
	register int i, j;
	int nmsym;
	Addr_T a0, ai;
	struct sym *sp;
	struct sym **p;

	/*
	 * Find number of symbols in area
	 */
	nmsym = 0;
	oxp = xp->a_axp;
	while (oxp) {
		for (i=0; i<NHASH; i++) {
			sp = symhash[i];
			while (sp != NULL) {
				if (oxp == sp->s_axp)
					++nmsym;
				sp = sp->s_sp;
			}
		}
		oxp = oxp->a_axp;
	}

	/*
	 * Symbol Table Output
	 */
	if (!((xp->a_size==0)&&(xp->a_addr==0)&&(nmsym==0))) {
		/* Dont worry about any area information */
		fprintf(mfp, "; Area: %s\n", xp->a_id );
		if (nmsym>0) {
			/*
			 * Allocate space for an array of pointers to symbols
			 * and load array.
			 */
			if ( (p = (struct sym **) malloc(nmsym*sizeof(struct sym *)))
			    == NULL) {
				fprintf(mfp, "\nInsufficient space to build Map Segment.\n");
				return;
			}
			nmsym = 0;
			oxp = xp->a_axp;
			while (oxp) {
				for (i=0; i<NHASH; i++) {
					sp = symhash[i];
					while (sp != NULL) {
						if (oxp == sp->s_axp) {
							p[nmsym++] = sp;
						}
						sp = sp->s_sp;
					}
				}
				oxp = oxp->a_axp;
			}

			/*
			 * Bubble Sort of Addresses in Symbol Table Array
			 */
			j = 1;
			while (j) {
				j = 0;
				sp = p[0];
				a0 = sp->s_addr + sp->s_axp->a_addr;
				for (i=1; i<nmsym; ++i) {
					sp = p[i];
					ai = sp->s_addr + sp->s_axp->a_addr;
					if (a0 > ai) {
						j = 1;
						p[i] = p[i-1];
						p[i-1] = sp;
					}
					a0 = ai;
				}
			}
			i = 0;
			while (i < nmsym) {
			    	/* no$gmb requires the symbol names to be less than 32 chars long.  Truncate. */
			    	char name[32];
				strncpy(name, p[i]->s_id, 31);
				name[31] = '\0';
				if ((strncmp("l__", name, 3)!=0)&&(strchr(name,' ')==NULL)) {
					a0=p[i]->s_addr + p[i]->s_axp->a_addr;
					if (a0>0x7FFFU) {
						/* Not inside the ROM, so treat as being in bank zero */
						fprintf(mfp, "00:%04X %s\n", a0, name);
					}
					else {
						fprintf(mfp, "%02X:%04X %s\n", a0/16384, a0, name);
					}
				}
				i++;
			}
			free(p);
		}
	}
}
#endif

/*)Function	VOID	lkulist(i)
 *
 *		int	i	i # 0	process LST to RST file
 *				i = 0	copy remainder of LST file
 *					to RST file and close files
 *
 *	The function lkulist() creates a relocated listing (.rst)
 *	output file from the ASxxxx assembler listing (.lst)
 *	files.  The .lst file's program address and code bytes
 *	are changed to reflect the changes made by ASlink as
 *	the .rel files are combined into a single relocated
 *	output file.
 *
 *	local variables:
 *		Addr_T	pc		current program counter address
 *
 *	global variables:
 *		int	hilo		byte order
 *		int	gline		get a line from the LST file
 *					to translate for the RST file
 *		char	rb[]		read listing file text line
 *		FILE	*rfp		The file handle to the current
 *					output RST file
 *		int	rtcnt		count of data words
 *		int	rtflg[]		output the data flag
 *		Addr_T	rtval[]		relocated data
 *		FILE	*tfp		The file handle to the current
 *					LST file being scanned
 *
 *	functions called:
 *		int	fclose()	c_library
 *		int	fgets()		c_library
 *		int	fprintf()	c_library
 *		VOID	lkalist()	lklist.c
 *		VOID	lkglist()	lklist.c
 *
 *	side effects:
 *		A .rst file is created for each available .lst
 *		file associated with a .rel file.
 */

VOID
lkulist(i)
int i;
{
	Addr_T pc;

	/*
	 * Exit if listing file is not open
	 */
	if (tfp == NULL)
		return;

	/*
	 * Normal processing of LST to RST
	 */
	if (i) {
		/*
		 * Evaluate current code address
		 */
		if (hilo == 0) {
			pc = ((rtval[1] & 0xFF) << 8) + (rtval[0] & 0xFF);
		} else {
			pc = ((rtval[0] & 0xFF) << 8) + (rtval[1] & 0xFF);
		}

		/*
		 * Line with only address
		 */
		if (rtcnt == 2) {
			lkalist(pc);

		/*
		 * Line with address and code
		 */
		} else {
			for (i=2; i < rtcnt; i++) {
				if (rtflg[i]) {
					lkglist(pc++, rtval[i] & 0xFF);
				}
			}
		}

	/*
	 * Copy remainder of LST to RST
	 */
	} else {
		if (gline == 0)
			fprintf(rfp, rb);

		while (fgets(rb, sizeof(rb), tfp) != 0) {
			fprintf(rfp, rb);
		}
		fclose(tfp);
		tfp = NULL;
		fclose(rfp);
		rfp = NULL;
	}
}

/*)Function	VOID	lkalist(pc)
 *
 *		int	pc		current program counter value
 *
 *	The function lkalist() performs the following functions:
 *
 *	(1)	if the value of gline = 0 then the current listing
 *		file line is copied to the relocated listing file output.
 *
 *	(2)	the listing file is read line by line and copied to
 *		the relocated listing file until a valid source
 *		line number and a program counter value of the correct
 *		radix is found.  The new relocated pc value is substituted
 *		and the line is written to the RST file.
 *
 *	local variables:
 *		int	i		loop counter
 *		char	str[]		temporary string
 *
 *	global variables:
 *		int	gcntr		data byte counter
 *		int	gline		get a line from the LST file
 *					to translate for the RST file
 *		char	rb[]		read listing file text line
 *		char	*rp		pointer to listing file text line
 *		FILE	*rfp		The file handle to the current
 *					output RST file
 *		FILE	*tfp		The file handle to the current
 *					LST file being scanned
 *
 *	functions called:
 *		int	dgt()		lklist.c
 *		int	fclose()	c_library
 *		int	fgets()		c_library
 *		int	fprintf()	c_library
 *		int	sprintf()	c_library
 *		char *	strncpy()	c_library
 *
 *	side effects:
 *		Lines of the LST file are copied to the RST file,
 *		the last line copied has the code address
 *		updated to reflect the program relocation.
 */

VOID
lkalist(pc)
Addr_T pc;
{
	char str[8];
	int i;

	/*
	 * Exit if listing file is not open
	 */
loop:	if (tfp == NULL)
		return;

	/*
	 * Copy current LST to RST
	 */
	if (gline == 0) {
		fprintf(rfp, rb);
		gline = 1;
	}

	/*
	 * Clear text line buffer
	 */
	for (i=0,rp=rb; i<sizeof(rb); i++) {
		*rp++ = 0;
	}

	/*
	 * Get next LST text line
	 */
	if (fgets(rb, sizeof(rb), tfp) == NULL) {
		fclose(tfp);
		tfp = NULL;
		fclose(rfp);
		rfp = NULL;
		return;
	}

	/*
	 * Must have an ASxxxx Listing line number
	 */
	if (!dgt(RAD10, &rb[30], 1)) {
		fprintf(rfp, rb);
		goto loop;
	}

	/*
	 * Must have an address in the expected radix
	 */
	if (radix == 16) {
		if (!dgt(RAD16, &rb[3], 4)) {
			fprintf(rfp, rb);
			goto loop;
		}
		sprintf(str, "%04X", pc);
		strncpy(&rb[3], str, 4);
	} else
	if (radix == 10) {
		if (!dgt(RAD10, &rb[3], 5)) {
			fprintf(rfp, rb);
			goto loop;
		}
		sprintf(str, "%05d", pc);
		strncpy(&rb[3], str, 5);
	} else
	if (radix == 8) {
		if (!dgt(RAD8, &rb[3], 6)) {
			fprintf(rfp, rb);
			goto loop;
		}
		sprintf(str, "%06o", pc);
		strncpy(&rb[3], str, 6);
	}

	/*
	 * Copy updated LST text line to RST
	 */
	fprintf(rfp, rb);
	gcntr = 0;
}

/*)Function	VOID	lkglist(pc,v)
 *
 *		int	pc		current program counter value
 *		int 	v		value of byte at this address
 *
 *	The function lkglist() performs the following functions:
 *
 *	(1)	if the value of gline = 1 then the listing file
 *		is read line by line and copied to the
 *		relocated listing file until a valid source
 *		line number and a program counter value of the correct
 *		radix is found.
 *
 *	(2)	The new relocated values and code address are
 *		substituted and the line may be written to the RST file.
 *
 *	local variables:
 *		int	i		loop counter
 *		char	str[]		temporary string
 *
 *	global variables:
 *		int	gcntr		data byte counter
 *					set to -1 for a continuation line
 *		int	gline		get a line from the LST file
 *					to translate for the RST file
 *		char	rb[]		read listing file text line
 *		char	*rp		pointer to listing file text line
 *		FILE	*rfp		The file handle to the current
 *					output RST file
 *		FILE	*tfp		The file handle to the current
 *					LST file being scanned
 *
 *	functions called:
 *		int	dgt()		lklist.c
 *		int	fclose()	c_library
 *		int	fgets()		c_library
 *		int	fprintf()	c_library
 *		int	sprintf()	c_library
 *		char *	strncpy()	c_library
 *
 *	side effects:
 *		Lines of the LST file are copied to the RST file
 *		with updated data values and code addresses.
 */

VOID
lkglist(pc,v)
Addr_T pc;
int v;
{
	char str[8];
	int i;

	/*
	 * Exit if listing file is not open
	 */
loop:	if (tfp == NULL)
		return;

	/*
	 * Get next LST text line
	 */
	if (gline) {
		/*
		 * Clear text line buffer
		 */
		for (i=0,rp=rb; i<sizeof(rb); i++) {
			*rp++ = 0;
		}

		/*
		 * Get next LST text line
		 */
		if (fgets(rb, sizeof(rb), tfp) == NULL) {
			fclose(tfp);
			tfp = NULL;
			fclose(rfp);
			rfp = NULL;
			return;
		}

		/*
		 * Check for a listing line number if required
		 */
		if (gcntr != -1) {
			if (!dgt(RAD10, &rb[30], 1)) {
				fprintf(rfp, rb);
				goto loop;
			}
			gcntr = 0;
		}
		gline = 0;
	}

	/*
	 * Hex Listing
	 */
	if (radix == 16) {
		/*
		 * Data Byte Pointer
		 */
		if (gcntr == -1) {
			rp = &rb[8];
		} else {
			rp = &rb[8 + (3 * gcntr)];
		}
		/*
		 * Number must be of proper radix
		 */
		if (!dgt(RAD16, rp, 2)) {
			fprintf(rfp, rb);
			gline = 1;
			goto loop;
		}
		/*
		 * Output new data value, overwrite relocation codes
		 */
		sprintf(str, " %02X", v);
		strncpy(rp-1, str, 3);
		if (gcntr == -1) {
			gcntr = 0;
		}
		/*
		 * Output relocated code address
		 */
		if (gcntr == 0) {
			if (dgt(RAD16, &rb[3], 4)) {
				sprintf(str, "%04X", pc);
				strncpy(&rb[3], str, 4);
			}
		}
		/*
		 * Output text line when updates finished
		 */
		if (++gcntr == 6) {
			fprintf(rfp, rb);
			gline = 1;
			gcntr = -1;
		}
	} else
	/*
	 * Decimal Listing
	 */
	if (radix == 10) {
		/*
		 * Data Byte Pointer
		 */
		if (gcntr == -1) {
			rp = &rb[9];
		} else {
			rp = &rb[9 + (3 * gcntr)];
		}
		/*
		 * Number must be of proper radix
		 */
		if (!dgt(RAD10, rp, 3)) {
			fprintf(rfp, rb);
			gline = 1;
			goto loop;
		}
		/*
		 * Output new data value, overwrite relocation codes
		 */
		sprintf(str, " %03d", v);
		strncpy(rp-1, str, 4);
		if (gcntr == -1) {
			gcntr = 0;
		}
		/*
		 * Output relocated code address
		 */
		if (gcntr == 0) {
			if (dgt(RAD10, &rb[3], 5)) {
				sprintf(str, "%05d", pc);
				strncpy(&rb[3], str, 5);
			}
		}
		/*
		 * Output text line when updates finished
		 */
		if (++gcntr == 4) {
			fprintf(rfp, rb);
			gline = 1;
			gcntr = -1;
		}
	} else
	/*
	 * Octal Listing
	 */
	if (radix == 8) {
		/*
		 * Data Byte Pointer
		 */
		if (gcntr == -1) {
			rp = &rb[10];
		} else {
			rp = &rb[10 + (3 * gcntr)];
		}
		/*
		 * Number must be of proper radix
		 */
		if (!dgt(RAD8, rp, 3)) {
			fprintf(rfp, rb);
			gline = 1;
			goto loop;
		}
		/*
		 * Output new data value, overwrite relocation codes
		 */
		sprintf(str, " %03o", v);
		strncpy(rp-1, str, 4);
		if (gcntr == -1) {
			gcntr = 0;
		}
		/*
		 * Output relocated code address
		 */
		if (gcntr == 0) {
			if (dgt(RAD8, &rb[3], 6)) {
				sprintf(str, "%06o", pc);
				strncpy(&rb[3], str, 6);
			}
		}
		/*
		 * Output text line when updates finished
		 */
		if (++gcntr == 4) {
			fprintf(rfp, rb);
			gline = 1;
			gcntr = -1;
		}
	}
}

/*)Function	int	dgt(rdx,str,n)
 *
 *		int	rdx		radix bit code
 *		char	*str		pointer to the test string
 *		int	n		number of characters to check
 *
 *	The function dgt() verifies that the string under test
 *	is of the specified radix.
 *
 *	local variables:
 *		int	i		loop counter
 *
 *	global variables:
 *		ctype[]			array of character types
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		none
 */

int
dgt(rdx, str, n)
int rdx, n;
char *str;
{
	int i;

	for (i=0; i<n; i++) {
		if ((ctype[(unsigned char)(*str++)] & rdx) == 0)
			return(0);
	}
	return(1);
}
