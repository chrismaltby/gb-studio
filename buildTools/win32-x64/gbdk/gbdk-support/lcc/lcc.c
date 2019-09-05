/*
 * lcc [ option ]... [ file | -llib ]...
 * front end for the ANSI C compiler
 */
static char rcsid[] = "$Id: lcc.c,v 1.6 2001/10/28 18:38:13 michaelh Exp $";

#include <stdio.h>
#include <stdarg.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <ctype.h>
#include <signal.h>

#ifndef TEMPDIR
#define TEMPDIR "/tmp"
#endif

typedef struct list *List;
struct list {		/* circular list nodes: */
	char *str;		/* option or file name */
	List link;		/* next list element */
};

static void *alloc(int);
List append(char *,List);
extern char *basepath(char *);
static int callsys(char *[]);
extern char *concat(const char *, const char *);
static int compile(char *, char *);
static void compose(char *[], List, List, List);
static void error(char *, char *);
static char *exists(char *);
static char *first(char *);
static int filename(char *, char *);
static List find(char *, List);
static void help(void);
static void initinputs(void);
static void interrupt(int);
static void opt(char *);
static List path2list(const char *);
extern int main(int, char *[]);
extern char *replace(const char *, int, int);
static void rm(List);
extern char *strsave(const char *);
extern char *stringf(const char *, ...);
extern int suffix(char *, char *[], int);
extern char *tempname(char *);

extern int access(char *, int);
extern int getpid(void);

extern char *cpp[], *include[], *com[], *as[],*ld[], inputs[], *suffixes[];
extern int option(char *);
extern void set_gbdk_dir(void);

void finalise(void);

static int errcnt;		/* number of errors */
static int Eflag;		/* -E specified */
static int Sflag;		/* -S specified */
static int cflag;		/* -c specified */
static int verbose;		/* incremented for each -v */
static List llist[2];		/* loader files, flags */
static List alist;		/* assembler flags */
List clist;		/* compiler flags */
static List plist;		/* preprocessor flags */
static List ilist;		/* list of additional includes from LCCINPUTS */
static List rmlist;		/* list of files to remove */
static char *outfile;		/* ld output file or -[cS] object file */
static int ac;			/* argument count */
static char **av;		/* argument vector */
char *tempdir = TEMPDIR;	/* directory for temporary files */
char *progname;
static List lccinputs;		/* list of input directories */

int main(int argc, char *argv[]) {
	int i, j, nf;
	
	progname = argv[0];
	ac = argc + 50;
	av = alloc(ac*sizeof(char *));
	if (signal(SIGINT, SIG_IGN) != SIG_IGN)
		signal(SIGINT, interrupt);
	if (signal(SIGTERM, SIG_IGN) != SIG_IGN)
		signal(SIGTERM, interrupt);
#ifdef SIGHUP
	if (signal(SIGHUP, SIG_IGN) != SIG_IGN)
		signal(SIGHUP, interrupt);
#endif
	if (getenv("TMP"))
		tempdir = getenv("TMP");
	else if (getenv("TEMP"))
		tempdir = getenv("TEMP");
	else if (getenv("TMPDIR"))
		tempdir = getenv("TMPDIR");
	assert(tempdir);
	i = strlen(tempdir);
	for (; i > 0 && tempdir[i-1] == '/' || tempdir[i-1] == '\\'; i--)
		tempdir[i-1] = '\0';
	if (argc <= 1) {
		help();
		exit(0);
	}
	plist = append("-D__LCC__", 0);
	initinputs();
	if (getenv("GBDKDIR"))
	        option(stringf("--prefix=%s", getenv("GBDKDIR")));
	else
	    set_gbdk_dir();
	for (nf = 0, i = j = 1; i < argc; i++) {
		if (strcmp(argv[i], "-o") == 0) {
			if (++i < argc) {
				if (suffix(argv[i], suffixes, 2) >= 0) {
					error("-o would overwrite %s", argv[i]);
					exit(8);
				}
				outfile = argv[i];
				continue;
			} else {
				error("unrecognized option `%s'", argv[i-1]);
				exit(8);
			}
		} else if (strcmp(argv[i], "-target") == 0) {
			if (argv[i+1] && *argv[i+1] != '-')
				i++;
			continue;
		} else if (*argv[i] == '-' && argv[i][1] != 'l') {
			opt(argv[i]);
			continue;
		} else if (*argv[i] != '-' && suffix(argv[i], suffixes, 3) >= 0)
			nf++;
		argv[j++] = argv[i];
	}
	if ((cflag || Sflag) && outfile && nf != 1) {
		fprintf(stderr, "%s: -o %s ignored\n", progname, outfile);
		outfile = 0;
	}
	argv[j] = 0;
	finalise();
	for (i = 0; include[i]; i++)
		plist = append(include[i], plist);
	if (ilist) {
		List b = ilist;
		do {
			b = b->link;
			plist = append(b->str, plist);
		} while (b != ilist);
	}
	ilist = 0;
	for (i = 1; argv[i]; i++)
		if (*argv[i] == '-')
			opt(argv[i]);
		else {
			char *name = exists(argv[i]);
			if (name) {
				if (strcmp(name, argv[i]) != 0
				|| nf > 1 && suffix(name, suffixes, 3) >= 0)
					fprintf(stderr, "%s:\n", name);
				filename(name, 0);
			} else
				error("can't find `%s'", argv[i]);
		}
	if (errcnt == 0 && !Eflag && !Sflag && !cflag && llist[1]) {
		compose(ld, llist[0], llist[1],
			append(outfile ? outfile : concat("a", first(suffixes[4])), 0));
		if (callsys(av))
			errcnt++;
	}
	rm(rmlist);	
	return errcnt ? EXIT_FAILURE : EXIT_SUCCESS;
}

/* alloc - allocate n bytes or die */
static void *alloc(int n) {
	static char *avail, *limit;
	
	n = (n + sizeof(char *) - 1)&~(sizeof(char *) - 1);
	if (n >= limit - avail) {
		avail = malloc(n + 4*1024);
		assert(avail);
		limit = avail + n + 4*1024;
	}
	avail += n;
	return avail - n;
}

/* append - append a node with string str onto list, return new list */	
List append(char *str, List list) {
	List p = alloc(sizeof *p);

	p->str = str;
	if (list) {
		p->link = list->link;
		list->link = p;
	} else
		p->link = p;
	return p;
}

/* basepath - return base name for name, e.g. /usr/drh/foo.c => foo */
char *basepath(char *name) {
	char *s, *b, *t = 0;

	for (b = s = name; *s; s++)
		if (*s == '/' || *s == '\\') {
			b = s + 1;
			t = 0;
		} else if (*s == '.')
			t = s;
	s = strsave(b);
	if (t)
		s[t-b] = 0;
	return s;
}

#ifdef WIN32
#include <process.h>
#else
#define _P_WAIT 0
extern int fork(void);
extern int wait(int *);
extern void execv(const char *, char *[]);

static int _spawnvp(int mode, const char *cmdname, char *argv[]) {
	int pid, n, status;

	switch (pid = fork()) {
	case -1:
		fprintf(stderr, "%s: no more processes\n", progname);
		return 100;
	case 0:
		execv(cmdname, argv);
		fprintf(stderr, "%s: ", progname);
		perror(cmdname);
		fflush(stdout);
		exit(100);
	}
	while ((n = wait(&status)) != pid && n != -1)
		;
	if (n == -1)
		status = -1;
	if (status&0377) {
		fprintf(stderr, "%s: fatal error in %s\n", progname, cmdname);
		status |= 0400;
	}
	return (status>>8)&0377;
}
#endif

/* callsys - execute the command described by av[0...], return status */
static int callsys(char **av) {
	int i, status = 0;
	static char **argv;
	static int argc;

	for (i = 0; av[i] != NULL; i++)
		;
	if (i + 1 > argc) {
		argc = i + 1;
		if (argv == NULL)
			argv = malloc(argc*sizeof *argv);
		else
			argv = realloc(argv, argc*sizeof *argv);
		assert(argv);
	}
	for (i = 0; status == 0 && av[i] != NULL; ) {
		int j = 0;
		char *s;
		for ( ; av[i] != NULL && (s = strchr(av[i], '\n')) == NULL; i++)
			argv[j++] = av[i];
		if (s != NULL) {
			if (s > av[i])
				argv[j++] = stringf("%.*s", s - av[i], av[i]);
			if (s[1] != '\0')
				av[i] = s + 1;
			else
				i++;
		}
		argv[j] = NULL;
		if (verbose > 0) {
			int k;
			fprintf(stderr, "%s", argv[0]);
			for (k = 1; argv[k] != NULL; k++)
				fprintf(stderr, " %s", argv[k]);
			fprintf(stderr, "\n");
		}
		if (verbose < 2)
			status = _spawnvp(_P_WAIT, argv[0], argv);
		if (status == -1) {
			fprintf(stderr, "%s: ", progname);
			perror(argv[0]);
		}
	}
	return status;
}

/* concat - return concatenation of strings s1 and s2 */
char *concat(const char *s1, const char *s2) {
	int n = strlen(s1);
	char *s = alloc(n + strlen(s2) + 1);

	strcpy(s, s1);
	strcpy(s + n, s2);
	return s;
}

/* compile - compile src into dst, return status */
static int compile(char *src, char *dst) {
	compose(com, clist, append(src, 0), append(dst, 0));
	return callsys(av);
}

/* compose - compose cmd into av substituting a, b, c for $1, $2, $3, resp. */
static void compose(char *cmd[], List a, List b, List c) {
	int i, j;
	List lists[3];

	lists[0] = a;
	lists[1] = b;
	lists[2] = c;
	for (i = j = 0; cmd[i]; i++) {
		char *s = strchr(cmd[i], '$');
		if (s && isdigit(s[1])) {
			int k = s[1] - '0';
			assert(k >=1 && k <= 3);
			if (b = lists[k-1]) {
				b = b->link;
				av[j] = alloc(strlen(cmd[i]) + strlen(b->str) - 1);
				strncpy(av[j], cmd[i], s - cmd[i]);
				av[j][s-cmd[i]] = '\0';
				strcat(av[j], b->str);
				strcat(av[j++], s + 2);
				while (b != lists[k-1]) {
					b = b->link;
					assert(j < ac);
					av[j++] = b->str;
				};
			}
		} else if (*cmd[i]) {
			assert(j < ac);
			av[j++] = cmd[i];
		}
	}
	av[j] = NULL;
}

/* error - issue error msg according to fmt, bump error count */
static void error(char *fmt, char *msg) {
	fprintf(stderr, "%s: ", progname);
	fprintf(stderr, fmt, msg);
	fprintf(stderr, "\n");
	errcnt++;
}

/* exists - if `name' readable return its path name or return null */
static char *exists(char *name) {
	List b;

	if ( (name[0] == '/' || name[0] == '\\' || name[2] == ':')
	&& access(name, 4) == 0)
		return name;
	if (!(name[0] == '/' || name[0] == '\\' || name[2] == ':')
	&& (b = lccinputs))		
		do {
			b = b->link;
			if (b->str[0]) {
				char buf[1024];
				sprintf(buf, "%s/%s", b->str, name);
				if (access(buf, 4) == 0)
					return strsave(buf);
			} else if (access(name, 4) == 0)
				return name;
		} while (b != lccinputs);
	if (verbose > 1)
		return name;
	return 0;
}

/* first - return first component in semicolon separated list */
static char *first(char *list) {
	char *s = strchr(list, ';');

	if (s) {
		char buf[1024];
		strncpy(buf, list, s-list);
		buf[s-list] = '\0';
		return strsave(buf);
	} else
		return list;
}

/* filename - process file name argument `name', return status */
static int filename(char *name, char *base) {
	int status = 0;
	static char *stemp, *itemp;

	if (base == 0)
		base = basepath(name);
	switch (suffix(name, suffixes, 4)) {
	case 0:	/* C source files */
		compose(cpp, plist, append(name, 0), 0);
		if (Eflag) {
			status = callsys(av);
			break;
		}
		if (itemp == NULL)
			itemp = tempname(first(suffixes[1]));
		compose(cpp, plist, append(name, 0), append(itemp, 0));
		status = callsys(av);
		if (status == 0)
			return filename(itemp, base);
		break;
	case 1:	/* preprocessed source files */
		if (Eflag)
			break;
		if (Sflag)
			status = compile(name, outfile ? outfile : concat(base, first(suffixes[2])));
		else if ((status = compile(name, stemp?stemp:(stemp=tempname(first(suffixes[2]))))) == 0)
			return filename(stemp, base);
		break;
	case 2:	/* assembly language files */
		if (Eflag)
			break;
		if (!Sflag) {
			char *ofile;
			if (cflag && outfile)
				ofile = outfile;
			else if (cflag)
				ofile = concat(base, first(suffixes[3]));
			else
				ofile = tempname(first(suffixes[3]));
			compose(as, alist, append(name, 0), append(ofile, 0));
			status = callsys(av);
			if (!find(ofile, llist[1]))
				llist[1] = append(ofile, llist[1]);
		}
		break;
	case 3:	/* object files */
		if (!find(name, llist[1]))
			llist[1] = append(name, llist[1]);
		break;
	default:
		if (Eflag) {
			compose(cpp, plist, append(name, 0), 0);
			status = callsys(av);
		}
		llist[1] = append(name, llist[1]);
		break;
	}
	if (status)
		errcnt++;
	return status;
}

/* find - find 1st occurrence of str in list, return list node or 0 */
static List find(char *str, List list) {
	List b;
	
	if (b = list)
		do {
			if (strcmp(str, b->str) == 0)
				return b;
		} while ((b = b->link) != list);
	return 0;
}

/* help - print help message */
static void help(void) {
	static char *msgs[] = {
"", " [ option | file ]...\n",
"	except for -l, options are processed left-to-right before files\n",
"	unrecognized options are taken to be linker options\n",
"-A	warn about nonANSI usage; 2nd -A warns more\n",
"-b	emit expression-level profiling code; see bprint(1)\n",
#ifdef sparc
"-Bstatic -Bdynamic	specify static or dynamic libraries\n",
#endif
"-Bdir/	use the compiler named `dir/rcc'\n",
"-c	compile only\n",
"-dn	set switch statement density to `n'\n",
"-Dname -Dname=def	define the preprocessor symbol `name'\n",
"-E	run only the preprocessor on the named C programs and unsuffixed files\n",
"-g	produce symbol table information for debuggers\n",
"-help or -?	print this message\n",
"-Idir	add `dir' to the beginning of the list of #include directories\n",	
"-lx	search library `x'\n",
"-N	do not search the standard directories for #include files\n",
"-n	emit code to check for dereferencing zero pointers\n",
"-O	is ignored\n",
"-o file	leave the output in `file'\n",
"-P	print ANSI-style declarations for globals\n",
"-p -pg	emit profiling code; see prof(1) and gprof(1)\n",
"-S	compile to assembly language\n",
#ifdef linux
"-static	specify static libraries (default is dynamic)\n",
#endif
"-t -tname	emit function tracing calls to printf or to `name'\n",
"-target name	is ignored\n",
"-tempdir=dir	place temporary files in `dir/'", "\n"
"-Uname	undefine the preprocessor symbol `name'\n",
"-v	show commands as they are executed; 2nd -v suppresses execution\n",
"-w	suppress warnings\n",
"-Woarg	specify system-specific `arg'\n",
"-W[pfal]arg	pass `arg' to the preprocessor, compiler, assembler, or linker\n",
	0 };
	int i;
	char *s;

	msgs[0] = progname;
	for (i = 0; msgs[i]; i++) {
		fprintf(stderr, "%s", msgs[i]);
		if (strncmp("-tempdir", msgs[i], 8) == 0 && tempdir)
			fprintf(stderr, "; default=%s", tempdir);
	}
#define xx(v) if (s = getenv(#v)) fprintf(stderr, #v "=%s\n", s)
	xx(LCCINPUTS);
	xx(LCCDIR);
#ifdef WIN32
	xx(include);
	xx(lib);
#endif
#undef xx
}

/* initinputs - if LCCINPUTS or include is defined, use them to initialize various lists */
static void initinputs(void) {
	char *s = getenv("LCCINPUTS");
	List list, b;

	if (s == 0 || (s = inputs)[0] == 0)
		s = ".";
	if (s) {
		lccinputs = path2list(s);
		if (b = lccinputs)
			do {
				b = b->link;
				if (strcmp(b->str, ".") != 0) {
					ilist = append(concat("-I", b->str), ilist);
					if (strstr(com[1], "win32") == NULL)
						llist[0] = append(concat("-L", b->str), llist[0]);
				} else
					b->str = "";
			} while (b != lccinputs);
	}
#ifdef WIN32
	if (list = b = path2list(getenv("include")))
		do {
			b = b->link;
			ilist = append(stringf("-I\"%s\"", b->str), ilist);
		} while (b != list);
#endif
}

/* interrupt - catch interrupt signals */
static void interrupt(int n) {
	rm(rmlist);
	exit(n = 100);
}

/* opt - process option in arg */
static void opt(char *arg) {
	switch (arg[1]) {	/* multi-character options */
	case 'W':	/* -Wxarg */
		if (arg[2] && arg[3])
			switch (arg[2]) {
			case 'o':
				if (option(&arg[3]))
					return;
				break;
			case 'p':
				plist = append(&arg[3], plist);
				return;
			case 'f':
				if (strcmp(&arg[3], "-C") || option("-b")) {
					clist = append(&arg[3], clist);
					return;
				}
				break; /* and fall thru */
			case 'a':
				alist = append(&arg[3], alist);
				return;
			case 'l':
				llist[0] = append(&arg[3], llist[0]);
				return;
			}
		fprintf(stderr, "%s: %s ignored\n", progname, arg);
		return;
	case 'd':	/* -dn */
		arg[1] = 's';
		clist = append(arg, clist);
		return;
	case 't':	/* -t -tname -tempdir=dir */
		if (strncmp(arg, "-tempdir=", 9) == 0)
			tempdir = arg + 9;
		else
			clist = append(arg, clist);
		return;
	case 'p':	/* -p -pg */
		if (option(arg))
			clist = append(arg, clist);
		else
			fprintf(stderr, "%s: %s ignored\n", progname, arg);
		return;
	case 'D':	/* -Dname -Dname=def */
	case 'U':	/* -Uname */
	case 'I':	/* -Idir */
		plist = append(arg, plist);
		return;
	case 'B':	/* -Bdir -Bstatic -Bdynamic */
#ifdef sparc
		if (strcmp(arg, "-Bstatic") == 0 || strcmp(arg, "-Bdynamic") == 0)
			llist[1] = append(arg, llist[1]);
		else
#endif	
		{
		static char *path;
		if (path)
			error("-B overwrites earlier option", 0);
		path = arg + 2;
		if (strstr(com[1], "win32") != NULL)
			com[0] = concat(replace(path, '/', '\\'), concat("rcc", first(suffixes[4])));
		else
			com[0] = concat(path, "rcc");
		if (path[0] == 0)
			error("missing directory in -B option", 0);
		}
		return;
	case 'h':
		if (strcmp(arg, "-help") == 0) {
			static int printed = 0;
	case '?':
			if (!printed)
				help();
			printed = 1;
			return;
		}
#ifdef linux
	case 's':
		if (strcmp(arg,"-static") == 0) {
			if (!option(arg))
				fprintf(stderr, "%s: %s ignored\n", progname, arg);
			return;
		}
#endif         
	}
	if (arg[2] == 0)
		switch (arg[1]) {	/* single-character options */
		case 'S':
			Sflag++;
			return;
		case 'O':
			fprintf(stderr, "%s: %s ignored\n", progname, arg);
			return;
		case 'A': case 'n': case 'w': case 'P':
			clist = append(arg, clist);
			return;
		case 'g': case 'b':
			if (option(arg))
				clist = append(arg[1] == 'g' ? "-g2" : arg, clist);
			else
				fprintf(stderr, "%s: %s ignored\n", progname, arg);
			return;
		case 'G':
			if (option(arg)) {
				clist = append("-g3", clist);
				llist[0] = append("-N", llist[0]);
			} else
				fprintf(stderr, "%s: %s ignored\n", progname, arg);
			return;
		case 'E':
			Eflag++;
			return;
		case 'c':
			cflag++;
			return;
		case 'N':
			if (strcmp(basepath(cpp[0]), "gcc-cpp") == 0)
				plist = append("-nostdinc", plist);
			include[0] = 0;
			ilist = 0;
			return;
		case 'v':
			if (verbose++ == 0) {
#if 0
			    /* GBDK removed */
				if (strcmp(basepath(cpp[0]), "gcc-cpp") == 0)
					plist = append(arg, plist);
				clist = append(arg, clist);
#endif
				fprintf(stderr, "%s %s\n", progname, rcsid);
			}
			return;
		}
	if (option(arg))
	    return;
	if (cflag || Sflag || Eflag)
		fprintf(stderr, "%s: %s ignored\n", progname, arg);
	else
		llist[1] = append(arg, llist[1]);
}

/* path2list - convert a colon- or semicolon-separated list to a list */
static List path2list(const char *path) {
	List list = NULL;
	char sep = ':';

	if (path == NULL)
		return NULL;
	if (strchr(path, ';'))
		sep = ';';
	while (*path) {
		char *p, buf[512];
		if (p = strchr(path, sep)) {
			assert(p - path < sizeof buf);
			strncpy(buf, path, p - path);
			buf[p-path] = '\0';
		} else {
			assert(strlen(path) < sizeof buf);
			strcpy(buf, path);
		}
		if (!find(buf, list))
			list = append(strsave(buf), list);
		if (p == 0)
			break;
		path = p + 1;
	}
	return list;
}

/* replace - copy str, then replace occurrences of from with to, return the copy */
char *replace(const char *str, int from, int to) {
	char *s = strsave(str), *p = s;

	for ( ; (p = strchr(p, from)) != NULL; p++)
		*p = to;
	return s;
}

/* rm - remove files in list */
static void rm(List list) {
	if (list) {
		List b = list;
		if (verbose)
			fprintf(stderr, "rm");
		do {
			if (verbose)
				fprintf(stderr, " %s", b->str);
			if (verbose < 2)
				remove(b->str);
		} while ((b = b->link) != list);
		if (verbose)
			fprintf(stderr, "\n");
	}
}

/* strsave - return a saved copy of string str */
char *strsave(const char *str) {
	return strcpy(alloc(strlen(str)+1), str);
}

/* stringf - format and return a string */
char *stringf(const char *fmt, ...) {
	char buf[1024];
	va_list ap;
	int n;

	va_start(ap, fmt);
	n = vsprintf(buf, fmt, ap);
	va_end(ap);
	return strsave(buf);
}

/* suffix - if one of tails[0..n-1] holds a proper suffix of name, return its index */
int suffix(char *name, char *tails[], int n) {
	int i, len = strlen(name);

	for (i = 0; i < n; i++) {
		char *s = tails[i], *t;
		for ( ; t = strchr(s, ';'); s = t + 1) {
			int m = t - s;
			if (len > m && strncmp(&name[len-m], s, m) == 0)
				return i;
		}
		if (*s) {
			int m = strlen(s);
			if (len > m && strncmp(&name[len-m], s, m) == 0)
				return i;
		}
	}
	return -1;
}

/* tempname - generate a temporary file name in tempdir with given suffix */
char *tempname(char *suffix) {
	static int n;
	char *name = stringf("%s/lcc%d%d%s", tempdir, getpid(), n++, suffix);

	if (strstr(com[1], "win32") != NULL)
		name = replace(name, '/', '\\');
	rmlist = append(name, rmlist);
	return name;
}
