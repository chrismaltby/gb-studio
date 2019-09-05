/* asmain.c */

/*
 * (C) Copyright 1989-1995
 * All Rights Reserved
 *
 * Alan R. Baldwin
 * 721 Berkeley St.
 * Kent, Ohio  44240
 *
 * 29-Oct-97 JLH pass ";!" comments to output file
 */

#include <stdlib.h>
#include <stdio.h>
#include <setjmp.h>
#include <string.h>

#include "asm.h"

/*)Module	asmain.c
 *
 *	The module asmain.c includes the command argument parser,
 *	the three pass sequencer, and the machine independent
 *	assembler parsing code.
 *
 *	asmain.c contains the following functions:
 *		VOID	main(argc, argv)
 *		VOID	asexit()
 *		VOID	asmbl()
 *		FILE *	afile(fn, ft, wf)
 *		VOID	newdot(nap)
 *		VOID	phase(ap, a)
 *		VOID	usage()
 *
 *	asmain.c contains the array char *usetxt[] which
 *	references the usage text strings printed by usage().
 */

/*)Function	VOID	main(argc, argv)
 *
 *		int	argc		argument count
 *		char *	argv		array of pointers to argument strings
 *
 *	The function main() is the entry point to the assembler.
 *	The purpose of main() is to (1) parse the command line
 *	arguments for options and source file specifications and
 *	(2) to process the source files through the 3 pass assembler.
 *	Before each assembler pass various variables are initialized
 *	and source files are rewound to their beginning.  During each
 *	assembler pass each assembler-source text line is processed.
 *	After each assembler pass the assembler information is flushed
 *	to any opened output files and the if-else-endif processing
 *	is checked for proper termination.
 *
 *	The function main() is also responsible for opening all
 *	output files (REL, LST, and SYM), sequencing the global (-g)
 *	and all-global (-a) variable definitions, and dumping the
 *	REL file header information.
 *
 *	local variables:
 *		char *	p		pointer to argument string
 *		int	c		character from argument string
 *		int	i		argument loop counter
 *		area *	ap		pointer to area structure
 *
 *	global variables:
 *		int	aflag		-a, make all symbols global flag
 *		char	afn[]		afile() constructed filespec
 *		area *	areap		pointer to an area structure
 *		int	cb[]		array of assembler output values
 *		int	cbt[]		array of assembler relocation types
 *					describing the data in cb[]
 *		int	cfile		current file handle index
 *					of input assembly files
 *		int *	cp		pointer to assembler output array cb[]
 *		int *	cpt		pointer to assembler relocation type
 *					output array cbt[]
 *		char	eb[]		array of generated error codes
 *		char *	ep		pointer into error list array eb[]
 *		int	fflag		-f(f), relocations flagged flag
 *		int	flevel		IF-ELSE-ENDIF flag will be non
 *					zero for false conditional case
 *		Addr_T	fuzz		tracks pass to pass changes in the
 *					address of symbols caused by
 *					variable length instruction formats
 *		int	gflag		-g, make undefined symbols global flag
 *		char	ib[]		assembler-source text line
 *		int	inpfil		count of assembler
 *					input files specified
 *		int	ifcnd[]		array of IF statement condition
 *					values (0 = FALSE) indexed by tlevel
 *		int	iflvl[]		array of IF-ELSE-ENDIF flevel
 *					values indexed by tlevel
 *		int	incfil		current file handle index
 *					for include files
 *		char *	ip		pointer into the assembler-source
 *					text line in ib[]
 *		jmp_buf	jump_env	compiler dependent structure
 *					used by setjmp() and longjmp()
 *		int	lflag		-l, generate listing flag
 *		int	line		current assembler source
 *					line number
 *		int	lop		current line number on page
 *		int	oflag		-o, generate relocatable output flag
 *		int	jflag		-j, generate debug info flag
 *		int	page		current page number
 *		int	pflag		enable listing pagination
 *		int	pass		assembler pass number
 *		int	radix		current number conversion radix:
 *					2 (binary), 8 (octal), 10 (decimal),
 *					16 (hexadecimal)
 *		int	sflag		-s, generate symbol table flag
 *		char	srcfn[][]	array of source file names
 *		int	srcline[]	current source file line
 *		char	stb[]		Subtitle string buffer
 *		sym *	symp		pointer to a symbol structure
 *		int	tlevel		current conditional level
 *		int	xflag		-x, listing radix flag
 *		FILE *	lfp		list output file handle
 *		FILE *	ofp		relocation output file handle
 *		FILE *	tfp		symbol table output file handle
 *		FILE *	sfp[]		array of assembler-source file handles
 *
 *	called functions:
 *		FILE *	afile()		asmain.c
 *		VOID	allglob()	assym.c
 *		VOID	asexit()	asmain.c
 *		VOID	diag()		assubr.c
 *		VOID	err()		assubr.c
 *		int	fprintf()	c-library
 *		int	getline()	aslex.c
 *		VOID	list()		aslist.c
 *		VOID	lstsym()	aslist.c
 *		VOID	minit()		___mch.c
 *		VOID	newdot()	asmain.c
 *		VOID	outchk()	asout.c
 *		VOID	outgsd()	asout.c
 *		int	rewind()	c-library
 *		int	setjmp()	c-library
 *		VOID	symglob()	assym.c
 *		VOID	syminit()	assym.c
 *		VOID	usage()		asmain.c
 *
 *	side effects:
 *		Completion of main() completes the assembly process.
 *		REL, LST, and/or SYM files may be generated.
 */

int fatalErrors=0;
char relFile[128];

int
main(argc, argv)
char *argv[];
{
	register char *p;
	register int c, i;
	struct area *ap;

	/*fprintf(stdout, "\n");*/
	inpfil = -1;
	pflag = 1;
	for (i=1; i<argc; ++i) {
		p = argv[i];
		if (*p == '-') {
			if (inpfil >= 0)
				usage();
			++p;
			while ((c = *p++) != 0)
				switch(c) {

				case 'a':
				case 'A':
					++aflag;
					break;

				case 'c':
				case 'C':
				    ++cflag;
				    break;

				case 'g':
				case 'G':
					++gflag;
					break;

				case 'j':		/* JLH: debug info */
				case 'J':
					++jflag;
					++oflag;	/* force object */
					break;

				case 'l':
				case 'L':
					++lflag;
					break;

				case 'o':
				case 'O':
					++oflag;
					break;

				case 's':
				case 'S':
					++sflag;
					break;

				case 'p':
				case 'P':
					pflag = 0;
					break;

				case 'x':
				case 'X':
					xflag = 0;
					break;

				case 'q':
				case 'Q':
					xflag = 1;
					break;

				case 'd':
				case 'D':
					xflag = 2;
					break;

				case 'f':
				case 'F':
					++fflag;
					break;

				default:
					usage();
				}
		} else {
			if (++inpfil == MAXFIL) {
				fprintf(stderr, "too many input files\n");
				asexit(1);
			}
			sfp[inpfil] = afile(p, "", 0);
			strcpy(srcfn[inpfil],afn);
			if (inpfil == 0) {
				if (lflag)
					lfp = afile(p, "lst", 1);
				if (oflag) {
				  ofp = afile(p, "rel", 1);
				  // save the file name if we have to delete it on error
				  strcpy(relFile,afn);
				}
				if (sflag)
					tfp = afile(p, "sym", 1);
			}
		}
	}
	if (inpfil < 0)
		usage();
	syminit();
	for (pass=0; pass<3; ++pass) {
		if (gflag && pass == 1)
			symglob();
		if (aflag && pass == 1)
			allglob();
		if (oflag && pass == 2)
			outgsd();
		flevel = 0;
		tlevel = 0;
		ifcnd[0] = 0;
		iflvl[0] = 0;
		radix = 10;
		srcline[0] = 0;
		page = 0;
		stb[0] = 0;
		lop  = NLPP;
		cfile = 0;
		incfil = -1;
		for (i = 0; i <= inpfil; i++)
			rewind(sfp[i]);
		ap = areap;
		while (ap) {
			ap->a_fuzz = 0;
			ap->a_size = 0;
			ap = ap->a_ap;
		}
		fuzz = 0;
		dot.s_addr = 0;
		dot.s_area = &dca;
		symp = &dot;
		minit();
		while (getline(NULL, NULL, NULL)) {
			cp = cb;
			cpt = cbt;
			ep = eb;
			ip = ib;

                        /* JLH: if line begins with ";!", then
                         * pass this comment on to the output file
                         */
                        if (oflag && (pass == 1) &&
                            (ip[0] == ';') && (ip[1] == '!'))
                        {
                        	fprintf(ofp, "%s\n", ip );
                        }
                        
			if (setjmp(jump_env) == 0)
				asmbl();

			if (pass == 2) {
				diag();
				list();
			}
		}
		newdot(dot.s_area); /* Flush area info */
		if (flevel || tlevel)
			err('i');
	}
	if (oflag)
		outchk(HUGE, HUGE);  /* Flush */
	if (sflag) {
		lstsym(tfp);
	} else
	if (lflag) {
		lstsym(lfp);
	}
	//printf ("aserr: %d\n", aserr);
	//printf ("fatalErrors: %d\n", fatalErrors);
	asexit(fatalErrors);
	return 0; // hush the compiler
}

/*)Function	VOID	asexit(i)
 *
 *			int	i	exit code
 *
 *	The function asexit() explicitly closes all open
 *	files and then terminates the program.
 *
 *	local variables:
 *		int	j		loop counter
 *
 *	global variables:
 *		FILE *	ifp[]		array of include-file file handles
 *		FILE *	lfp		list output file handle
 *		FILE *	ofp		relocation output file handle
 *		FILE *	tfp		symbol table output file handle
 *		FILE *	sfp[]		array of assembler-source file handles
 *
 *	functions called:
 *		int	fclose()	c-library
 *		VOID	exit()		c-library
 *
 *	side effects:
 *		All files closed. Program terminates.
 */

VOID
asexit(i)
int i;
{
	int j;

	if (lfp != NULL) fclose(lfp);
	if (ofp != NULL) fclose(ofp);
	if (tfp != NULL) fclose(tfp);

	for (j=0; j<MAXFIL && sfp[j] != NULL; j++) {
		fclose(sfp[j]);
	}

	/*for (j=0; j<MAXINC && ifp[j] != NULL; j++) {
		fclose(ifp[j]);
		}*/
	if (i) {
	  // remove output file
	  printf ("removing %s\n", relFile);
	  unlink(relFile);
	}
	exit(i);
}

/*)Function	VOID	asmbl()
 *
 *	The function asmbl() scans the assembler-source text for
 *	(1) labels, global labels, equates, global equates, and local
 *	symbols, (2) .if, .else, .endif, and .page directives,
 *	(3) machine independent assembler directives, and (4) machine
 *	dependent mnemonics.
 *
 *	local variables:
 *		mne *	mp		pointer to a mne structure
 *		sym *	sp		pointer to a sym structure
 *		tsym *	tp		pointer to a tsym structure
 *		int	c		character from assembler-source
 *					text line
 *		area *	ap		pointer to an area structure
 *		expr	e1		expression structure
 *		char	id[]		id string
 *		char	opt[]		options string
 *		char	fn[]		filename string
 *		char *	p		pointer into a string
 *		int	d		temporary value
 *		int	n		temporary value
 *		int	uaf		user area options flag
 *		int	uf		area options
 *
 *	global variables:
 *		area *	areap		pointer to an area structure
 *		char	ctype[]		array of character types, one per
 *					ASCII character
 *		int	flevel		IF-ELSE-ENDIF flag will be non
 *					zero for false conditional case
 *		Addr_T	fuzz		tracks pass to pass changes in the
 *					address of symbols caused by
 *					variable length instruction formats
 *		int	ifcnd[]		array of IF statement condition
 *					values (0 = FALSE) indexed by tlevel
 *		int	iflvl[]		array of IF-ELSE-ENDIF flevel
 *					values indexed by tlevel
 *		FILE *	ifp[]		array of include-file file handles
 *		char	incfn[][]	array of include file names
 *		int	incline[]	current include file line
 *		int	incfil		current file handle index
 *					for include files
 *		Addr_T	laddr		address of current assembler line
 *					or value of .if argument
 *		int	lmode		listing mode
 *		int	lop		current line number on page
 *		char	module[]	module name string
 *		int	pass		assembler pass number
 *		int	radix		current number conversion radix:
 *					2 (binary), 8 (octal), 10 (decimal),
 *					16 (hexadecimal)
 *		char	stb[]		Subtitle string buffer
 *		sym *	symp		pointer to a symbol structure
 *		char	tb[]		Title string buffer
 *		int	tlevel		current conditional level
 *
 *	functions called:
 *		Addr_T	absexpr()	asexpr.c
 *		area *	alookup()	assym.c
 *		VOID	clrexpr()	asexpr.c
 *		int	digit()		asexpr.c
 *		char	endline()	aslex.c
 *		VOID	err()		assubr.c
 *		VOID	expr()		asexpr.c
 *		FILE *	fopen()		c-library
 *		char	get()		aslex.c
 *		VOID	getid()		aslex.c
 *		int	getmap()	aslex.c
 *		char	getnb()		aslex.c
 *		VOID	getst()		aslex.c
 *		sym *	lookup()	assym.c
 *		VOID	machine()	___mch.c
 *		mne *	mlookup()	assym.c
 *		int	more()		aslex.c
 *		VOID *	new()		assym.c
 *		VOID	newdot()	asmain.c
 *		VOID	outall()	asout.c
 *		VOID	outab()		asout.c
 *		VOID	outchk()	asout.c
 *		VOID	outrb()		asout.c
 *		VOID	outrw()		asout.c
 *		VOID	phase()		asmain.c
 *		VOID	qerr()		assubr.c
 *		char *	strcpy()	c-library
 *		char *	strncpy()	c-library
 *		VOID	unget()		aslex.c
 */

VOID
asmbl()
{
	register struct mne *mp;
	register struct sym *sp;
	register struct tsym *tp;
	register int c;
	struct area  *ap;
	struct expr e1;
	char id[NCPS];
	char opt[NCPS];
	char fn[PATH_MAX];
	char *p;
	int d, n, uaf, uf;

	laddr = dot.s_addr;
	lmode = SLIST;
loop:
	if ((c=endline()) == 0) { return; }
	/*
	 * If the first character is a digit then assume
	 * a local symbol is being specified.  The symbol
	 * must end with $: to be valid.
	 *	pass 0:
	 *		Construct a tsym structure at the first
	 *		occurance of the symbol.  Flag the symbol
	 *		as multiply defined if not the first occurance.
	 *	pass 1:
	 *		Load area, address, and fuzz values
	 *		into structure tsym.
	 *	pass 2:
	 *		Check for assembler phase error and
	 *		multiply defined error.
	 */
	if (ctype[c] & DIGIT) {
		if (flevel)
			return;
		n = 0;
		while ((d = digit(c, 10)) >= 0) {
			n = 10*n + d;
			c = get();
		}
		if (c != '$' || get() != ':')
			qerr();
		tp = symp->s_tsym;
		if (pass == 0) {
			while (tp) {
				if (n == tp->t_num) {
					tp->t_flg |= S_MDF;
					break;
				}
				tp = tp->t_lnk;
			}
			if (tp == NULL) {
				tp=(struct tsym *) new (sizeof(struct tsym));
				tp->t_lnk = symp->s_tsym;
				tp->t_num = n;
				tp->t_flg = 0;
				tp->t_area = dot.s_area;
				tp->t_addr = dot.s_addr;
				symp->s_tsym = tp;
			}
		} else {
			while (tp) {
				if (n == tp->t_num) {
					break;
				}
				tp = tp->t_lnk;
			}
			if (tp) {
				if (pass == 1) {
					fuzz = tp->t_addr - dot.s_addr;
					tp->t_area = dot.s_area;
					tp->t_addr = dot.s_addr;
				} else {
					phase(tp->t_area, tp->t_addr);
					if (tp->t_flg & S_MDF)
						err('m');
				}
			} else {
				err('u');
			}
		}
		lmode = ALIST;
		goto loop;
	}
	/*
	 * If the first character is a letter then assume a lable,
	 * symbol, assembler directive, or assembler mnemonic is
	 * being processed.
	 */
	if ((ctype[c] & LETTER) == 0) {
		if (flevel) {
			return;
		} else {
			qerr();
		}
	}
	getid(id, c);
	c = getnb();
	/*
	 * If the next character is a : then a label is being processed.
	 * A double :: defines a global label.  If this is new label
	 * then create a symbol structure.
	 *	pass 0:
	 *		Flag multiply defined labels.
	 *	pass 1:
	 *		Load area, address, and fuzz values
	 *		into structure symp.
	 *	pass 2:
	 *		Check for assembler phase error and
	 *		multiply defined error.
	 */
	if (c == ':') {
		if (flevel)
			return;
		if ((c = get()) != ':') {
			unget(c);
			c = 0;
		}
		symp = lookup(id);
		if (symp == &dot)
			err('.');
		if (pass == 0)
			if ((symp->s_type != S_NEW) &&
			   ((symp->s_flag & S_ASG) == 0))
				symp->s_flag |= S_MDF;
		if (pass != 2) {
			fuzz = symp->s_addr - dot.s_addr;
			symp->s_type = S_USER;
			symp->s_area = dot.s_area;
			symp->s_addr = dot.s_addr;
		} else {
			if (symp->s_flag & S_MDF)
				err('m');
			phase(symp->s_area, symp->s_addr);
		}
		if (c) {
			symp->s_flag |= S_GBL;
		}
		lmode = ALIST;
		goto loop;
	}
	/*
	 * If the next character is a = then an equate is being processed.
	 * A double == defines a global equate.  If this is new variable
	 * then create a symbol structure.
	 */
	if (c == '=') {
		if (flevel)
			return;
		if ((c = get()) != '=') {
			unget(c);
			c = 0;
		}
		clrexpr(&e1);
		expr(&e1, 0);
		sp = lookup(id);
		if (sp == &dot) {
			outall();
			if (e1.e_flag || e1.e_base.e_ap != dot.s_area)
				err('.');
		} else
		if (sp->s_type != S_NEW && (sp->s_flag & S_ASG) == 0) {
			err('m');
		}
		sp->s_type = S_USER;
		sp->s_area = e1.e_base.e_ap;
		sp->s_addr = laddr = e1.e_addr;
		sp->s_flag |= S_ASG;
		if (c) {
			sp->s_flag |= S_GBL;
		}
		lmode = ELIST;
		goto loop;
	}
	unget(c);
	lmode = flevel ? SLIST : CLIST;
	if ((mp = mlookup(id)) == NULL) {
		if (!flevel)
			err('o');
		return;
	}
	/*
	 * If we have gotten this far then we have found an
	 * assembler directive or an assembler mnemonic.
	 *
	 * Check for .if, .else, .endif, and .page directives
	 * which are not controlled by the conditional flags
	 */
	switch (mp->m_type) {

	case S_IF:
		n = absexpr();
		if (tlevel < MAXIF) {
			++tlevel;
			ifcnd[tlevel] = n;
			iflvl[tlevel] = flevel;
			if (n == 0) {
				++flevel;
			}
		} else {
			err('i');
		}
		lmode = ELIST;
		laddr = n;
		return;

	case S_ELSE:
		if (ifcnd[tlevel]) {
			if (++flevel > (iflvl[tlevel]+1)) {
				err('i');
			}
		} else {
			if (--flevel < iflvl[tlevel]) {
				err('i');
			}
		}
		lmode = SLIST;
		return;

	case S_ENDIF:
		if (tlevel) {
			flevel = iflvl[tlevel--];
		} else {
			err('i');
		}
		lmode = SLIST;
		return;

	case S_PAGE:
		lop = NLPP;
		lmode = NLIST;
		return;

	default:
		break;
	}
	if (flevel)
		return;
	/*
	 * If we are not in a false state for .if/.else then
	 * process the assembler directives here.
	 */
	switch (mp->m_type) {

	case S_EVEN:
		outall();
		laddr = dot.s_addr = (dot.s_addr + 1) & ~1;
		lmode = ALIST;
		break;

	case S_ODD:
		outall();
		laddr = dot.s_addr |= 1;
		lmode = ALIST;
		break;

	case S_BYTE:
	case S_WORD:
		do {
			clrexpr(&e1);
			expr(&e1, 0);
			if (mp->m_type == S_BYTE) {
				outrb(&e1, R_NORM);
			} else {
				outrw(&e1, R_NORM);
			}
		} while ((c = getnb()) == ',');
		unget(c);
		break;

	case S_ASCII:
	case S_ASCIZ:
		if ((d = getnb()) == '\0')
			qerr();
		while ((c = getmap(d)) >= 0)
			outab(c);
		if (mp->m_type == S_ASCIZ)
			outab(0);
		break;

	case S_ASCIS:
		if ((d = getnb()) == '\0')
			qerr();
		c = getmap(d);
		while (c >= 0) {
			if ((n = getmap(d)) >= 0) {
				outab(c);
			} else {
				outab(c | 0x80);
			}
			c = n;
		}
		break;

	case S_BLK:
		clrexpr(&e1);
		expr(&e1, 0);
		outchk(HUGE,HUGE);
		dot.s_addr += e1.e_addr*mp->m_valu;
		lmode = BLIST;
		break;

	case S_TITLE:
		p = tb;
		if ((c = getnb()) != 0) {
			do {
				if (p < &tb[NTITL-1])
					*p++ = c;
			} while ((c = get()) != 0);
		}
		*p = 0;
		unget(c);
		lmode = SLIST;
		break;

	case S_SBTL:
		p = stb;
		if ((c = getnb()) != 0) {
			do {
				if (p < &stb[NSBTL-1])
					*p++ = c;
			} while ((c = get()) != 0);
		}
		*p = 0;
		unget(c);
		lmode = SLIST;
		break;

	case S_MODUL:
		getst(id, -1);
		if (pass == 0) {
			if (module[0]) {
				err('m');
			} else {
				strncpy(module, id, NCPS);
			}
		}
		lmode = SLIST;
		break;

	case S_GLOBL:
		do {
			getid(id, -1);
			sp = lookup(id);
			sp->s_flag |= S_GBL;
		} while ((c = getnb()) == ',');
		unget(c);
		lmode = SLIST;
		break;

	case S_DAREA:
	        getid(id, -1);
		uaf = 0;
		uf  = A_CON|A_REL;
		if ((c = getnb()) == '(') {
			do {
				getid(opt, -1);
				mp = mlookup(opt);
				if (mp && mp->m_type == S_ATYP) {
					++uaf;
					uf |= mp->m_valu;
				} else {
					err('u');
				}
			} while ((c = getnb()) == ',');
			if (c != ')')
				qerr();
		} else {
			unget(c);
		}
		if ((ap = alookup(id)) != NULL) {
			if (uaf && uf != ap->a_flag)
				err('m');
                        if (ap->a_flag & A_OVR) {
				ap->a_size = 0; 
                                ap->a_fuzz=0;
			}
		} else {
			ap = (struct area *) new (sizeof(struct area));
			ap->a_ap = areap;
			strncpy(ap->a_id, id, NCPS);
			ap->a_ref = areap->a_ref + 1;
			ap->a_size = 0;
			ap->a_fuzz = 0;
			ap->a_flag = uaf ? uf : (A_CON|A_REL);
			areap = ap;
		}
		newdot(ap);
		lmode = SLIST;
		break;

	case S_ORG:
		if (dot.s_area->a_flag & A_ABS) {
			outall();
			laddr = dot.s_addr = absexpr();
		} else {
			err('o');
		}
		outall();
		lmode = ALIST;
		break;

	case S_RADIX:
		if (more()) {
			switch (getnb()) {
			case 'b':
			case 'B':
				radix = 2;
				break;
			case '@':
			case 'o':
			case 'O':
			case 'q':
			case 'Q':
				radix = 8;
				break;
			case 'd':
			case 'D':
				radix = 10;
				break;
			case 'h':
			case 'H':
			case 'x':
			case 'X':
				radix = 16;
				break;
			default:
				radix = 10;
				qerr();
				break;
			}
		} else {
			radix = 10;
		}
		lmode = SLIST;
		break;

	case S_INCL:
		d = getnb();
		p = fn;
		while ((c = get()) != d) {
			if (p < &fn[PATH_MAX-1]) {
				*p++ = c;
			} else {
				break;
			}
		}
		*p = 0;
		if (++incfil == MAXINC ||
		   (ifp[incfil] = fopen(fn, "r")) == NULL) {
			--incfil;
			err('i');
		} else {
			lop = NLPP;
			incline[incfil] = 0;
			strcpy(incfn[incfil],fn);
		}
		lmode = SLIST;
		break;
		
	case S_FLAT24:
		if (more())
		{
		    getst(id, -1);
		    
		    if (!strcmpi(id, "on"))
		    {
		    	/* Quick sanity check: size of 
		    	 * Addr_T must be at least 24 bits.
		    	 */
		    	if (sizeof(Addr_T) < 3)
		    	{
		    	    warnBanner();
		    	    fprintf(stderr,
		    	    	    "Cannot enable Flat24 mode: "
		    	    	    "host system must have 24 bit "
		    	    	    "or greater integers.\n");
		    	}
		    	else
		    	{
		    	    flat24Mode = 1;
		    	}
		    }
		    else if (!strcmpi(id, "off"))
		    {
		        flat24Mode = 0;
		    }
		    else
		    {
		        qerr();
		    }
		}
		else
		{
		    qerr();
		}
	        lmode = SLIST;
	        #if 0
	        printf("as8051: ds390 flat mode %sabled.\n",
	        	flat24Mode ? "en" : "dis");
	        #endif
	        break;
	                                                                

	/*
	 * If not an assembler directive then go to
	 * the machine dependent function which handles
	 * all the assembler mnemonics.
	 */
	default:
		machine(mp);
		/* if cdb information the generate the line info */
		if (cflag && (pass == 1))
		    DefineCDB_Line();

                /* JLH: if -j, generate a line number symbol */
                if (jflag && (pass == 1))
                {
                   DefineNoICE_Line();
                }

	}
	goto loop;
}

/*)Function	FILE *	afile(fn, ft, wf)
 *
 *		char *	fn		file specification string
 *		char *	ft		file type string
 *		int	wf		read(0)/write(1) flag
 *
 *	The function afile() opens a file for reading or writing.
 *		(1)	If the file type specification string ft
 *			is not NULL then a file specification is
 *			constructed with the file path\name in fn
 *			and the extension in ft.
 *		(2)	If the file type specification string ft
 *			is NULL then the file specification is
 *			constructed from fn.  If fn does not have
 *			a file type then the default source file
 *			type dsft is appended to the file specification.
 *
 *	afile() returns a file handle for the opened file or aborts
 *	the assembler on an open error.
 *
 *	local variables:
 *		int	c		character value
 *		FILE *	fp		filehandle for opened file
 *		char *	p1		pointer to filespec string fn
 *		char *	p2		pointer to filespec string fb
 *		char *	p3		pointer to filetype string ft
 *
 *	global variables:
 *		char	afn[]		afile() constructed filespec
 *		char	dsft[]		default assembler file type string
 *		char	afn[]		constructed file specification string
 *
 *	functions called:
 *		VOID	asexit()	asmain.c
 *		FILE *	fopen()		c_library
 *		int	fprintf()	c_library
 *
 *	side effects:
 *		File is opened for read or write.
 */

FILE *
afile(fn, ft, wf)
char *fn;
char *ft;
int wf;
{
	register char *p2, *p3;
	register int c;
	FILE *fp;

	p2 = afn;
	p3 = ft;

	strcpy (afn, fn);
	p2 = strrchr (afn, FSEPX);		// search last '.'
	if (!p2)
		p2 = afn + strlen (afn);
	if (p2 > &afn[PATH_MAX-4])		// truncate filename, if it's too long
		p2 = &afn[PATH_MAX-4];
	*p2++ = FSEPX;

	// choose a file-extension
	if (*p3 == 0) {					// extension supplied?
		p3 = strrchr (fn, FSEPX);	// no: extension in fn?
		if (p3)
			++p3;
		else
			p3 = dsft;					// no: default extension
	}

	while ((c = *p3++) != 0) {		// strncpy
		if (p2 < &afn[PATH_MAX-1])
			*p2++ = c;
	}
	*p2++ = 0;

	if ((fp = fopen(afn, wf?"w":"r")) == NULL) {
		fprintf(stderr, "%s: cannot %s.\n", afn, wf?"create":"open");
		asexit(1);
	}
	return (fp);
}

/*)Function	VOID	newdot(nap)
 *
 *		area *	nap		pointer to the new area structure
 *
 *	The function newdot():
 *		(1)	copies the current values of fuzz and the last
 *			address into the current area referenced by dot
 *		(2)	loads dot with the pointer to the new area and
 *			loads the fuzz and last address parameters
 *		(3)	outall() is called to flush any remaining
 *			bufferred code from the old area to the output
 *
 *	local variables:
 *		area *	oap		pointer to old area
 *
 *	global variables:
 *		sym	dot		defined as sym[0]
 *		Addr_T	fuzz		tracks pass to pass changes in the
 *					address of symbols caused by
 *					variable length instruction formats
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		Current area saved, new area loaded, buffers flushed.
 */

VOID
newdot(nap)
register struct area *nap;
{
	register struct area *oap;

	oap = dot.s_area;
	oap->a_fuzz = fuzz;
	oap->a_size = dot.s_addr;
	fuzz = nap->a_fuzz;
	dot.s_area = nap;
	dot.s_addr = nap->a_size;
	outall();
}

/*)Function	VOID	phase(ap, a)
 *
 *		area *	ap		pointer to area
 *		Addr_T	a		address in area
 *
 *	Function phase() compares the area ap and address a
 *	with the current area dot.s_area and address dot.s_addr
 *	to determine if the position of the symbol has changed
 *	between assembler passes.
 *
 *	local variables:
 *		none
 *
 *	global varaibles:
 *		sym *	dot		defined as sym[0]
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		The p error is invoked if the area and/or address
 *		has changed.
 */

VOID
phase(ap, a)
struct area *ap;
Addr_T a;
{
	if (ap != dot.s_area || a != dot.s_addr)
		err('p');
}

char *usetxt[] = {
	"Usage: [-dqxjgalopsf] file1 [file2 file3 ...]",
	"  d    decimal listing",
	"  q    octal   listing",
	"  x    hex     listing (default)",
	"  j    add line number and debug information to file", /* JLH */
	"  g    undefined symbols made global",
	"  a    all user symbols made global",
	"  l    create list   output file1[LST]",
	"  o    create object output file1[REL]",
	"  s    create symbol output file1[SYM]",
	"  p    disable listing pagination",
	"  f    flag relocatable references by `    in listing file",
	" ff    flag relocatable references by mode in listing file",
	"",
	0
};

/*)Function	VOID	usage()
 *
 *	The function usage() outputs to the stderr device the
 *	assembler name and version and a list of valid assembler options.
 *
 *	local variables:
 *		char **	dp		pointer to an array of
 *					text string pointers.
 *
 *	global variables:
 *		char	cpu[]		assembler type string
 *		char *	usetxt[]	array of string pointers
 *
 *	functions called:
 *		VOID	asexit()	asmain.c
 *		int	fprintf()	c_library
 *
 *	side effects:
 *		program is terminated
 */

VOID
usage()
{
	register char   **dp;

	fprintf(stderr, "\nASxxxx Assembler %s  (%s)\n\n", VERSION, cpu);
	for (dp = usetxt; *dp; dp++)
		fprintf(stderr, "%s\n", *dp);
	asexit(1);       
}
