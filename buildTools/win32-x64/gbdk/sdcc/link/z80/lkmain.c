/* lkmain.c */
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
#include <string.h>
//#include <alloc.h>
#include "aslink.h"
#include <stdlib.h>

#ifndef SDK_VERSION_STRING
#define SDK_VERSION_STRING 	"3.0.0"
#endif
#ifndef TARGET_STRING
#define TARGET_STRING		"gbz80"
#endif

/*)Module	lkmain.c
 *
 *	The module lkmain.c contains the functions which
 *	(1) input the linker options, parameters, and specifications
 *	(2) perform a two pass link
 *	(3) produce the appropriate linked data output and/or
 *	    link map file and/or relocated listing files.
 *
 *	lkmain.c contains the following functions:
 *		FILE *	afile(fn,ft,wf)
 *		VOID	bassav()
 *		VOID	gblsav()
 *		VOID	link()
 *		VOID	lkexit()
 *		VOID	main(argc,argv)
 *		VOID	map()
 *		int	parse()
 *		VOID	setbas()
 *		VOID	setgbl()
 *		VOID	usage()
 *
 *	lkmain.c contains the following local variables:
 *		char *	usetext[]	array of pointers to the
 *					command option tect lines
 *
 */

/*)Function	VOID	main(argc,argv)
 *
 *		int	argc		number of command line arguments + 1
 *		char *	argv[]		array of pointers to the command line
 *					arguments
 *
 *	The function main() evaluates the command line arguments to
 *	determine if the linker parameters are to input through 'stdin'
 *	or read from a command file.  The functiond getline() and parse()
 *	are to input and evaluate the linker parameters.  The linking process
 *	proceeds by making the first pass through each .rel file in the order
 *	presented to the linker.  At the end of the first pass the setbase(),
 *	lnkarea(), setgbl(), and symdef() functions are called to evaluate
 *	the base address terms, link all areas, define global variables,
 *	and look for undefined symbols.  Following these routines a linker
 *	map file may be produced and the linker output files may be opened.
 *	The second pass through the .rel files will output the linked data
 *	in one of the four supported formats.
 *
 *	local variables:
 *		char *	p		pointer to an argument string
 *		int	c		character from argument string
 *		int	i		loop counter
 *
 *	global variables:
 *				 	text line in ib[]
 *		lfile	*cfp		The pointer *cfp points to the
 *				 	current lfile structure
 *		char	ctype[]		array of character types, one per
 *				 	ASCII character
 *		lfile	*filep	 	The pointer *filep points to the
 *				 	beginning of a linked list of
 *				 	lfile structures.
 *		head	*hp		Pointer to the current
 *				 	head structure
 *		char	ib[NINPUT]	.rel file text line
 *		char	*ip		pointer into the .rel file
 *		lfile	*linkp		pointer to first lfile structure
 *				 	containing an input .rel file
 *				 	specification
 *		int	lkerr		error flag
 *		int	mflag		Map output flag
 *		int	oflag		Output file type flag
 *		FILE	*ofp		Output file handle
 *				 	for word formats
 *		FILE	*ofph		Output file handle
 *				 	for high byte format
 *		FILE	*ofpl		Output file handle
 *				 	for low byte format
 *		int	pass		linker pass number
 *		int	pflag		print linker command file flag
 *		int	radix		current number conversion radix
 *		FILE	*sfp		The file handle sfp points to the
 *				 	currently open file
 *		lfile	*startp		asmlnk startup file structure
 *		FILE *	stdin		c_library
 *		FILE *	stdout		c_library
 *
 *	functions called:
 *		FILE *	afile()		lkmain.c
 *		int	fclose()	c_library
 *		int	fprintf()	c_library
 *		int	getline()	lklex.c
 *		VOID	library()	lklibr.c
 *		VOID	link()		lkmain.c
 *		VOID	lkexit()	lkmain.c
 *		VOID	lnkarea()	lkarea.c
 *		VOID	map()		lkmain.c
 *		VOID	new()		lksym.c
 *		int	parse()		lkmain.c
 *		VOID	reloc()		lkreloc.c
 *		VOID	search()	lklibr.c
 *		VOID	setbas()	lkmain.c
 *		VOID	setgbl()	lkmain.c
 *		VOID	symdef()	lksym.c
 *		VOID	usage()		lkmain.c
 *
 *	side effects:
 *		Completion of main() completes the linking process
 *		and may produce a map file (.map) and/or a linked
 *		data files (.ihx or .s19) and/or one or more
 *		relocated listing files (.rst).
 */

#ifdef SDK
int binary = 0;
#endif /* SDK */
#ifdef GAMEBOY
char *default_basep[] = {
  "_CODE=0x0200",
  "_DATA=0xC0A0",
  NULL
};

char *default_globlp[] = {
  /* DMA transfer must start at multiples of 0x100 */
  ".OAM=0xC000",
  ".STACK=0xE000",
  ".refresh_OAM=0xFF80",

  ".init=0x0000",

  NULL
};
#endif /* GAMEBOY */

int
main(argc, argv)
char *argv[];
{
	register char *p;
	register int c, i;

#ifdef GAMEBOY
	nb_rom_banks = 2;
	nb_ram_banks = 0;
	mbc_type = 0;
	symflag=0;

	for(i = 0; default_basep[i] != NULL; i++) {
		if(basep == NULL) {
			basep = (struct base *)new(sizeof(struct base));
			bsp = basep;
		} else {
			bsp->b_base = (struct base *)new(sizeof(struct base));
			bsp = bsp->b_base;
		}
		bsp->b_strp = default_basep[i];
	}
	for(i = 0; default_globlp[i] != NULL; i++) {
		if(globlp == NULL) {
			globlp = (struct globl *)new(sizeof(struct globl));
			gsp = globlp;
		} else {
			gsp->g_globl = (struct globl *)new(sizeof(struct globl));
			gsp = gsp->g_globl;
		}
		gsp->g_strp = default_globlp[i];
	}
#endif /* GAMEBOY */
#ifndef SDK
	fprintf(stdout, "\n");
#endif /* SDK */

	startp = (struct lfile *) new (sizeof (struct lfile));

	pflag = 1;
	for (i=1; i<argc; ++i) {
		p = argv[i];
		if (*p == '-') {
			while (ctype[c = *(++p)] & LETTER) {
				switch(c) {

				case 'c':
				case 'C':
					startp->f_type = F_STD;
					break;

				case 'f':
				case 'F':
					startp->f_type = F_LNK;
					break;
					
				case 'n':
				case 'N':
					pflag = 0;
					break;

				case 'p':
				case 'P':
					pflag = 1;
					break;

				default:
					usage();
				}
			}

#ifdef SDK			
			if(c == '-') {
				startp->f_type = F_CMD;
				startp->f_idp = (char *)&argv[i+1];
				break;
			}
#endif /* SDK */

		} else {
			if (startp->f_type == F_LNK) {
				startp->f_idp = p;
			}
		}
	}
	if (startp->f_type == F_INV)
		usage();
	if (startp->f_type == F_LNK && startp->f_idp == NULL)
		usage();
#ifdef SDK
	if (startp->f_type == F_CMD && startp->f_idp == NULL)
		usage();
#endif /* SDK */

	cfp = NULL;
	sfp = NULL;
	filep = startp;
	while (1) {
		ip = ib;					
		if (getline(NULL, NULL, NULL) == 0)
			break;
		if (pflag && sfp != stdin)
			fprintf(stdout, "%s\n", ip);
		if (*ip == '\0' || parse())
			break;
	}
	if (sfp)
		fclose(sfp);
	if (linkp == NULL)
		usage();
#ifdef SDK
	if (linkp->f_flp == NULL)
		usage();
#endif /* SDK */

#ifdef GAMEBOY
	for(i = 1; i < nb_rom_banks; i++) {
		bsp->b_base = (struct base *)new(sizeof(struct base));
		bsp = bsp->b_base;
		bsp->b_strp = (char *)malloc(18);
		sprintf(bsp->b_strp, "_CODE_%d=0x4000", i);
	}
	for(i = 0; i < nb_ram_banks; i++) {
		bsp->b_base = (struct base *)new(sizeof(struct base));
		bsp = bsp->b_base;
		bsp->b_strp = (char *)malloc(18);
		sprintf(bsp->b_strp, "_DATA_%d=0xA000", i);
	}
#endif /* GAMEBOY */

	syminit();
	for (pass=0; pass<2; ++pass) {
		cfp = NULL;
		sfp = NULL;
#ifdef SDK
		filep = linkp->f_flp;
#else /* SDK */
		filep = linkp;
#endif /* SDK */
		hp = NULL;
		radix = 10;

		while (getline(NULL, NULL, NULL)) {
			ip = ib;
			link();
		}
		if (pass == 0) {
			/*
			 * Search libraries for global symbols
			 */
			search();
			/*
			 * Set area base addresses.
			 */
			setbas();
			/*
			 * Link all area addresses.
			 */
			lnkarea();
			/*
			 * Process global definitions.
			 */
			setgbl();
			/*
			 * Check for undefined globals.
			 */
			symdef(stderr);
#ifdef SDK
			if (symflag) 
				sym();
#endif
			/*
			 * Output Link Map.
			 */
			if (mflag)
				map();
			/*
			 * Open output file
			 */
			if (oflag == 1) {
#ifdef SDK
				ofp = afile(linkp->f_idp, "ihx", 1);
#else /* SDK */
				ofp = afile(linkp->f_idp, "IHX", 1);
#endif /* SDK */
				if (ofp == NULL) {
					lkexit(1);
				}
			} else
			if (oflag == 2) {
#ifdef SDK
				ofp = afile(linkp->f_idp, "s19", 1);
#else /* SDK */
				ofp = afile(linkp->f_idp, "S19", 1);
#endif /* SDK */
				if (ofp == NULL) {
					lkexit(1);
				}
#ifdef SDK
			} else
			if (oflag == 3) {
				binary = 1;
				ofp = afile(linkp->f_idp, "", 1);
				binary = 0;
				if (ofp == NULL) {
					lkexit(1);
				}
#endif /* SDK */
			}
		} else {
			/*
			 * Link in library files
			 */
			library();
			reloc('E');
		}
	}
	lkexit(lkerr);

        /* Never get here. */
        return 0;
}

/*)Function	VOID	lkexit(i)
 *
 *			int	i	exit code
 *
 *	The function lkexit() explicitly closes all open
 *	files and then terminates the program.
 *
 *	local variables:
 *		none
 *
 *	global variables:
 *		FILE *	mfp		file handle for .map
 *		FILE *	ofp		file handle for .ihx/.s19
 *		FILE *	rfp		file hanlde for .rst
 *		FILE *	sfp		file handle for .rel
 *		FILE *	tfp		file handle for .lst
 *
 *	functions called:
 *		int	fclose()	c_library
 *		VOID	exit()		c_library
 *
 *	side effects:
 *		All files closed. Program terminates.
 */

VOID 
lkexit(i)
int i;
{
	if (mfp != NULL) fclose(mfp);
	if (ofp != NULL) fclose(ofp);
	if (rfp != NULL) fclose(rfp);
	if (sfp != NULL) fclose(sfp);
	if (tfp != NULL) fclose(tfp);
	exit(i);
}

/*)Function	link()
 *
 *	The function link() evaluates the directives for each line of
 *	text read from the .rel file(s).  The valid directives processed
 *	are:
 *		X, D, Q, H, M, A, S, T, R, and P.
 *
 *	local variables:
 *		int	c		first non blank character of a line
 *
 *	global variables:
 *		head	*headp		The pointer to the first
 *				 	head structure of a linked list
 *		head	*hp		Pointer to the current
 *				 	head structure
 *		int	pass		linker pass number
 *		int	radix		current number conversion radix
 *
 *	functions called:
 *		char	endline()	lklex.c
 *		VOID	module()	lkhead.c
 *		VOID	newarea()	lkarea.c
 *		VOID	newhead()	lkhead.c
 *		sym *	newsym()	lksym.c
 *		VOID	reloc()		lkreloc.c
 *
 *	side effects:
 *		Head, area, and symbol structures are created and
 *		the radix is set as the .rel file(s) are read.
 */

VOID
link()
{
	register int c;

	if ((c=endline()) == 0) { return; }
	switch (c) {

	case 'X':
		radix = 16;
		break;

	case 'D':
		radix = 10;
		break;

	case 'Q':
		radix = 8;
		break;

	case 'H':
		if (pass == 0) {
			newhead();
		} else {
			if (hp == 0) {
				hp = headp;
			} else {
				hp = hp->h_hp;
			}
		}
		sdp.s_area = NULL;
		sdp.s_areax = NULL;
		sdp.s_addr = 0;
		break;

	case 'M':
		if (pass == 0)
			module();
		break;

	case 'A':
		if (pass == 0)
			newarea();
		if (sdp.s_area == NULL) {
			sdp.s_area = areap;
			sdp.s_areax = areap->a_axp;
			sdp.s_addr = 0;
		}
		break;

	case 'S':
		if (pass == 0)
			newsym();
		break;

	case 'T':
	case 'R':
	case 'P':
		if (pass == 0)
			break;
		reloc(c);
		break;

	default:
		break;
	}
	if (c == 'X' || c == 'D' || c == 'Q') {
		if ((c = get()) == 'H') {
			hilo = 1;
		} else
		if (c == 'L') {
			hilo = 0;
		}
	}
}

/*)Function	VOID	map()
 *
 *	The function map() opens the output map file and calls the various
 *	routines to
 *	(1) output the variables in each area,
 *	(2) list the files processed with module names,
 *	(3) list the libraries file processed,
 *	(4) list base address definitions,
 *	(5) list global variable definitions, and
 *	(6) list any undefined variables.
 *
 *	local variables:
 *		int 	i		counter
 *		head *	hdp		pointer to head structure
 *		lbfile *lbfh		pointer to library file structure
 *
 *	global variables:
 *		area	*ap		Pointer to the current
 *				 	area structure
 *		area	*areap		The pointer to the first
 *				 	area structure of a linked list
 *		base	*basep		The pointer to the first
 *				 	base structure
 *		base	*bsp		Pointer to the current
 *				 	base structure
 *		lfile	*filep	 	The pointer *filep points to the
 *				 	beginning of a linked list of
 *				 	lfile structures.
 *		globl	*globlp		The pointer to the first
 *				 	globl structure
 *		globl	*gsp		Pointer to the current
 *				 	globl structure
 *		head	*headp		The pointer to the first
 *				 	head structure of a linked list
 *		lbfile	*lbfhead	The pointer to the first
 *					lbfile structure of a linked list
 *		lfile	*linkp		pointer to first lfile structure
 *				 	containing an input REL file
 *				 	specification
 *		int	lop		current line number on page
 *		FILE	*mfp		Map output file handle
 *		int	page		current page number
 *
 *	functions called:
 *		FILE *	afile()		lkmain.c
 *		int	fprintf()	c_library
 *		VOID	lkexit()	lkmain.c
 *		VOID	lstarea()	lklist.c
 *		VOID	newpag()	lklist.c
 *		VOID	symdef()	lksym.c
 *
 *	side effects:
 *		The map file is created.
 */

#ifndef MLH_MAP
VOID
map()
{
	register i;
	register struct head *hdp;
	register struct lbfile *lbfh;

	/*
	 * Open Map File
	 */
#ifdef SDK
	mfp = afile(linkp->f_idp, "map", 1);
#else /* SDK */
	mfp = afile(linkp->f_idp, "MAP", 1);
#endif /* SDK */
	if (mfp == NULL) {
		lkexit(1);
	}

	/*
	 * Output Map Area Lists
	 */
	page = 0;
	lop  = NLPP;
	ap = areap;
	while (ap) {
		lstarea(ap);
		ap = ap->a_ap;
	}
	/*
	 * List Linked Files
	 */
	newpag(mfp);
	fprintf(mfp, "\nFiles Linked      [ module(s) ]\n\n");
	hdp = headp;
#ifdef SDK
	filep = linkp->f_flp;
#else /* SDK */
	filep = linkp;
#endif /* SDK */
	while (filep) {
		fprintf(mfp, "%-16s", filep->f_idp);
		i = 0;
		while ((hdp != NULL) && (hdp->h_lfile == filep)) {
			if (i % 5) {
			    fprintf(mfp, ", %8.8s", hdp->m_id);
			} else {
			    if (i) {
				fprintf(mfp, ",\n%20s%8.8s", "", hdp->m_id);
			    } else {
				fprintf(mfp, "  [ %8.8s", hdp->m_id);
			    }
			}
			hdp = hdp->h_hp;
			i++;
		}
		if (i)
			fprintf(mfp, " ]");
		fprintf(mfp, "\n");
		filep = filep->f_flp;
	}
	/*
	 * List Linked Libraries
	 */
	if (lbfhead != NULL) {
		fprintf(mfp,
	"\nLibraries Linked                    [   object  file   ]\n\n");
		for (lbfh=lbfhead; lbfh; lbfh=lbfh->next) {
			fprintf(mfp, "%-32s    [ %16.16s ]\n",
				lbfh->libspc, lbfh->relfil);
		}
		fprintf(mfp, "\n");
	}
	/*
	 * List Base Address Definitions
	 */
	if (basep) {
		newpag(mfp);
		fprintf(mfp, "\nUser Base Address Definitions\n\n");
		bsp = basep;
		while (bsp) {
			fprintf(mfp, "%s\n", bsp->b_strp);
			bsp = bsp->b_base;
		}
	}
	/*
	 * List Global Definitions
	 */
	if (globlp) {
		newpag(mfp);
		fprintf(mfp, "\nUser Global Definitions\n\n");
		gsp = globlp;
		while (gsp) {
			fprintf(mfp, "%s\n", gsp->g_strp);
			gsp = gsp->g_globl;
		}
	}
	fprintf(mfp, "\n\f");
	symdef(mfp);
}
#else
VOID map()
{
	register struct head *hdp;
	register struct lbfile *lbfh;

	/*
	 * Open Map File
	 */
#ifdef SDK
	mfp = afile(linkp->f_idp, "map", 1);
#else /* SDK */
	mfp = afile(linkp->f_idp, "MAP", 1);
#endif /* SDK */
	if (mfp == NULL) {
		lkexit(1);
	}

	/*
	 *Output Map Area Lists
	 */
	page = 0;
	lop  = NLPP;
	ap = areap;
	while (ap) {
		lstarea(ap);
		ap = ap->a_ap;
	}
	/*
	 * List Linked Files
	 */
	hdp = headp;
#ifdef SDK
	filep = linkp->f_flp;
#else /* SDK */
	filep = linkp;
#endif /* SDK */
	if (filep) {
		fprintf( mfp, "MODULES\n");
	}
	while (filep) {
		fprintf(mfp, "\tFILE %s\n", filep->f_idp);
		while ((hdp != NULL) && (hdp->h_lfile == filep)) {
			if (strlen(hdp->m_id)>0)
				fprintf(mfp, "\t\tNAME %s\n", hdp->m_id);
			hdp = hdp->h_hp;
		}
		filep = filep->f_flp;
	}
	/*
	 * List Linked Libraries
	 */
	if (lbfhead != NULL) {
		fprintf(mfp, "LIBRARIES\n");
		for (lbfh=lbfhead; lbfh; lbfh=lbfh->next) {
			fprintf(mfp,	"\tLIBRARY %s\n"
					"\t\tMODULE %s\n",
				lbfh->libspc, lbfh->relfil);
		}
	}
	/*
	 * List Base Address Definitions
	 */
	if (basep) {
		fprintf(mfp, "USERBASEDEF\n");
		bsp = basep;
		while (bsp) {
			fprintf(mfp, "\t%s\n", bsp->b_strp);
			bsp = bsp->b_base;
		}
	}
	/*
	 * List Global Definitions
	 */
	if (globlp) {
		fprintf(mfp, "USERGLOBALDEF\n");
		gsp = globlp;
		while (gsp) {
			fprintf(mfp, "\t%s\n", gsp->g_strp);
			gsp = gsp->g_globl;
		}
	}
	symdef(mfp);
#ifdef SDK
	if (mfp!=NULL) {
		fclose(mfp);
		mfp = NULL;
	}
#endif
}
#endif /* MLH_MAP */

#ifdef SDK
/* PENDING */
VOID lstareatosym(struct area *xp);

VOID sym()
{
	/*
	 * Open sym File
	 */
	mfp = afile(linkp->f_idp, "sym", 1);
	if (mfp == NULL) {
		lkexit(1);
	}
	fprintf( mfp,	"; no$gmb format .sym file\n"
			"; Generated automagically by ASxxxx linker %s (SDK " SDK_VERSION_STRING ")\n"
		, VERSION );
	/*
	 * Output sym Area Lists
	 */
	page = 0;
	lop  = NLPP;
	ap = areap;
	while (ap) {
		lstareatosym(ap);
		ap = ap->a_ap;
	}
	if (mfp!=NULL) {
		fclose(mfp);
		mfp = NULL;
	}
}
#endif /* SDK */

/*)Function	int	parse()
 *
 *	The function parse() evaluates all command line or file input
 *	linker directives and updates the appropriate variables.
 *
 *	local variables:
 *		int	c		character value
 *		char	fid[]		file id string
 *
 *	global variables:
 *		char	ctype[]		array of character types, one per
 *				 	ASCII character
 *		lfile	*lfp		pointer to current lfile structure
 *				 	being processed by parse()
 *		lfile	*linkp		pointer to first lfile structure
 *				 	containing an input REL file
 *				 	specification
 *		int	mflag		Map output flag
 *		int	oflag		Output file type flag
 *		int	pflag		print linker command file flag
 *		FILE *	stderr		c_library
 *		int	uflag		Relocated listing flag
 *		int	xflag		Map file radix type flag
 *
 *	Functions called:
 *		VOID	addlib()	lklibr.c
 *		VOID	addpath()	lklibr.c
 *		VOID	bassav()	lkmain.c
 *		int	fprintf()	c_library
 *		VOID	gblsav()	lkmain.c
 *		VOID	getfid()	lklex.c
 *		char	getnb()		lklex.c
 *		VOID	lkexit()	lkmain.c
 *		char *	strcpy()	c_library
 *		int	strlen()	c_library
 *
 *	side effects:
 *		Various linker flags are updated and the linked
 *		structure lfile is created.
 */

int
parse()
{
	register int c;
	char fid[NINPUT];

	while ((c = getnb()) != 0) {
		if ( c == '-') {
			while (ctype[c=get()] & LETTER) {
				switch(c) {

				case 'i':
				case 'I':
					oflag = 1;
					break;

				case 's':
				case 'S':
					oflag = 2;
					break;
#ifdef GAMEBOY
				case 'y':
				case 'Y':
					c = get();
					if(c == 'O' || c == 'o')
						nb_rom_banks = expr(0);
					else if(c == 'A' || c == 'a')
						nb_ram_banks = expr(0);
					else if(c == 'T' || c == 't')
						mbc_type = expr(0);
					else if(c == 'N' || c == 'n') {
						int i = 0;
						if(getnb() != '=' || getnb() != '"') {
							fprintf(stderr, "Syntax error in -YN=\"name\" flag\n");
							lkexit(1);
						}
						while((c = get()) != '"' && i < 16) {
							cart_name[i++] = c;
						}
						if(i < 16)
							cart_name[i] = 0;
						else
							while(get() != '"')
								;
					} else if(c == 'P' || c == 'p') {
						patch *p = patches;

						patches = (patch *)malloc(sizeof(patch));
						patches->next = p;
						patches->addr = expr(0);
						if(getnb() != '=') {
							fprintf(stderr, "Syntax error in -YHaddr=val flag\n");
							lkexit(1);
						}
						patches->value = expr(0);
					} else {
						fprintf(stderr, "Invalid option\n");
						lkexit(1);
					}
					break;

#endif /* GAMEBOY */
#ifdef SDK
				case 'j':
				case 'J':
					++symflag;
					break;
				case 'z':
				case 'Z':
					oflag = 3;
					break;
#endif /* SDK */
				case 'm':
				case 'M':
					++mflag;
					break;

				case 'u':
				case 'U':
					uflag = 1;
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

				case 'e':
				case 'E':
					return(1);

				case 'n':
				case 'N':
					pflag = 0;
					break;

				case 'p':
				case 'P':
					pflag = 1;
					break;

				case 'b':
				case 'B':
					bassav();
					return(0);

				case 'g':
				case 'G':
					gblsav();
					return(0);

				case 'k':
				case 'K':
					addpath();
					return(0);

				case 'l':
				case 'L':
					addlib();
					return(0);

				default:
					fprintf(stderr, "Invalid option\n");
					lkexit(1);
				}
			}
		} else
		if (ctype[c] != ILL) {
			if (linkp == NULL) {
				linkp = (struct lfile *)
					new (sizeof (struct lfile));
				lfp = linkp;
			} else {
				lfp->f_flp = (struct lfile *)
						new (sizeof (struct lfile));
				lfp = lfp->f_flp;
			}
			getfid(fid, c);
			lfp->f_idp = (char *) new (strlen(fid)+1);
			strcpy(lfp->f_idp, fid);
			lfp->f_type = F_REL;
		} else {
			fprintf(stderr, "Invalid input");
			lkexit(1);
		}
	}
	return(0);
}

/*)Function	VOID	bassav()
 *
 *	The function bassav() creates a linked structure containing
 *	the base address strings input to the linker.
 *
 *	local variables:
 *		none
 *
 *	global variables:
 *		base	*basep		The pointer to the first
 *				 	base structure
 *		base	*bsp		Pointer to the current
 *				 	base structure
 *		char	*ip		pointer into the REL file
 *				 	text line in ib[]
 *
 *	 functions called:
 *		char	getnb()		lklex.c
 *		VOID *	new()		lksym.c
 *		int	strlen()	c_library
 *		char *	strcpy()	c_library
 *		VOID	unget()		lklex.c
 *
 *	side effects:
 *		The basep structure is created.
 */

VOID
bassav()
{
	if (basep == NULL) {
		basep = (struct base *)
			new (sizeof (struct base));
		bsp = basep;
	} else {
		bsp->b_base = (struct base *)
				new (sizeof (struct base));
		bsp = bsp->b_base;
	}
	unget(getnb());
	bsp->b_strp = (char *) new (strlen(ip)+1);
	strcpy(bsp->b_strp, ip);
}
	
/*)Function	VOID	setbas()
 *
 *	The function setbas() scans the base address lines in hte
 *	basep structure, evaluates the arguments, and sets beginning
 *	address of the specified areas.
 *
 *	local variables:
 *		int	v		expression value
 *		char	id[]		base id string
 *
 *	global variables:
 *		area	*ap		Pointer to the current
 *				 	area structure
 *		area	*areap		The pointer to the first
 *				 	area structure of a linked list
 *		base	*basep		The pointer to the first
 *				 	base structure
 *		base	*bsp		Pointer to the current
 *				 	base structure
 *		char	*ip		pointer into the REL file
 *				 	text line in ib[]
 *		int	lkerr		error flag
 *
 *	 functions called:
 *		Addr_T	expr()		lkeval.c
 *		int	fprintf()	c_library
 *		VOID	getid()		lklex.c
 *		char	getnb()		lklex.c
 *		int	symeq()		lksym.c
 *
 *	side effects:
 *		The base address of an area is set.
 */

VOID
setbas()
{
	register int v;
	char id[NCPS];

	bsp = basep;
	while (bsp) {
		ip = bsp->b_strp;
		getid(id, -1);
		if (getnb() == '=') {
			v = expr(0);
			for (ap = areap; ap != NULL; ap = ap->a_ap) {
				if (symeq(id, ap->a_id))
					break;
			}
			if (ap == NULL) {
#ifndef SDK
				fprintf(stderr,
				"No definition of area %s\n", id);
				lkerr++;
#endif /* SDK */
			} else {
				ap->a_addr = v;
			}
		} else {
			fprintf(stderr, "No '=' in base expression");
			lkerr++;
		}
		bsp = bsp->b_base;
	}
}

/*)Function	VOID	gblsav()
 *
 *	The function gblsav() creates a linked structure containing
 *	the global variable strings input to the linker.
 *
 *	local variable:
 *		none
 *
 *	global variables:
 *		globl	*globlp		The pointer to the first
 *				 	globl structure
 *		globl	*gsp		Pointer to the current
 *				 	globl structure
 *		char	*ip		pointer into the REL file
 *				 	text line in ib[]
 *		int	lkerr		error flag
 *
 *	functions called:
 *		char	getnb()		lklex.c
 *		VOID *	new()		lksym.c
 *		int	strlen()	c_library
 *		char *	strcpy()	c_library
 *		VOID	unget()		lklex.c
 *
 *	side effects:
 *		The globlp structure is created.
 */

VOID
gblsav()
{
	if (globlp == NULL) {
		globlp = (struct globl *)
			new (sizeof (struct globl));
		gsp = globlp;
	} else {
		gsp->g_globl = (struct globl *)
				new (sizeof (struct globl));
		gsp = gsp->g_globl;
	}
	unget(getnb());
	gsp->g_strp = (char *) new (strlen(ip)+1);
	strcpy(gsp->g_strp, ip);
}
	
/*)Function	VOID	setgbl()
 *
 *	The function setgbl() scans the global variable lines in hte
 *	globlp structure, evaluates the arguments, and sets a variable
 *	to this value.
 *
 *	local variables:
 *		int	v		expression value
 *		char	id[]		base id string
 *		sym *	sp		pointer to a symbol structure
 *
 *	global variables:
 *		char	*ip		pointer into the REL file
 *				 	text line in ib[]
 *		globl	*globlp		The pointer to the first
 *				 	globl structure
 *		globl	*gsp		Pointer to the current
 *				 	globl structure
 *		FILE *	stderr		c_library
 *		int	lkerr		error flag
 *
 *	 functions called:
 *		Addr_T	expr()		lkeval.c
 *		int	fprintf()	c_library
 *		VOID	getid()		lklex.c
 *		char	getnb()		lklex.c
 *		sym *	lkpsym()	lksym.c
 *
 *	side effects:
 *		The value of a variable is set.
 */

VOID
setgbl()
{
	register int v;
	register struct sym *sp;
	char id[NCPS];

	gsp = globlp;
	while (gsp) {
		ip = gsp->g_strp;
		getid(id, -1);
		if (getnb() == '=') {
			v = expr(0);
			sp = lkpsym(id, 0);
			if (sp == NULL) {
#ifndef SDK
				fprintf(stderr,
				"No definition of symbol %s\n", id);
				lkerr++;
#endif /* SDK */
			} else {
#ifndef SDK
				if (sp->s_flag & S_DEF) {
					fprintf(stderr,
					"Redefinition of symbol %s\n", id);
					lkerr++;
					sp->s_axp = NULL;
				}
#endif /* SDK */
				sp->s_addr = v;
				sp->s_type |= S_DEF;
			}
		} else {
			fprintf(stderr, "No '=' in global expression");
			lkerr++;
		}
		gsp = gsp->g_globl;
	}
}

/*)Function	FILE *	afile(fn,, ft, wf)
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
 *			a file type then the default .rel file
 *			type is appended to the file specification.
 *
 *	afile() returns a file handle for the opened file or aborts
 *	the assembler on an open error.
 *
 *	local variables:
 *		int	c		character value
 *		char	fb[]		constructed file specification string
 *		FILE *	fp		filehandle for opened file
 *		char *	p1		pointer to filespec string fn
 *		char *	p2		pointer to filespec string fb
 *		char *	p3		pointer to filetype string ft
 *
 *	global variables:
 *		int	lkerr		error flag
 *
 *	functions called:
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
{
	register char *p1, *p2, *p3;
	register int c;
	FILE *fp;
	char fb[FILSPC];

	p1 = fn;
	p2 = fb;
	p3 = ft;
	while ((c = *p1++) != 0 && c != FSEPX) {
		if (p2 < &fb[FILSPC-4])
			*p2++ = c;
	}
	*p2++ = FSEPX;
	if (*p3 == 0) {
		if (c == FSEPX) {
			p3 = p1;
		} else {
#ifdef SDK
			p3 = "rel";
#else /* SDK */
			p3 = "REL";
#endif /* SDK */
		}
	}
	while ((c = *p3++) != 0) {
		if (p2 < &fb[FILSPC-1])
			*p2++ = c;
	}
	*p2++ = 0;
#ifdef SDK
	if ((fp = fopen(fb, wf?(binary?"wb":"w"):(binary?"rb":"r"))) == NULL) {
#else /* SDK */
	if ((fp = fopen(fb, wf?"w":"r")) == NULL) {
#endif /* SDK */
		fprintf(stderr, "%s: cannot %s.\n", fb, wf?"create":"open");
		lkerr++;
	}
	return (fp);
}

char *usetxt[] = {
#ifdef SDK
	"Distributed with SDK " SDK_VERSION_STRING ", built on " __DATE__ " " __TIME__,
	"Compile options: SDK Target " TARGET_STRING
#ifdef INDEXLIB
	" INDEXLIB"
#endif
	"\n",
#endif
	"Startup:",
#ifdef SDK
	"  --   [Commands]              Non-interactive command line input",
#endif /* SDK */
	"  -c                           Command line input",
	"  -f   file[LNK]               File input",
	"  -p   Prompt and echo of file[LNK] to stdout (default)",
	"  -n   No echo of file[LNK] to stdout",
#ifdef SDK
	"Usage: [-Options] outfile file [file ...]",
#else /* SDK */
	"Usage: [-Options] file [file ...]",
#endif /* SDK */
	"Librarys:",
	"  -k	Library path specification, one per -k",
	"  -l	Library file specification, one per -l",
	"Relocation:",
	"  -b   area base address = expression",
	"  -g   global symbol = expression",
#ifdef GAMEBOY
	"  -yo  Number of rom banks (default: 2)",
	"  -ya  Number of ram banks (default: 0)",
	"  -yt  MBC type (default: no MBC)",
	"  -yn  Name of program (default: name of output file)",
	"  -yp# Patch one byte in the output GB file (# is: addr=byte)",
#endif /* GAMEBOY */
	"Map format:",
	"  -m   Map output generated as file[MAP]",
#ifdef SDK
	"  -j   no$gmb symbol file generated as file[SYM]",
#endif /* SDK */
	"  -x   Hexidecimal (default)",
	"  -d   Decimal",
	"  -q   Octal",
	"Output:",
	"  -i   Intel Hex as file[IHX]",
	"  -s   Motorola S19 as file[S19]",
#ifdef SDK
#ifdef GAMEGEAR
	"  -z   Gamegear image as file[GG]",
#else
	"  -z   Gameboy image as file[GB]",
#endif /* GAMEGEAR */
#endif /* SDK */
	"List:",
	"  -u	Update listing file(s) with link data as file(s)[.RST]",
	"End:",
	"  -e   or null line terminates input",
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
 *		FILE *	stderr		c_library
 *
 *	functions called:
 *		int	fprintf()	c_library
 *
 *	side effects:
 *		none
 */

VOID
usage()
{
	register char	**dp;

	fprintf(stderr, "\nASxxxx Linker %s\n\n", VERSION);
	for (dp = usetxt; *dp; dp++)
		fprintf(stderr, "%s\n", *dp);
	lkexit(1);
}
