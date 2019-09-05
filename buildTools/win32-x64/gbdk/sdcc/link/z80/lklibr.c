/* lklibr.c */

/*
 * (C) Copyright 1989-1995
 * All Rights Reserved
 *
 * Alan R. Baldwin
 * 721 Berkeley St.
 * Kent, Ohio  44240
 *
 * With contributions for the
 * object libraries from
 * Ken Hornstein
 * kenh@cmf.nrl.navy.mil
 *
 */

/*
 * Extensions: P. Felber
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "aslink.h"

/*)Module	lklibr.c
 *
 *	The module lklibr.c contains the functions which
 *	(1) specify the path(s) to library files [.LIB]
 *	(2) specify the library file(s) [.LIB] to search
 *	(3) search the library files for specific symbols
 *	    and link the module containing this symbol
 *
 *	lklibr.c contains the following functions:
 *		VOID	addpath()
 *		VOID	addlib()
 *		VOID	addfile()
 *		VOID	search()
 *		VOID	fndsym()
 *		VOID	library()
 *		VOID	loadfile()
 *
 */

#ifdef INDEXLIB
typedef struct slibrarysymbol mlibrarysymbol;
typedef struct slibrarysymbol *pmlibrarysymbol;

struct slibrarysymbol {
	char name[40];
	pmlibrarysymbol next;
};

typedef struct slibraryfile mlibraryfile;
typedef struct slibraryfile *pmlibraryfile;

struct slibraryfile {
	int loaded;
	char *libspc;
	char *str;
	char relfil[FILSPC];
	char filename[FILSPC];
	pmlibrarysymbol symbols;
	pmlibraryfile next;
};

int buildlibraryindex();
#endif /* INDEXLIB */

/*)Function	VOID	addpath()
 *
 *	The function addpath() creates a linked structure containing
 *	the paths to various object module library files.
 *
 *	local variables:
 *		lbpath	*lbph		pointer to new path structure
 *		lbpath	*lbp		temporary pointer
 *
 *	global variables:
 *		lbpath	*lbphead	The pointer to the first
 *				 	path structure
 *
 *	 functions called:
 *		char	getnb()		lklex.c
 *		VOID *	new()		lksym.c
 *		int	strlen()	c_library
 *		char *	strcpy()	c_library
 *		VOID	unget()		lklex.c
 *
 *	side effects:
 *		An lbpath structure may be created.
 */

VOID
addpath()
{
	struct lbpath *lbph, *lbp;

	lbph = (struct lbpath *) new (sizeof(struct lbpath));
	if (lbphead == NULL) {
		lbphead = lbph;
	} else {
		lbp = lbphead;
		while (lbp->next)
			lbp = lbp->next;
		lbp->next = lbph;
	}
	unget(getnb());
	lbph->path = (char *) new (strlen(ip)+1);
	strcpy(lbph->path, ip);
}

/*)Function	VOID	addlib()
 *
 *	The function addlib() tests for the existance of a
 *	library path structure to determine the method of
 *	adding this library file to the library search structure.
 *
 *	This function calls the function addfile() to actually
 *	add the library file to the search list.
 *
 *	local variables:
 *		lbpath	*lbph		pointer to path structure
 *
 *	global variables:
 *		lbpath	*lbphead	The pointer to the first
 *				 	path structure
 *
 *	 functions called:
 *		VOID	addfile()	lklibr.c
 *		char	getnb()		lklex.c
 *		VOID	unget()		lklex.c
 *
 *	side effects:
 *		The function addfile() may add the file to
 *		the library search list.
 */

VOID
addlib()
{
	struct lbpath *lbph;

	unget(getnb());

	if (lbphead == NULL) {
		addfile(NULL,ip);
		return;
	}	
	for (lbph=lbphead; lbph; lbph=lbph->next) {
		addfile(lbph->path,ip);
	}
}

/*)Function	VOID	addfile(path,libfil)
 *
 *		char	*path		library path specification
 *		char	*libfil		library file specification
 *
 *	The function addfile() searches for the library file
 *	by concatenating the path and libfil specifications.
 *	if the library is found, an lbname structure is created
 *	and linked to any previously defined structures.  This
 *	linked list is used by the function fndsym() to attempt
 *	to find any undefined symbols.
 *
 *	The function does not give report an error on invalid
 *	path / file specifications or if the file is not found.
 *
 *	local variables:
 *		lbname	*lbnh		pointer to new name structure
 *		lbname	*lbn		temporary pointer
 *
 *	global variables:
 *		lbname	*lbnhead	The pointer to the first
 *				 	path structure
 *
 *	 functions called:
 *		char	getnb()		lklex.c
 *		VOID *	new()		lksym.c
 *		int	strlen()	c_library
 *		char *	strcpy()	c_library
 *		VOID	unget()		lklex.c
 *
 *	side effects:
 *		An lbname structure may be created.
 */

VOID
addfile(path,libfil)
char *path;
char *libfil;
{
	FILE *fp;
	char *str;
	struct lbname *lbnh, *lbn;

	if ((path != NULL) && (strchr(libfil,':') == NULL)){
		str = (char *) new (strlen(path) + strlen(libfil) + 6);
		strcpy(str,path);
#ifdef	OTHERSYSTEM
#ifdef SDK
#ifdef UNIX
		if (str[strlen(str)-1] != '/') {
			strcat(str,"/");
#else /* UNIX */
		if (str[strlen(str)-1] != '\\') {
			strcat(str,"\\");
#endif /* UNIX */
#else /* SDK */
		if (str[strlen(str)-1] != '\\') {
			strcat(str,"\\");
#endif /* SDK */
		}
#endif
	} else {
		str = (char *) new (strlen(libfil) + 5);
	}
#ifdef	OTHERSYSTEM
#ifdef SDK
#ifdef UNIX
	if (libfil[0] == '/') { libfil++; }
#else /* UNIX */
	if (libfil[0] == '\\') { libfil++; }
#endif /* UNIX */
#else /* SDK */
	if (libfil[0] == '\\') { libfil++; }
#endif /* SDK */
#endif
	strcat(str,libfil);
	if(strchr(str,FSEPX) == NULL) {
		sprintf(&str[strlen(str)], "%clib", FSEPX);
	}
	if ((fp = fopen(str, "r")) != NULL) {
		fclose(fp);
		lbnh = (struct lbname *) new (sizeof(struct lbname));
		if (lbnhead == NULL) {
			lbnhead = lbnh;
		} else {
			lbn = lbnhead;
			while (lbn->next)
				lbn = lbn->next;
			lbn->next = lbnh;
		}
		if ((path != NULL) && (strchr(libfil,':') == NULL)){
			lbnh->path = path;
		}
		lbnh->libfil = (char *) new (strlen(libfil) + 1);
		strcpy(lbnh->libfil,libfil);
		lbnh->libspc = str;
	} else {
		free(str);
	}
}

/*)Function	VOID	search()
 *
 *	The function search() looks through all the symbol tables
 *	at the end of pass 1.  If any undefined symbols are found
 *	then the function fndsym() is called. Function fndsym()
 *	searches any specified library files to automagically
 *	import the object modules containing the needed symbol.
 *
 *	After a symbol is found and imported by the function
 *	fndsym() the symbol tables are again searched.  The
 *	symbol tables are search until no more symbols can be
 *	resolved within the library files.  This ensures that
 *	back references from one library module to another are
 *	also resolved.
 *
 *	local variables:
 *		int	i		temporary counter
 *		sym	*sp		pointer to a symbol structure
 *		int	symfnd		found a symbol flag
 *
 *	global variables:
 *		sym	*symhash[]	array of pointers to symbol tables
 *
 *	 functions called:
 *		int	fndsym()	lklibr.c
 *
 *	side effects:
 *		If a symbol is found then the library object module
 *		containing the symbol will be imported and linked.
 */

VOID
search()
{
	register struct sym *sp;
	register int i, symfnd;

	/*
	 * Look for undefined symbols.  Keep
	 * searching until no more symbols are resolved.
	 */
	symfnd = 1;
	while (symfnd) {
		symfnd = 0;
		/*
		 * Look through all the symbols
		 */
		for (i=0; i<NHASH; ++i) {
			sp = symhash[i];
			while (sp) {
				/* If we find an undefined symbol
				 * (one where S_DEF is not set), then
				 * try looking for it.  If we find it
				 * in any of the libraries then
				 * increment symfnd.  This will force
				 * another pass of symbol searching and
				 * make sure that back references work.
				 */
				if ((sp->s_type & S_DEF) == 0) {
					if (fndsym(sp->s_id)) {
						symfnd++;
					}
				}
				sp = sp->s_sp;
			}
		}
	}
}


/*)Function	VOID	fndsym(name)
 *
 *		char	*name		symbol name to find
 *
 *	The function fndsym() searches through all combinations of the
 *	library path specifications (input by the -k option) and the
 *	library file specifications (input by the -l option) that
 *	lead to an existing file.
 *
 *	The file specicifation may be formed in one of two ways:
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
 *	The structure lbfile is created for the first library
 *	object file which contains the definition for the
 *	specified undefined symbol.
 *
 *	If the library file [.LIB] contains file specifications for
 *	non existant files, no errors are returned.
 *
 *	local variables:
 *		char	buf[]		[.REL] file input line
 *		char	c		[.REL] file input character
 *		FILE	*fp		file handle for object file
 *		lbfile	*lbf		temporary pointer
 *		lbfile	*lbfh		pointer to lbfile structure
 *		FILE	*libfp		file handle for library file
 *		lbname	*lbnh		pointer to lbname structure
 *		char	*path		file specification path
 *		char	relfil[]	[.REL] file specification
 *		char	*str		combined path and file specification
 *		char	symname[]	[.REL] file symbol string
 *
 *	global variables:
 *		lbname	*lbnhead	The pointer to the first
 *				 	name structure
 *		lbfile	*lbfhead	The pointer to the first
 *				 	file structure
 *
 *	 functions called:
 *		int	fclose()	c_library
 *		int	fgets()		c_library
 *		FILE	*fopen()	c_library
 *		VOID	free()		c_library
 *		char	getnb()		lklex.c
 *		VOID	lkexit()	lkmain.c
 *		VOID	loadfile()	lklibr.c
 *		VOID *	new()		lksym.c
 *		char *	sprintf()	c_library
 *		int	sscanf()	c_library
 *		char *	strcat()	c_library
 *		char *	strchr()	c_library
 *		char *	strcpy()	c_library
 *		int	strlen()	c_library
 *		int	strncmp()	c_library
 *		VOID	unget()		lklex.c
 *
 *	side effects:
 *		If the symbol is found then a new lbfile structure
 *		is created and added to the linked list of lbfile
 *		structures.  The file containing the found symbol
 *		is linked.
 */

#ifdef INDEXLIB

/* First entry in the library object symbol cache */
mlibraryfile libr;

int fndsym( char *name )
{
	struct lbfile *lbfh, *lbf;
	pmlibraryfile ThisLibr;
	pmlibrarysymbol ThisSym = NULL;

	/* Build the index if this is the first call to fndsym */
	if (libr.next==NULL)
		buildlibraryindex();
	
	/* Iterate through all library object files */
	ThisLibr = libr.next;
	while (ThisLibr) {

		/* Iterate through all symbols in an object file */
		ThisSym = ThisLibr->symbols->next;

		while (ThisSym) {
			if (!strcmp(ThisSym->name, name)) {
				if (!ThisLibr->loaded) {
					/* Object file is not loaded - add it to the list */
					lbfh = (struct lbfile *) new (sizeof(struct lbfile));
					if (lbfhead == NULL) {
						lbfhead = lbfh;
					} else {
						lbf = lbfhead;
						while (lbf->next)
						lbf = lbf->next;
						lbf->next = lbfh;
					}
					lbfh->libspc = ThisLibr->libspc;
					lbfh->filspc = ThisLibr->str;
					lbfh->relfil = (char *) new (strlen(ThisLibr->relfil) + 1);
					strcpy(lbfh->relfil,ThisLibr->relfil);
					loadfile(lbfh->filspc);
					ThisLibr->loaded=1;
				}
				return (1);	/* Found the symbol, return */
			}
			ThisSym=ThisSym->next;  /* Next sym in library */
		}
		ThisLibr=ThisLibr->next; /* Next library in list */
	}
	return 0;	/* Failure - symbol not found in any library */
};

/* buildlibraryindex - build an in-memory cache of the symbols contained in
 *			the libraries
 */

int buildlibraryindex()
{
	FILE *libfp, *fp;
	struct lbname *lbnh;
	char relfil[NINPUT+2], *str, *path;
	char buf[NINPUT+2], c;
	char symname[NINPUT+2];
	pmlibraryfile This;
	pmlibrarysymbol ThisSym;

	This=&libr;

	/* Iterate through all library files */
/*1*/	for (lbnh=lbnhead; lbnh; lbnh=lbnh->next) {
		libfp = fopen( lbnh->libspc, "r" );
		if (libfp) {
			path=lbnh->path;

			/*
			 * Read in a line from the library file.
			 * This is the relative file specification
			 * for a .REL file in this library.
			 */

/*2*/			while (fgets(relfil, NINPUT, libfp) != NULL) {
				relfil[NINPUT+1] = '\0';
				relfil[strlen(relfil) - 1] = '\0';
				if (path != NULL) {
					str = (char *)new(strlen(path)+strlen(relfil)+6);
					strcpy(str,path);
#ifdef	OTHERSYSTEM
#ifdef SDK
#ifdef UNIX
					if (str[strlen(str)-1] != '/') {
						strcat(str,"/");
#else /* UNIX */
					if (str[strlen(str)-1] != '\\') {
						strcat(str,"\\");
#endif /* UNIX */
#else /* SDK */
					if (str[strlen(str)-1] != '\\') {
						strcat(str,"\\");
#endif /* SDK */
					}
#endif
				} else {
					str = (char *)new(strlen(relfil) + 5);
				}
#ifdef SDK
#ifdef UNIX
				if (relfil[0] == '/') {
#else /* UNIX */
				if (relfil[0] == '\\') {
#endif /* UNIX */
#else /* SDK */
				if (relfil[0] == '\\') {
#endif /* SDK */
					strcat(str,relfil+1);
				} else {
					strcat(str,relfil);
				}
				if(strchr(str,FSEPX) == NULL) {
#ifdef SDK
					sprintf(&str[strlen(str)], "%co", FSEPX);
#else /* SDK */
					sprintf(&str[strlen(str)], "%crel", FSEPX);
#endif /* SDK */
				}
/*3*/				if ((fp = fopen(str, "r")) != NULL) {

					/* Opened OK - create a new libraryfile object for it */
					This->next = (pmlibraryfile)new( sizeof( mlibraryfile ));
					if (This->next == NULL) {
						printf("panic: cant allocate memory.\n");
						exit(-1);
					}

					This=This->next;
					This->next = NULL;
					This->loaded=-1;

					strcpy( This->filename, str );

					ThisSym = This->symbols = (pmlibrarysymbol)malloc( sizeof(mlibrarysymbol));
					ThisSym->next = NULL;

					/*
					 * Read in the object file.  Look for lines that
					 * begin with "S" and end with "D".  These are
					 * symbol table definitions.  If we find one, see
					 * if it is our symbol.  Make sure we only read in
					 * our object file and don't go into the next one.
					 */
			
/*4*/					while (fgets(buf, NINPUT, fp) != NULL) {

					buf[NINPUT+1] = '\0';
					buf[strlen(buf) - 1] = '\0';

					/*
					 * Skip everything that's not a symbol record.
					 */
					if (buf[0] != 'S')
						continue;

					/*
					 * When a 'T line' is found terminate file scan.
					 * All 'S line's preceed 'T line's in .REL files.
					 */
					if (buf[0] == 'T')
						break;

					sscanf(buf, "S %s %c", symname, &c);

					/* If it's an actual symbol, record it */
/*5*/					if (c == 'D') {
						ThisSym->next = (pmlibrarysymbol)malloc(sizeof(mlibrarysymbol));
						ThisSym=ThisSym->next;
						if (ThisSym == NULL) {
							printf("panic: cant allocate memory.\n");
							exit(-2);
						}
						This->loaded=0;
						ThisSym->next=NULL;
						This->str = str;
						strcpy(This->relfil,relfil);
						strcpy(ThisSym->name, symname);
						This->libspc = lbnh->libspc;
					}
				} /* Closes while - read object file */
				fclose(fp);
			} /* Closes if object file opened OK */
		} /* Ends while - processing all in libr */
		fclose(libfp);
	} /* Ends good open of libr file */
	}
	return 0;
}
#else /* INDEXLIB */

int
fndsym(name)
char *name;
{
	FILE *libfp, *fp;
	struct lbname *lbnh;
	struct lbfile *lbfh, *lbf;
	char relfil[NINPUT+2];
	char buf[NINPUT+2];
	char symname[NINPUT];
	char *path,*str;
	char c;

	/*
	 * Search through every library in the linked list "lbnhead".
	 */

/*1*/	for (lbnh=lbnhead; lbnh; lbnh=lbnh->next) {
		if ((libfp = fopen(lbnh->libspc, "r")) == NULL) {
			fprintf(stderr, "Cannot open library file %s\n",
				lbnh->libspc);
			lkexit(1);
		}
		path = lbnh->path;

		/*
		 * Read in a line from the library file.
		 * This is the relative file specification
		 * for a .REL file in this library.
		 */

/*2*/		while (fgets(relfil, NINPUT, libfp) != NULL) {
		    relfil[NINPUT+1] = '\0';
		    relfil[strlen(relfil) - 1] = '\0';
		    if (path != NULL) {
			str = (char *) new (strlen(path)+strlen(relfil)+6);
			strcpy(str,path);
#ifdef	OTHERSYSTEM
#ifdef SDK
#ifdef UNIX
			if (str[strlen(str)-1] != '/') {
				strcat(str,"/");
#else /* UNIX */
			if (str[strlen(str)-1] != '\\') {
				strcat(str,"\\");
#endif /* UNIX */
#else /* SDK */
			if (str[strlen(str)-1] != '\\') {
				strcat(str,"\\");
#endif /* SDK */
			}
#endif
		    } else {
			str = (char *) new (strlen(relfil) + 5);
		    }
#ifdef SDK
#ifdef UNIX
		    if (relfil[0] == '/') {
#else /* UNIX */
		    if (relfil[0] == '\\') {
#endif /* UNIX */
#else /* SDK */
		    if (relfil[0] == '\\') {
#endif /* SDK */
			strcat(str,relfil+1);
		    } else {
			strcat(str,relfil);
		    }
		    if(strchr(str,FSEPX) == NULL) {
#ifdef SDK
			sprintf(&str[strlen(str)], "%co", FSEPX);
#else /* SDK */
			sprintf(&str[strlen(str)], "%crel", FSEPX);
#endif /* SDK */
		    }
/*3*/		    if ((fp = fopen(str, "r")) != NULL) {

			/*
			 * Read in the object file.  Look for lines that
			 * begin with "S" and end with "D".  These are
			 * symbol table definitions.  If we find one, see
			 * if it is our symbol.  Make sure we only read in
			 * our object file and don't go into the next one.
			 */
			
/*4*/			while (fgets(buf, NINPUT, fp) != NULL) {

			buf[NINPUT+1] = '\0';
			buf[strlen(buf) - 1] = '\0';

			/*
			 * Skip everything that's not a symbol record.
			 */
			if (buf[0] != 'S')
				continue;

			/*
			 * When a 'T line' is found terminate file scan.
			 * All 'S line's preceed 'T line's in .REL files.
			 */
			if (buf[0] == 'T')
				break;

			sscanf(buf, "S %s %c", symname, &c);

			/*
			 * If we find a symbol definition for the
			 * symbol we're looking for, load in the
			 * file and add it to lbfhead so it gets
			 * loaded on pass number 2.
			 */
/*5*/			if (strncmp(symname, name, NCPS) == 0 && c == 'D') {

			lbfh = (struct lbfile *) new (sizeof(struct lbfile));
			if (lbfhead == NULL) {
				lbfhead = lbfh;
			} else {
				lbf = lbfhead;
				while (lbf->next)
					lbf = lbf->next;
				lbf->next = lbfh;
			}
			lbfh->libspc = lbnh->libspc;
			lbfh->filspc = str;
			lbfh->relfil = (char *) new (strlen(relfil) + 1);
			strcpy(lbfh->relfil,relfil);
			fclose(fp);
			fclose(libfp);
			loadfile(str);
			return (1);

/*5*/			}

/*4*/			}
		    fclose(fp);
/*3*/		    }

		    free(str);
/*2*/		}
		fclose(libfp);
/*1*/	}
	return(0);
}
#endif /* INDEXLIB */

/*)Function	VOID	library()
 *
 *	The function library() links all the library object files
 *	contained in the lbfile structures.
 *
 *	local variables:
 *		lbfile	*lbfh		pointer to lbfile structure
 *
 *	global variables:
 *		lbfile	*lbfhead	pointer to first lbfile structure
 *
 *	 functions called:
 *		VOID	loadfile	lklibr.c
 *
 *	side effects:
 *		Links all files contained in the lbfile structures.
 */

VOID
library()
{
	struct lbfile *lbfh;

	for (lbfh=lbfhead; lbfh; lbfh=lbfh->next) {
		loadfile(lbfh->filspc);
	}
}

/*)Function	VOID	loadfile(filspc)
 *
 *		char	*filspc		library object file specification
 *
 *	The function loadfile() links the library object module.
 *
 *	local variables:
 *		FILE	*fp		file handle
 *		int	i		input line length
 *		char	str[]		file input line
 *
 *	global variables:
 *		char	*ip		pointer to linker input string
 *
 *	 functions called:
 *		int	fclose()	c_library
 *		int	fgets()		c_library
 *		FILE *	fopen()		c_library
 *		VOID	link()		lkmain.c
 *		int	strlen()	c_library
 *
 *	side effects:
 *		If file exists it is linked.
 */

VOID
loadfile(filspc)
char *filspc;
{
	FILE *fp;
	char str[NINPUT+2];
	int i;

	if ((fp = fopen(filspc,"r")) != NULL) {
		while (fgets(str, NINPUT, fp) != NULL) {
			str[NINPUT+1] = '\0';
			i = strlen(str) - 1;
			if (str[i] == '\n')
				str[i] = '\0';
			ip = str;
			link();
		}
		fclose(fp);
	}
}
