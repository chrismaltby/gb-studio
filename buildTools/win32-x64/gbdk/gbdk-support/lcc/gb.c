/* Unix */

#include <stdio.h>
#include <string.h>
#include <assert.h>
#include <ctype.h>

#ifdef __WIN32__
#include <windows.h>
#endif

#ifndef GBDKLIBDIR
#define GBDKLIBDIR "\\gbdk\\"
#endif

extern char *progname;

typedef struct {
    const char *port;
    const char *plat;
    const char *default_plat;
    const char *cpp;
    const char *include;
    const char *com;
    const char *as;
    const char *ld;
} CLASS;

static struct {
    const char *name;
    const char *val;
} _tokens[] = {
    { "port",		"gbz80" },
    { "plat",		"gb" },
    { "cpp",		"%bindir%sdcpp" },
    { "cppdefault", 	"-Wall -lang-c++ -DSDCC=1 -DSDCC_PORT=%port% "
			"-DSDCC_PLAT=%plat% -D%cppmodel%"
    },
    { "cppmodel",	"SDCC_MODEL_SMALL" },
    { "includedefault",	"-I%includedir%" },
    { "includedir", 	"%prefix%include" },
    { "prefix",		GBDKLIBDIR },
    { "com",		"%bindir%sdcc" },
    { "comdefault",	"-m%port% %comopt% --nostdinc --nostdlib --model-%commodel% --c1mode" },
    { "comopt",		"--noinvariant --noinduction" },
    { "commodel", 	"small" },
    { "as",		"%bindir%as-%port%" },
    { "ld",		"%bindir%link-%port%" },
    { "libdir",		"%prefix%lib/%libmodel%/asxxxx/" },
    { "libmodel",	"small" },
    { "bindir",		"%prefix%bin/" },
};

#define NUM_TOKENS	(sizeof(_tokens)/sizeof(_tokens[0]))

static char *getTokenVal(const char *key)
{
    int i;
    for (i=0; i<NUM_TOKENS; i++) {
	if (!strcmp(_tokens[i].name, key)) 
	    return strdup(_tokens[i].val);
    }
    assert(0);
    return NULL;
}

static void setTokenVal(const char *key, const char *val)
{
    int i;
    for (i=0; i<NUM_TOKENS; i++) {
	if (!strcmp(_tokens[i].name, key)) {
	    _tokens[i].val = strdup(val);
	    return;
	}
    }
    assert(0);
}

static CLASS classes[] = {
    { "gbz80",
      "gb",
      "gb",
      "%cpp% %cppdefault% -DGB=1 -DGAMEBOY=1 -DINT_16_BITS $1 $2 $3",
      "%includedefault%",
      "%com% %comdefault% $1 $2 $3",
      "%as% -pog $1 $3 $2",
      "%ld% -n -- -z $1 -k%libdir%%port%/ -l%port%.lib "
        "-k%libdir%%plat%/ -l%plat%.lib $3 %libdir%%plat%/crt0.o $2",
    },
    { "z80",
      "afghan",
      "afghan",
      "%cpp% %cppdefault% $1 $2 $3",
      "%includedefault%",
      "%com% %comdefault% $1 $2 $3",
      "%as% -pog $1 $3 $2",
      "%ld% -n -- -i $1 -b_CODE=0x8100 -k%libdir%%port%/ -l%port%.lib "
        "-k%libdir%%plat%/ -l%plat%.lib $3 %libdir%%plat%/crt0.o $2",
    },
    { "z80",
      NULL,
      "consolez80",
      "%cpp% %cppdefault% $1 $2 $3",
      "-I%includedir%/gbdk-lib",
      "%com% %comdefault% $1 $2 $3",
      "%as% -pog $1 $3 $2",
      "%ld% -n -- -i $1 -b_DATA=0x8000 -b_CODE=0x200 -k%libdir%%port%/ -l%port%.lib "
        "-k%libdir%%plat%/ -l%plat%.lib $3 %libdir%%plat%/crt0.o $2",
    }
};      

static CLASS *_class = &classes[0];

#define NUM_CLASSES 	(sizeof(classes)/sizeof(classes[0]))

static int setClass(const char *port, const char *plat)
{
    int i;
    for (i=0; i<NUM_CLASSES; i++) {
	if (!strcmp(classes[i].port, port)) {
	    if (plat && classes[i].plat && !strcmp(classes[i].plat, plat)) {
		_class = classes + i;
		return 1;
	    }
	    else if (!classes[i].plat || !plat) {
		_class = classes + i;
		return 1;
	    }
	}
    }
    return 0;
}

/* Algorithim
   while (chars in string)
   	if space, concat on end
	if %
		Copy off what we have sofar
		Call ourself on value of token
		Continue scanning
*/
	      
/* src is destroyed */
static char **subBuildArgs(char **args, char *template)
{
    char *src = template;
    char *last = src;
    /* Shared buffer between calls of this function. */
    static char buffer[128];
    static int indent = 0;

    indent++;
    while (*src) {
	if (isspace(*src)) {
	    /* End of set - add in the command */
	    *src = '\0';
	    strcat(buffer, last);
	    *args = strdup(buffer);
	    buffer[0] = '\0';
	    args++;
	    last = src+1;
	}
	else if (*src == '%') {
	    /* Again copy off what we already have */
	    *src = '\0';
	    strcat(buffer, last);
	    *src = '%';
	    src++;
	    last = src;
	    while (*src != '%') {
		if (!*src) {
		    /* End of string without closing % */
		    assert(0);
		}
		src++;
	    }
	    *src = '\0';
	    /* And recurse :) */
	    args = subBuildArgs(args, getTokenVal(last));
	    *src = '%';
	    last = src+1;
	}
	src++;
    }
    strcat(buffer, last);
    if (indent == 1) {
	*args = strdup(buffer);
	args++;
	buffer[0] = '\0';
    }

    indent--;
    return args;
}

static void buildArgs(char **args, const char *template)
{
    char *s = strdup(template);
    char **last;
    last = subBuildArgs(args, s);
    *last = NULL;
}

char *suffixes[] = { ".c", ".i", ".asm;.s", ".o;.obj", ".ihx.gb", 0 };
char inputs[256] = "";

char *cpp[256];
char *include[256];
char *com[256] = { "", "", "" };
char *as[256];
char *ld[256];

const char *starts_with(const char *s1, const char *s2)
{
    if (!strncmp(s1, s2, strlen(s2))) {
	return s1+strlen(s2);
    }
    return NULL;
}

int option(char *arg) {
    const char *tail;
    if ((tail = starts_with(arg, "--prefix="))) {
	/* Go through and set all of the paths */
	setTokenVal("prefix", tail);
	return 1;
    }
    else if ((tail = starts_with(arg, "--gbdklibdir="))) {
	setTokenVal("libdir", tail);
	return 1;
    }
    else if ((tail = starts_with(arg, "--gbdkincludedir="))) {
	setTokenVal("includedir", tail);
	return 1;
    }
    else if ((tail = starts_with(arg, "-m"))) {
	/* Split it up into a asm/port pair */
	char *slash = strchr(tail, '/');
	if (slash) {
	    *slash++ = '\0';
	    setTokenVal("plat", slash);
	}
	setTokenVal("port", tail);
	if (!setClass(tail, slash)) {
	    *(slash-1) = '/';
	    fprintf(stderr, "%s: unrecognised port/platform from %s\n", progname, arg);
	    exit(-1);
	}
	return 1;
    }
    else if ((tail = starts_with(arg, "--model-"))) {
	if (!strcmp(tail, "small")) {
	    setTokenVal("commodel", "small");
	    setTokenVal("libmodel", "small");
	    setTokenVal("cppmodel", "SDCC_MODEL_SMALL");
	    return 1;
	}
	else if (!strcmp(tail, "medium")) {
	    setTokenVal("commodel", "medium");
	    setTokenVal("libmodel", "medium");
	    setTokenVal("cppmodel", "SDCC_MODEL_MEDIUM");
	    return 1;
	}
    }
    return 0;
}

void finalise(void)
{
    if (!_class->plat) {
	setTokenVal("plat", _class->default_plat);
    }
    buildArgs(cpp, _class->cpp);
    buildArgs(include, _class->include);
    buildArgs(com, _class->com);
    buildArgs(as, _class->as);
    buildArgs(ld, _class->ld);
}

void set_gbdk_dir(void)
{
#ifdef __WIN32__
    char buf[1024];
    if (GetModuleFileName(NULL,buf, sizeof(buf)) != 0) {
	/* Strip of the trailing bin/lcc.exe and use it as the prefix. */
	char *p = strrchr(buf, '\\');
	if (p) {
	    *p = '\0';
	    p = strrchr(buf, '\\');
	    if (p) {
		*++p = '\0';
		setTokenVal("prefix", buf);
	    }
	}
    }
#endif
}
