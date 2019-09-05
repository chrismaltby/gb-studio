/* Various stuff needed to hack the build for SDCC. */
#define xmalloc(s) malloc(s)
#define xstrdup(s) strdup(s)
#define xrealloc(p,s) realloc(p,s)
#define xcalloc(n,e) calloc(n,e)
#define xmalloc_set_program_name(n) /* nada */
#define xstrerror(e) strerror(e)

extern char *lbasename(const char *path);

/* Define results of standard character escape sequences.  */
#define TARGET_BELL	007
#define TARGET_BS	010
#define TARGET_TAB	011
#define TARGET_NEWLINE	012
#define TARGET_VT	013
#define TARGET_FF	014
#define TARGET_CR	015

#define CHAR_TYPE_SIZE 8
#define WCHAR_TYPE_SIZE 32	/* ? maybe ? */

#define SUPPORTS_ONE_ONLY 0

#define TARGET_OBJECT_SUFFIX ".rel"

