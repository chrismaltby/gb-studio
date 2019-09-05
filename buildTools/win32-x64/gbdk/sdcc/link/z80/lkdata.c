/* lkdata.c */

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
//#include <alloc.h>
#include "aslink.h"

/*)Module	lkdata.c
 *
 *	The module lkdata contains the global variables
 *	and structures used in the linker aslink.
 */

/*
 *	Definitions for all Global Variables
 */

char	*_abs_	= { ".  .ABS." };

int	lkerr;		/*	Linker error flag
			 */
char	*ip;		/*	Pointer into the REL file text line in ib[]
			 */
char	ib[NINPUT];	/*	REL file text line
			 */
char	*rp;		/*	pointer into the LST file
			 *	text line in rb[]
			 */
char	rb[NINPUT];	/*	LST file text line being
			 *	address relocated
			 */
int	oflag;		/*	Output file type flag
			 */
int	mflag;		/*	Map output flag
			 */
#ifdef SDK
int	symflag;	/*	no$gmb .sym output flag
			 */
#endif
int	xflag;		/*	Map file radix type flag
			 */
int	pflag;		/*	print linker command file flag
			 */
int	uflag;		/*	Listing relocation flag
			 */
int	radix;		/*	current number conversion radix:
			 *	2 (binary), 8 (octal), 10 (decimal),
			 *	16 (hexadecimal)
			 */
int	line;		/*	current line number
			 */
int	page;		/*	current page number
			 */
int	lop;		/*	current line number on page
			 */
int	pass;		/*	linker pass number
			 */
int	rtcnt;		/*	count of elements in the
			 *	rtval[] and rtflg[] arrays
			 */
Addr_T	rtval[NTXT];	/*	data associated with relocation
			 */
int	rtflg[NTXT];	/*	indicates if rtval[] value is
			 *	to be sent to the output file.
			 *	(always set in this linker)
			 */
int	hilo;		/*	REL file byte ordering
			 */
int	gline;		/*	LST file relocation active
			 *	for current line
			 */
int	gcntr;		/*	LST file relocation active
			 *	counter
			 */

/*
 *	The structure lfile contains a pointer to a
 *	file specification string, the file type, and
 *	a link to the next lfile structure.
 *
 *	struct	lfile
 *	{
 *		struct	lfile	*f_flp;		lfile link
 *		int	f_type;			File type
 *		char	*f_idp;			Pointer to file spec
 *	};
 */
struct	lfile	*filep;	/*	The pointers (lfile *) filep,
			 *	(lfile *) cfp, and (FILE *) sfp
			 *	are used in conjunction with
			 *	the routine getline() to read
			 *	asmlnk commands from
			 *	(1) the standard input or
			 *	(2) or a command file
			 *	and to read the REL files
			 *	sequentially as defined by the
			 *	asmlnk input commands.
			 *
			 *	The pointer *filep points to the
			 *	beginning of a linked list of
			 *	lfile structures.
			 */
struct	lfile	*cfp;	/*	The pointer *cfp points to the
			 *	current lfile structure
			 */
struct	lfile	*startp;/*	asmlnk startup file structure
			 */
struct	lfile	*linkp;	/*	pointer to first lfile structure
			 *	containing an input REL file
			 *	specification
			 */
struct	lfile	*lfp;	/*	pointer to current lfile structure
			 *	being processed by parse()
			 */
FILE	*ofp;		/*	Output file handle
			 *	for word formats
			 */
FILE	*mfp;		/*	Map output file handle
			 */
FILE	*rfp;		/*	File handle for output
			 *	address relocated ASxxxx
			 *	listing file
			 */
FILE	*sfp;		/*	The file handle sfp points to the
			 *	currently open file
			 */
FILE	*tfp;		/*	File handle for input
			 *	ASxxxx listing file
			 */

/*
 *	The structures of head, area, areax, and sym are created
 *	as the REL files are read during the first pass of the
 *	linker.  The struct head is created upon encountering a
 *	H directive in the REL file.  The structure contains a
 *	link to a link file structure (struct lfile) which describes
 *	the file containing the H directive, the number of data/code
 *	areas contained in this header segment, the number of
 *	symbols referenced/defined in this header segment, a pointer
 *	to an array of pointers to areax structures (struct areax)
 *	created as each A directive is read, and a pointer to an
 *	array of pointers to symbol structures (struct sym) for
 *	all referenced/defined symbols.  As H directives are read
 *	from the REL files a linked list of head structures is
 *	created by placing a link to the new head structure
 *	in the previous head structure.
 *
 *	struct	head
 *	{
 *		struct	head   *h_hp;		Header link
 *		struct	lfile  *h_lfile;	Associated file
 *		int	h_narea;		# of areas
 *		struct	areax **a_list;		Area list
 *		int	h_nglob;		# of global symbols
 *		struct	sym   **s_list;		Global symbol list
 *		char	m_id[NCPS];		Module name
 *	};
 */
struct	head	*headp;	/*	The pointer to the first
			 *	head structure of a linked list
			 */
struct	head	*hp;	/*	Pointer to the current
			 *	head structure
			 */

/*
 *	A structure area is created for each 'unique' data/code
 *	area definition found as the REL files are read.  The
 *	struct area contains the name of the area, a flag byte
 *	which contains the area attributes (REL/CON/OVR/ABS),
 *	an area subtype (not used in this assembler), and the
 *	area base address and total size which will be filled
 *	in at the end of the first pass through the REL files.
 *	As A directives are read from the REL files a linked
 *	list of unique area structures is created by placing a
 *	link to the new area structure in the previous area structure.
 *
 *	struct	area
 *	{
 *		struct	area	*a_ap;		Area link
 *		struct	areax	*a_axp;		Area extension link
 *		Addr_T	a_addr;			Beginning address of area
 *		Addr_T	a_size;			Total size of the area
 *		char	a_type;			Area subtype
 *		char	a_flag;			Flag byte
 *		char	a_id[NCPS];		Name
 *	};
 */
struct	area	*areap;	/*	The pointer to the first
			 *	area structure of a linked list
			 */
struct	area	*ap;	/*	Pointer to the current
			 *	area structure
			 */

/*
 *	An areax structure is created for every A directive found
 *	while reading the REL files.  The struct areax contains a
 *	link to the 'unique' area structure referenced by the A
 *	directive and to the head structure this area segment is
 *	a part of.  The size of this area segment as read from the
 *	A directive is placed in the areax structure.  The beginning
 *	address of this segment will be filled in at the end of the
 *	first pass through the REL files.  As A directives are read
 *	from the REL files a linked list of areax structures is
 *	created for each unique area.  The final areax linked
 *	list has at its head the 'unique' area structure linked
 *	to the linked areax structures (one areax structure for
 *	each A directive for this area).
 *
 *	struct	areax
 *	{
 *		struct	areax	*a_axp;		Area extension link
 *		struct	area	*a_bap;		Base area link
 *		struct	head	*a_bhp;		Base header link
 *		Addr_T	a_addr;			Beginning address of section
 *		Addr_T	a_size;			Size of the area in section
 *	};
 */
struct	areax	*axp;	/*	Pointer to the current
			 *	areax structure
			 */

/*
 *	A sym structure is created for every unique symbol
 *	referenced/defined while reading the REL files.  The
 *	struct sym contains the symbol's name, a flag value
 *	(not used in this linker), a symbol type denoting
 *	referenced/defined, and an address which is loaded
 *	with the relative address within the area in which
 *	the symbol was defined.  The sym structure also
 *	contains a link to the area where the symbol was defined.
 *	The sym structures are linked into linked lists using
 *	the symbol link element.
 *
 *	struct	sym
 *	{
 *		struct	sym	*s_sp;		Symbol link
 *		struct	areax	*s_axp;		Symbol area link
 *		char	s_type;			Symbol subtype
 *		char	s_flag;			Flag byte
 *		Addr_T	s_addr;			Address
 *		char	s_id[NCPS];		Name
 *	};
 */
struct	sym *symhash[NHASH]; /*	array of pointers to NHASH
			      *	linked symbol lists
			      */
/*
 *	The struct base contains a pointer to a
 *	base definition string and a link to the next
 *	base structure.
 *
 *	struct	base
 *	{
 *		struct	base  *b_base;		Base link
 *		char	      *b_strp;		String pointer
 *	};
 */
struct	base	*basep;	/*	The pointer to the first
			 *	base structure
			 */
struct	base	*bsp;	/*	Pointer to the current
			 *	base structure
			 */

/*
 *	The struct globl contains a pointer to a
 *	global definition string and a link to the next
 *	global structure.
 *
 *	struct	globl
 *	{
 *		struct	globl *g_globl;		Global link
 *		char	      *g_strp;		String pointer
 *	};
 */
struct	globl	*globlp;/*	The pointer to the first
			 *	globl structure
			 */
struct	globl	*gsp;	/*	Pointer to the current
			 *	globl structure
			 */

/*
 *	A structure sdp is created for each 'unique' paged
 *	area definition found as the REL files are read.
 *	As P directives are read from the REL files a linked
 *	list of unique sdp structures is created by placing a
 *	link to the new sdp structure in the previous area structure.
 *
 *	struct	sdp
 *	{
 *		struct	area  *s_area;	Paged Area link
 *		struct	areax *s_areax;	Paged Area Extension Link
 *		Addr_T	s_addr;		Page address offset
 *	};
 */
struct	sdp	sdp;	/* Base Page Structure */

/*
 *	The structure rerr is loaded with the information
 *	required to report an error during the linking
 *	process.  The structure contains an index value
 *	which selects the areax structure from the header
 *	areax structure list, a mode value which selects
 *	symbol or area relocation, the base address in the
 *	area section, an area/symbol list index value, and
 *	an area/symbol offset value.
 *
 *	struct	rerr
 *	{
 *		int	aindex;		Linking area
 *		int	mode;		Relocation mode
 *		Addr_T	rtbase;		Base address in section
 *		int	rindex;		Area/Symbol reloaction index
 *		Addr_T	rval;		Area/Symbol offset value
 *	};
 */
struct	rerr	rerr;	/*	Structure containing the
			 *	linker error information
			 */

/*
 *	The structure lbpath is created for each library
 *	path specification input by the -k option.  The
 *	lbpath structures are linked into a list using
 *	the next link element.
 *
 *	struct lbpath {
 *		struct	lbpath	*next;
 *		char		*path;
 *	};
 */
struct	lbpath	*lbphead;	/*	pointer to the first
				 *	library path structure
				 */

/*
 *	The structure lbname is created for all combinations of the
 *	library path specifications (input by the -k option) and the
 *	library file specifications (input by the -l option) that
 *	lead to an existing file.  The element path points to
 *	the path string, element libfil points to the library
 *	file string, and the element libspc is the concatenation
 *	of the valid path and libfil strings.
 *
 *	The lbpath structures are linked into a list
 *	using the next link element.
 *
 *	Each library file contains a list of object files
 *	that are contained in the particular library. e.g.:
 *
 *		\iolib\termio
 *		\inilib\termio
 *
 *	Only one specification per line is allowed.
 *
 *	struct lbname {
 *		struct	lbname	*next;
 *		char		*path;
 *		char		*libfil;
 *		char		*libspc;
 *	};
 */
struct	lbname	*lbnhead;	/*	pointer to the first
				 *	library name structure
				 */

/*
 *	The function fndsym() searches through all combinations of the
 *	library path specifications (input by the -k option) and the
 *	library file specifications (input by the -l option) that
 *	lead to an existing file for a symbol definition.
 *
 *	The structure lbfile is created for the first library
 *	object file which contains the definition for the
 *	specified undefined symbol.
 *
 *	The element libspc points to the library file path specification
 *	and element relfil points to the object file specification string.
 *	The element filspc is the complete path/file specification for
 *	the library file to be imported into the linker.  The
 *	file specicifation may be formed in one of two ways:
 *
 *	(1)	If the library file contained an absolute
 *		path/file specification then this becomes filspc.
 *		(i.e. C:\...)
 *
 *	(2)	If the library file contains a relative path/file
 *		specification then the concatenation of the path
 *		and this file specification becomes filspc.
 *		(i.e. \...)
 *
 *	The lbpath structures are linked into a list
 *	using the next link element.
 *
 *	struct lbfile {
 *		struct	lbfile	*next;
 *		char		*libspc;
 *		char		*relfil;
 *		char		*filspc;
 *	};
 */
struct	lbfile	*lbfhead;	/*	pointer to the first
				 *	library file structure
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
