/* asm.h */

/*
 * (C) Copyright 1989-1995
 * All Rights Reserved
 *
 * Alan R. Baldwin
 * 721 Berkeley St.
 * Kent, Ohio  44240
 *
 * 28-Oct-97 JLH: 
 *	     - add proto for StoreString
 *	     - change s_id from [NCPS] to pointer
 *	     - change m_id from [NCPS] to pointer
 *	     - change NCPS to 80
 *           - case sensitive
 *           - add R_J11 for 8051 assembler
 *           - add outr11 prototype for 8051 assembler
 *           - always define "ccase"
 *  2-Nov-97 JLH:
 *           - add jflag for debug control
 *           - prototypes for DefineNoICE_Line
 * 30-Jan-98 JLH:
 *           - add memory space flags to a_flag for 8051
 *
 *  3-Feb-00 KV:
 *	     - add DS80C390 flat mode support.
 */

#define	VERSION	"V01.70 + NoICE + SDCC mods + Flat24 Feb-1999"

#if !defined(__BORLANDC__) && !defined(_MSC_VER)
#include <unistd.h>
#endif

/*
 * Case Sensitivity Flag
 */
#define	CASE_SENSITIVE	1

/*)Module	asm.h
 *
 *	The module asm.h contains the definitions for constants,
 *	structures, global variables, and ASxxxx functions
 *	contained in the ASxxxx.c files.  The two functions
 *	and three global variables from the machine dependent
 *	files are also defined.
 */

/*
 *	 compiler/operating system specific definitions
 */

/* DECUS C void definition */
/* File/extension seperator */

#ifdef	decus
#define	VOID	char
#define	FSEPX	'.'
#endif

/* PDOS C void definition */
/* File/extension seperator */

#ifdef	PDOS
#define	VOID	char
#define	FSEPX	':'
#endif

/* Default void definition */
/* File/extension seperator */

#ifndef	VOID
#define	VOID	void
#define	FSEPX	'.'
#define	OTHERSYSTEM
#endif

/*
 * PATH_MAX
 */
#include <limits.h>
#ifndef PATH_MAX		/* POSIX, but not required   */
#define PATH_MAX		/* define a reasonable value */
#endif

/*
 * Assembler definitions.
 */
#define	LFTERM	'('		/* Left expression delimeter */
#define	RTTERM	')'		/* Right expression delimeter */

#define NCPS	80		/* Chars. per symbol (JLH: change from 8) */
#define	HUGE	1000		/* A huge number */
#define NERR	3		/* Errors per line */
#define	NINPUT	PATH_MAX	/* Input buffer size (BH: change from 128) */
#define NCODE	128		/* Listing code buffer size */
#define NTITL	64		/* Title buffer size */
#define	NSBTL	64		/* SubTitle buffer size */
#define	NHASH	64		/* Buckets in hash table */
#define	HMASK	077		/* Hash mask */
#define	NLPP	60		/* Lines per page */
#define	MAXFIL	6		/* Maximum command line input files */
#define	MAXINC	6		/* Maximum nesting of include files */
#define	MAXIF	10		/* Maximum nesting of if/else/endif */

#define NLIST	0		/* No listing */
#define SLIST	1		/* Source only */
#define ALIST	2		/* Address only */
#define	BLIST	3		/* Address only with allocation */
#define CLIST	4		/* Code */
#define	ELIST	5		/* Equate only */

#define	dot	sym[0]		/* Dot, current loc */
#define	dca	area[0]		/* Dca, default code area */


/* NB: for Flat24 extentions to work, Addr_T must be at least 24
 * bits. This is checked at runtime when the .flat24 directive 
 * is processed.
 */
typedef	unsigned int Addr_T;

/*
 *	The area structure contains the parameter values for a
 *	specific program or data section.  The area structure
 *	is a linked list of areas.  The initial default area
 *	is "_CODE" defined in asdata.c, the next area structure
 *	will be linked to this structure through the structure
 *	element 'struct area *a_ap'.  The structure contains the
 *	area name, area reference number ("_CODE" is 0) determined
 *	by the order of .area directives, area size determined
 *	from the total code and/or data in an area, area fuzz is
 *	a variable used to track pass to pass changes in the
 *	area size caused by variable length instruction formats,
 *	and area flags which specify the area's relocation type.
 */
struct	area
{
	struct	area *a_ap;	/* Area link */
	char	a_id[NCPS];	/* Area Name */
	int	a_ref;		/* Ref. number */
	Addr_T	a_size;		/* Area size */
	Addr_T	a_fuzz;		/* Area fuzz */
	int	a_flag;		/* Area flags */
};

/*
 *	The "A_" area constants define values used in
 *	generating the assembler area output data.
 *
 * Area flags
 *
 *	   7     6      5    4     3     2     1     0
 *	+-----+-----+-----+-----+-----+-----+-----+-----+
 *	| BIT |XDATA|DATA | PAG | ABS | OVR |     |     |
 *	+-----+-----+-----+-----+-----+-----+-----+-----+
 */

#define	A_CON	0000		/* Concatenating */
#define	A_OVR	0004		/* Overlaying */
#define	A_REL	0000		/* Relocatable */
#define	A_ABS	0010		/* absolute */
#define	A_NOPAG	0000		/* Non-Paged */
#define	A_PAG	0020		/* Paged */

/* Additional flags for 8051 address spaces */
#define A_DATA  0000		/* data space (default)*/
#define A_CODE  0040		/* code space */
#define A_XDATA 0100		/* external data space */
#define A_BIT   0200		/* bit addressable space */

/*
 *	The "R_" relocation constants define values used in
 *	generating the assembler relocation output data for
 *	areas, symbols, and code.
 *
 * Relocation flags
 *
 *	   7     6     5     4     3     2     1     0
 *	+-----+-----+-----+-----+-----+-----+-----+-----+
 *	| MSB | PAGn| PAG0| USGN| BYT2| PCR | SYM | BYT |
 *	+-----+-----+-----+-----+-----+-----+-----+-----+
 */

#define	R_WORD	0x00		/* 16 bit */
#define	R_BYTE	0x01		/*  8 bit */

#define	R_AREA	0x00		/* Base type */
#define	R_SYM	0x02

#define	R_NORM	0x00		/* PC adjust */
#define	R_PCR	0x04

#define	R_BYT1	0x00		/* Byte count for R_BYTE = 1 */
#define	R_BYT2	0x08		/* Byte count for R_BYTE = 2 */

#define	R_SGND	0x00		/* Signed Byte */
#define	R_USGN	0x10		/* Unsigned Byte */

#define	R_NOPAG	0x00		/* Page Mode */
#define	R_PAG0	0x20		/* Page '0' */
#define	R_PAG	0x40		/* Page 'nnn' */

#define	R_LSB	0x00		/* low byte */
#define	R_MSB	0x80		/* high byte */

#define R_BYT3	0x100		/* if R_BYTE is set, this is a 
				 * 3 byte address, of which
				 * the linker must select one byte.
				 */
#define R_HIB	0x200		/* If R_BYTE & R_BYT3 are set, linker
				 * will select byte 3 of the relocated
				 * 24 bit address.
				 */

#define R_J11   (R_WORD|R_BYT2)	/* JLH: 11 bit JMP and CALL (8051) */
#define R_J19   (R_WORD|R_BYT2|R_MSB) /* 19 bit JMP/CALL (DS80C390) */
#define R_C24   (R_WORD|R_BYT1|R_MSB) /* 24 bit address (DS80C390) */
#define R_J19_MASK (R_BYTE|R_BYT2|R_MSB)

#define IS_R_J19(x) (((x) & R_J19_MASK) == R_J19)
#define IS_R_J11(x) (((x) & R_J19_MASK) == R_J11)
#define IS_C24(x) (((x) & R_J19_MASK) == R_C24)

#define R_ESCAPE_MASK	0xf0	/* Used to escape relocation modes
				 * greater than 0xff in the .rel
				 * file.
				 */

/*
 * Listing Control Flags
 */

#define	R_HIGH	0040000		/* High Byte */
#define	R_RELOC	0100000		/* Relocation */

#define	R_DEF	00		/* Global def. */
#define	R_REF	01		/* Global ref. */
#define	R_REL	00		/* Relocatable */
#define	R_ABS	02		/* Absolute */
#define	R_GBL	00		/* Global */
#define	R_LCL	04		/* Local */

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
 */
struct	mne
{
	struct	mne *m_mp;	/* Hash link */
	char	*m_id;		/* Mnemonic JLH: change from [NCPS] */
	char	m_type;		/* Mnemonic subtype */
	char	m_flag;		/* Mnemonic flags */
	Addr_T	m_valu;		/* Value */
};

/*
 *	The sym structure is a linked list of symbols defined
 *	in the assembler source files.  The first symbol is "."
 *	defined in asdata.c.  The entry 'struct tsym *s_tsym'
 *	links any temporary symbols following this symbol and
 *	preceeding the next normal symbol.  The structure also
 *	contains the symbol's name, type (USER or NEW), flag
 *	(global, assigned, and multiply defined), a pointer
 *	to the area structure defining where the symbol is
 *	located, a reference number assigned by outgsd() in
 *	asout.c, and the symbols address relative to the base
 *	address of the area where the symbol is located.
 */
struct	sym
{
	struct	sym  *s_sp;	/* Hash link */
	struct	tsym *s_tsym;	/* Temporary symbol link */
	char	*s_id;		/* Symbol: JLH change from [NCPS] */
	char	s_type;		/* Symbol subtype */
	char	s_flag;		/* Symbol flags */
	struct	area *s_area;	/* Area line, 0 if absolute */
	int	s_ref;		/* Ref. number */
	Addr_T	s_addr;		/* Address */
};

#define	S_GBL		01	/* Global */
#define	S_ASG		02	/* Assigned */
#define	S_MDF		04	/* Mult. def */
#define	S_END		010	/* End mark for pst. */

#define	S_NEW		0	/* New name */
#define	S_USER		1	/* User name */
				/* unused slot */
				/* unused slot */
				/* unused slot */

#define	S_BYTE		5	/* .byte */
#define	S_WORD		6	/* .word */
#define	S_ASCII		7	/* .ascii */
#define	S_ASCIZ		8	/* .asciz */
#define	S_BLK		9	/* .blkb or .blkw */
#define	S_INCL		10	/* .include */
#define	S_DAREA		11	/* .area */
#define	S_ATYP		12	/* .area type */
#define	S_AREA		13	/* .area name */
#define	S_GLOBL		14	/* .globl */
#define	S_PAGE		15	/* .page */
#define	S_TITLE		16	/* .title */
#define	S_SBTL		17	/* .sbttl */
#define	S_IF		18	/* .if */
#define	S_ELSE		19	/* .else */
#define	S_ENDIF		20	/* .endif */
#define	S_EVEN		21	/* .even */
#define	S_ODD		22	/* .odd */
#define	S_RADIX		23	/* .radix */
#define	S_ORG		24	/* .org */
#define	S_MODUL		25	/* .module */
#define	S_ASCIS		26	/* .ascis */
#define	S_FLAT24	27      /* .flat24 */


/*
 *	The tsym structure is a linked list of temporary
 *	symbols defined in the assembler source files following
 *	a normal symbol.  The structure contains the temporary
 *	symbols number, a flag (multiply defined), a pointer to the
 *	area structure defining where the temporary structure
 *	is located, and the temporary symbol's address relative
 *	to the base address of the area where the symbol
 *	is located.
 */
struct	tsym
{
	struct	tsym *t_lnk;	/* Link to next */
/* sandeep changed to 'int' from 'char' */
/* this will increase the number temp symbols
   that can be defined from 255 to INT_MAX */
	int t_num;		/* 0-INT_MAX$ */
	int t_flg;		/* flags */

	struct	area *t_area;	/* Area */
	Addr_T	t_addr;		/* Address */
};

/*
 *	External Definitions for all Global Variables
 */

extern	int	aserr;		/*	ASxxxx error counter
				 */
extern	jmp_buf	jump_env;	/*	compiler dependent structure
				 *	used by setjmp() and longjmp()
				 */
extern	int	inpfil;		/*	count of assembler
				 *	input files specified
				 */
extern	int	incfil;		/*	current file handle index
				 *	for include files
				 */
extern	int	cfile;		/*	current file handle index
				 *	of input assembly files
				 */
extern	int	flevel;		/*	IF-ELSE-ENDIF flag will be non
				 *	zero for false conditional case
				 */
extern	int	tlevel;		/*	current conditional level
				 */
extern	int	ifcnd[MAXIF+1];	/*	array of IF statement condition
				 *	values (0 = FALSE) indexed by tlevel
				 */
extern	int	iflvl[MAXIF+1];	/*	array of IF-ELSE-ENDIF flevel
				 *	values indexed by tlevel
				 */
extern	char
	afn[PATH_MAX];		/*	afile() temporary filespec
				 */
extern	char
	srcfn[MAXFIL][PATH_MAX];	/*	array of source file names
				 */
extern	int
	srcline[MAXFIL];	/*	current source file line
				 */
extern	char
	incfn[MAXINC][PATH_MAX];	/*	array of include file names
				 */
extern	int
	incline[MAXINC];	/*	current include file line
				 */
extern	int	radix;		/*	current number conversion radix:
				 *	2 (binary), 8 (octal), 10 (decimal),
				 *	16 (hexadecimal)
				 */
extern	int	line;		/*	current assembler source
				 *	line number
				 */
extern	int	page;		/*	current page number
				 */
extern	int	lop;		/*	current line number on page
				 */
extern	int	pass;		/*	assembler pass number
				 */
extern	int	lflag;		/*	-l, generate listing flag
				 */
extern	int	cflag;		/*	-c, generate sdcdb debug information
				 */
extern	int	gflag;		/*	-g, make undefined symbols global flag
				 */
extern	int	aflag;		/*	-a, make all symbols global flag
				 */
extern  int	jflag;		/*	-j, generate debug information flag
				 */
extern	int	oflag;		/*	-o, generate relocatable output flag
				 */
extern	int	sflag;		/*	-s, generate symbol table flag
				 */
extern	int	pflag;		/*	-p, enable listing pagination
				 */
extern	int	xflag;		/*	-x, listing radix flag
				 */
extern	int	fflag;		/*	-f(f), relocations flagged flag
				 */
extern	Addr_T	laddr;		/*	address of current assembler line
				 *	or value of .if argument
				 */
extern	Addr_T	fuzz;		/*	tracks pass to pass changes in the
				 *	address of symbols caused by
				 *	variable length instruction formats
				 */
extern	int	lmode;		/*	listing mode
				 */
extern	struct	area	area[];	/*	array of 1 area
				 */
extern	struct	area *areap;	/*	pointer to an area structure
				 */
extern	struct	sym	sym[];	/*	array of 1 symbol
				 */
extern	struct	sym *symp;	/*	pointer to a symbol structure
				 */
extern	struct	sym *symhash[NHASH]; /*	array of pointers to NHASH
				      *	linked symbol lists
				      */
extern	struct	mne *mnehash[NHASH]; /*	array of pointers to NHASH
				      *	linked mnemonic/directive lists
				      */
extern	char	*ep;		/*	pointer into error list
				 *	array eb[NERR]
				 */
extern	char	eb[NERR];	/*	array of generated error codes
				 */
extern	char	*ip;		/*	pointer into the assembler-source
				 *	text line in ib[]
				 */
extern	char	ib[NINPUT];	/*	assembler-source text line
				 */
extern	char	*cp;		/*	pointer to assembler output
				 *	array cb[]
				 */
extern	char	cb[NCODE];	/*	array of assembler output values
				 */
extern	int	*cpt;		/*	pointer to assembler relocation type
				 *	output array cbt[]
				 */
extern	int	cbt[NCODE];	/*	array of assembler relocation types
				 *	describing the data in cb[]
				 */
extern	char	tb[NTITL];	/*	Title string buffer
				 */
extern	char	stb[NSBTL];	/*	Subtitle string buffer
				 */
extern 	int	flat24Mode;	/* 	non-zero if we are using DS390 24 bit 
			 	 *	flat mode (via .flat24 directive). 
			 	 */
extern	char	symtbl[];	/*	string "Symbol Table"
				 */
extern	char	aretbl[];	/*	string "Area Table"
				 */
extern	char	module[NCPS];	/*	module name string
				 */
extern	FILE	*lfp;		/*	list output file handle
				 */
extern	FILE	*ofp;		/*	relocation output file handle
				 */
extern	FILE	*tfp;		/*	symbol table output file handle
				 */
extern	FILE	*sfp[MAXFIL];	/*	array of assembler-source file handles
				 */
extern	FILE	*ifp[MAXINC];	/*	array of include-file file handles
				 */
extern	char	ctype[128];	/*	array of character types, one per
				 *	ASCII character
				 */

extern	char	ccase[128];	/* an array of characters which 
				 * perform the case translation function
				 */
/*
 * Definitions for Character Types
 */
#define	SPACE	0000
#define ETC	0000
#define	LETTER	0001
#define	DIGIT	0002
#define	BINOP	0004
#define	RAD2	0010
#define	RAD8	0020
#define	RAD10	0040
#define	RAD16	0100
#define	ILL	0200

#define	DGT2	DIGIT|RAD16|RAD10|RAD8|RAD2
#define	DGT8	DIGIT|RAD16|RAD10|RAD8
#define	DGT10	DIGIT|RAD16|RAD10
#define	LTR16	LETTER|RAD16

/*
 *	The exp structure is used to return the evaluation
 *	of an expression.  The structure supports three valid
 *	cases:
 *	(1)	The expression evaluates to a constant,
 *		mode = S_USER, flag = 0, addr contains the
 *		constant, and base = NULL.
 *	(2)	The expression evaluates to a defined symbol
 *		plus or minus a constant, mode = S_USER,
 *		flag = 0, addr contains the constant, and
 *		base = pointer to area symbol.
 *	(3)	The expression evaluates to a external
 *		global symbol plus or minus a constant,
 *		mode = S_NEW, flag = 1, addr contains the
 *		constant, and base = pointer to symbol.
 */
struct	expr
{
	char	e_mode;		/* Address mode */
	char	e_flag;		/* Symbol flag */
	Addr_T	e_addr;		/* Address */
	union	{
		struct area *e_ap;
		struct sym  *e_sp;
	} e_base;		/* Rel. base */
	int	e_rlcf;		/* Rel. flags */
};

/* C Library functions */
/* for reference only
extern	VOID		exit();
extern	int		fclose();
extern	char *		fgets();
extern	FILE *		fopen();
extern	int		fprintf();
extern	VOID		longjmp();
extern	VOID *		malloc();
extern	int		printf();
extern	char		putc();
extern	int		rewind();
extern	int		setjmp();
extern	int		strcmp();
extern	char *		strcpy();
extern	int		strlen();
extern	char *		strncpy();
*/

/* Machine independent functions */

/* asmain.c */
extern	FILE *		afile();
extern	VOID		asexit();
extern	VOID		asmbl();
extern	int		main();
extern	VOID		newdot();
extern	VOID		phase();
extern	VOID		usage();

/* aslex.c */
extern	char		endline();
extern	char		get();
extern	VOID		getid();
extern	int		getline(char **__restrict __lineptr, size_t *__restrict __n, FILE *__restrict __stream);
extern	int		getmap();
extern	char		getnb();
extern	VOID		getst();
extern	int		more();
extern	VOID		unget();
extern	VOID		chop_crlf();

/* assym.c */
extern	struct	area *	alookup();
extern	struct	mne *	mlookup();
extern	int		hash();
extern	struct	sym *	lookup();
extern	VOID *		new();
extern	int		symeq();
extern	VOID		syminit();
extern	VOID		symglob();
extern	VOID		allglob();

/* assubr.c */
extern	VOID		aerr();
extern	VOID		diag();
extern	VOID		err();
extern 	VOID 		warnBanner(void);
extern	char *		geterr();
extern	VOID		qerr();
extern	VOID		rerr();

/* asexpr.c */
extern	VOID		abscheck();
extern	Addr_T		absexpr();
extern	VOID		clrexpr();
extern	int		digit();
extern	int		is_abs();
extern	VOID		expr();
extern	int		oprio();
extern	VOID		term();

/* aslist.c */
extern	VOID		list();
extern	VOID		list1();
extern	VOID		list2();
extern	VOID		lstsym();
extern	VOID		slew();

/* asout.c */
extern	int		hibyte();
extern	int		lobyte();
extern 	int		byte3(int);
extern	VOID		out();
extern	VOID		outab();
extern	VOID		outarea();
extern	VOID		outaw();
extern	VOID		outall();
extern	VOID		outdot();
extern	VOID		outbuf();
extern	VOID		outchk();
extern	VOID		outgsd();
extern	VOID		outrb();
extern	VOID		outrw(struct expr *, int);
extern	VOID		outr24(struct expr *, int);
extern	VOID		outsym();
extern	VOID		out_lb();
extern	VOID		out_lw();
extern	VOID		out_l24(int, int);
extern	VOID		out_rw();
extern	VOID		out_tw();
extern	VOID		out_t24(int);
extern	VOID		outr11();	/* JLH */
extern	VOID		outr19(struct expr *, int, int);

/* asstore.c */
extern char *StoreString( char *str );

/* asnoice.c */
extern void DefineNoICE_Line();
extern void DefineCDB_Line();

/* Machine dependent variables */

extern	char *		cpu;
extern	char *		dsft;
extern	int		hilo;
extern	struct	mne	mne[];

/* Machine dependent functions */

extern	VOID		minit();
extern VOID machine(struct mne *);

/* SD added THIS define to change
   strcmpi --> strcmp (strcmpi is NOT ANSI) */
#define strcmpi strcmp
