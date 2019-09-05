/* asdata.c */

/*
 * (C) Copyright 1989-1995
 * All Rights Reserved
 *
 * Alan R. Baldwin
 * 721 Berkeley St.
 * Kent, Ohio  44240
 */

#include <stdio.h>
#include <setjmp.h>
#include <string.h>

#include "asm.h"

/*)Module	asdata.c
 *
 *	The module asdata.c contains the global constants,
 *	structures, and variables used in the assembler.
 */

int	aserr;		/*	ASxxxx error counter
			 */
jmp_buf	jump_env;	/*	compiler dependent structure
			 *	used by setjmp() and longjmp()
			 */
int	inpfil;		/*	count of assembler
			 *	input files specified
			 */
int	incfil;		/*	current file handle index
			 *	for include files
			 */
int	cfile;		/*	current file handle index
			 *	of input assembly files
			 */
int	flevel;		/*	IF-ELSE-ENDIF flag will be non
			 *	zero for false conditional case
			 */
int	tlevel;		/*	current conditional level
			 */
int	ifcnd[MAXIF+1];	/*	array of IF statement condition
			 *	values (0 = FALSE) indexed by tlevel
			 */
int	iflvl[MAXIF+1];	/*	array of IF-ELSE-ENDIF flevel
			 *	values indexed by tlevel
			 */

char	afn[FILSPC];		/*	afile temporary file name
				 */
char	srcfn[MAXFIL][FILSPC];	/*	array of source file names
				 */
int	srcline[MAXFIL];	/*	source line number
				 */
char	incfn[MAXINC][FILSPC];	/*	array of include file names
				 */
int	incline[MAXINC];	/*	include line number
				 */

int	radix;		/*	current number conversion radix:
			 *	2 (binary), 8 (octal), 10 (decimal),
			 *	16 (hexadecimal)
			 */
int	line;		/*	current assembler source
			 *	line number
			 */
int	page;		/*	current page number
			 */
int	lop;		/*	current line number on page
			 */
int	pass;		/*	assembler pass number
			 */
int	lflag;		/*	-l, generate listing flag
			 */
int	gflag;		/*	-g, make undefined symbols global flag
			 */
int	aflag;		/*	-a, make all symbols global flag
			 */
int	oflag;		/*	-o, generate relocatable output flag
			 */
int	sflag;		/*	-s, generate symbol table flag
			 */
int	pflag;		/*	-p, enable listing pagination
			 */
int	xflag;		/*	-x, listing radix flag
			 */
int	fflag;		/*	-f(f), relocations flagged flag
			 */
Addr_T	laddr;		/*	address of current assembler line
			 *	or value of .if argument
			 */
Addr_T	fuzz;		/*	tracks pass to pass changes in the
			 *	address of symbols caused by
			 *	variable length instruction formats
			 */
int	lmode;		/*	listing mode
			 */
char	*ep;		/*	pointer into error list
			 *	array eb[NERR]
			 */
char	eb[NERR];	/*	array of generated error codes
			 */
char	*ip;		/*	pointer into the assembler-source
			 *	text line in ib[]
			 */
char	ib[NINPUT];	/*	assembler-source text line
			 */
char	*cp;		/*	pointer to assembler output
			 *	array cb[]
			 */
char	cb[NCODE];	/*	array of assembler output values
			 */
int	*cpt;		/*	pointer to assembler relocation type
			 *	output array cbt[]
			 */
int	cbt[NCODE];	/*	array of assembler relocation types
			 *	describing the data in cb[]
			 */
char	tb[NTITL];	/*	Title string buffer
			 */
char	stb[NSBTL];	/*	Subtitle string buffer
			 */

char	symtbl[] = { "Symbol Table" };
char	aretbl[] = { "Area Table" };

char	module[NCPS];	/*	module name string
			 */

/*
 *	The mne structure is a linked list of the assembler
 *	mnemonics and directives.  The list of mnemonics and
 *	directives contained in the device dependent file
 *	xxxpst.c are hashed and linked into NHASH lists in
 *	module assym.c by syminit().  The structure contains
 *	the mnemonic/directive name, a subtype which directs
 *	the evaluation of this mnemonic/directive, a flag which
 *	is used to detect the end of the mnemonic/directive
 *	list in xxxpst.c, and a value which is normally
 *	associated with the assembler mnemonic base instruction
 *	value.
 *
 *	struct	mne
 *	{
 *		struct	mne *m_mp;	Hash link
 *		char	m_id[NCPS];	Mnemonic
 *		char	m_type;		Mnemonic subtype
 *		char	m_flag;		Mnemonic flags
 *		Addr_T	m_valu;		Value
 *	};
 */
struct	mne	*mnehash[NHASH];

/*
 *	The sym structure is a linked list of symbols defined
 *	in the assembler source files.  The first symbol is "."
 *	defined here.  The entry 'struct tsym *s_tsym'
 *	links any temporary symbols following this symbol and
 *	preceeding the next normal symbol.  The structure also
 *	contains the symbol's name, type (USER or NEW), flag
 *	(global, assigned, and multiply defined), a pointer
 *	to the area structure defining where the symbol is
 *	located, a reference number assigned by outgsd() in
 *	asout.c, and the symbols address relative to the base
 *	address of the area where the symbol is located.
 *
 *	struct	sym
 *	{
 *		struct	sym  *s_sp;	Hash link
 *		struct	tsym *s_tsym;	Temporary symbol link
 *		char	s_id[NCPS];	Symbol
 *		char	s_type;		Symbol subtype
 *		char	s_flag;		Symbol flags
 *		struct	area *s_area;	Area line, 0 if absolute
 *		int	s_ref;		Ref. number
 *		Addr_T	s_addr;		Address
 *	};
 */
struct	sym	sym[] = {
    { NULL,	NULL,	".",	S_USER,	S_END,	NULL,	0, }
};

struct	sym	*symp;		/*	pointer to a symbol structure
				 */
struct	sym *symhash[NHASH];	/*	array of pointers to NHASH
				 *	linked symbol lists
				 */

/*
 *	The area structure contains the parameter values for a
 *	specific program or data section.  The area structure
 *	is a linked list of areas.  The initial default area
 *	is "_CODE" defined here, the next area structure
 *	will be linked to this structure through the structure
 *	element 'struct area *a_ep'.  The structure contains the
 *	area name, area reference number ("_CODE" is 0) determined
 *	by the order of .area directives, area size determined
 *	from the total code and/or data in an area, area fuzz is
 *	an variable used to track pass to pass changes in the
 *	area size caused by variable length instruction formats,
 *	and area flags which specify the area's relocation type.
 *
 *	struct	area
 *	{
 *		struct	area *a_ap;	Area link
 *		char	a_id[NCPS];	Area Name
 *		int	a_ref;		Reference number
 *		Addr_T	a_size;		Area size
 *		Addr_T	a_fuzz;		Area fuzz
 *		int	a_flag;		Area flags
 *	};
 */
struct	area	area[] = {
    { NULL,	"_CODE",	0,	0,	0,	A_CON|A_REL }
};

struct	area	*areap;	/*	pointer to an area structure
			 */

FILE	*lfp;		/*	list output file handle
			 */
FILE	*ofp;		/*	relocation output file handle
			 */
FILE	*tfp;		/*	symbol table output file handle
			 */
FILE	*sfp[MAXFIL];	/*	array of assembler-source file handles
			 */
FILE	*ifp[MAXINC];	/*	array of include-file file handles
			 */

/*
 *	array of character types, one per
 *	ASCII character
 */
char	ctype[128] = {
/*NUL*/	ILL,	ILL,	ILL,	ILL,	ILL,	ILL,	ILL,	ILL,
/*BS*/	ILL,	SPACE,	ILL,	ILL,	SPACE,	ILL,	ILL,	ILL,
/*DLE*/	ILL,	ILL,	ILL,	ILL,	ILL,	ILL,	ILL,	ILL,
/*CAN*/	ILL,	ILL,	ILL,	ILL,	ILL,	ILL,	ILL,	ILL,
/*SPC*/	SPACE,	ETC,	ETC,	ETC,	LETTER,	BINOP,	BINOP,	ETC,
/*(*/	ETC,	ETC,	BINOP,	BINOP,	ETC,	BINOP,	LETTER,	BINOP,
/*0*/	DGT2,	DGT2,	DGT8,	DGT8,	DGT8,	DGT8,	DGT8,	DGT8,
/*8*/	DGT10,	DGT10,	ETC,	ETC,	BINOP,	ETC,	BINOP,	ETC,
/*@*/	ETC,	LTR16,	LTR16,	LTR16,	LTR16,	LTR16,	LTR16,	LETTER,
/*H*/	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,
/*P*/	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,
/*X*/	LETTER,	LETTER,	LETTER,	ETC,	ETC,	ETC,	BINOP,	LETTER,
/*`*/	ETC,	LTR16,	LTR16,	LTR16,	LTR16,	LTR16,	LTR16,	LETTER,
/*h*/	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,
/*p*/	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,	LETTER,
/*x*/	LETTER,	LETTER,	LETTER,	ETC,	BINOP,	ETC,	ETC,	ETC
};

/*
 *	an array of characters which
 *	perform the case translation function
 */
#if	CASE_SENSITIVE
#else
char	ccase[128] = {
/*NUL*/	'\000',	'\001',	'\002',	'\003',	'\004',	'\005',	'\006',	'\007',
/*BS*/	'\010',	'\011',	'\012',	'\013',	'\014',	'\015',	'\016',	'\017',
/*DLE*/	'\020',	'\021',	'\022',	'\023',	'\024',	'\025',	'\026',	'\027',
/*CAN*/	'\030',	'\031',	'\032',	'\033',	'\034',	'\035',	'\036',	'\037',
/*SPC*/	'\040',	'\041',	'\042',	'\043',	'\044',	'\045',	'\046',	'\047',
/*(*/	'\050',	'\051',	'\052',	'\053',	'\054',	'\055',	'\056',	'\057',
/*0*/	'\060',	'\061',	'\062',	'\063',	'\064',	'\065',	'\066',	'\067',
/*8*/	'\070',	'\071',	'\072',	'\073',	'\074',	'\075',	'\076',	'\077',
/*@*/	'\100',	'\141',	'\142',	'\143',	'\144',	'\145',	'\146',	'\147',
/*H*/	'\150',	'\151',	'\152',	'\153',	'\154',	'\155',	'\156',	'\157',
/*P*/	'\160',	'\161',	'\162',	'\163',	'\164',	'\165',	'\166',	'\167',
/*X*/	'\170',	'\171',	'\172',	'\133',	'\134',	'\135',	'\136',	'\137',
/*`*/	'\140',	'\141',	'\142',	'\143',	'\144',	'\145',	'\146',	'\147',
/*h*/	'\150',	'\151',	'\152',	'\153',	'\154',	'\155',	'\156',	'\157',
/*p*/	'\160',	'\161',	'\162',	'\163',	'\164',	'\165',	'\166',	'\167',
/*x*/	'\170',	'\171',	'\172',	'\173',	'\174',	'\175',	'\176',	'\177'
};	
#endif
