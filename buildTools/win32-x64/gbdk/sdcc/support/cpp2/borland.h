#ifndef CPP2_BORLAND_H_
#define CPP2_BORLAND_H_

/* Define values for Borland makefile which are detected by configure
 * on better behaved platforms.
 * 
 * This is the equivalent of auto-host.h.
 */

#include "sdcc.h"

#define HAVE_STRINGIZE
#define STDC_HEADERS
#define PACKAGE "sdcc"
#define LOCALEDIR ""
#define PREFIX ""
#define inline
#define SIZEOF_INT 4
#define SIZEOF_LONG 4
#define HAVE_TIME_H 1
#define HAVE_STRING_H 1
#define HAVE_SYS_STAT_H 1
#define HAVE_STDLIB_H 1
#define ssize_t int
#define __STDC__ 1
#define alloca(x) calloc(1,(x))

#endif
