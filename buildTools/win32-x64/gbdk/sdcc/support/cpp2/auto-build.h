/* auto-host.h.  Generated from config.in by configure.  */
/* config.in.  Generated automatically from configure.in by autoheader.  */

#ifdef __BORLANDC__

#include "borland.h"

#else
/* Define to empty if the keyword does not work.  */
/* #undef const */

/* Define to `int' if <sys/types.h> doesn't define.  */
/* #undef gid_t */

/* Define if you have the ANSI # stringizing operator in cpp. */
#define HAVE_STRINGIZE 1

/* Define if you have <sys/wait.h> that is POSIX.1 compatible.  */
/* #undef HAVE_SYS_WAIT_H */

/* Define if you have <vfork.h>.  */
/* #undef HAVE_VFORK_H */

/* Define as __inline if that's what the C compiler calls it.  */
/* #undef inline */

/* Define if your C compiler doesn't accept -c and -o together.  */
/* #undef NO_MINUS_C_MINUS_O */

/* Define to `long' if <sys/types.h> doesn't define.  */
/* #undef off_t */

/* Define to `int' if <sys/types.h> doesn't define.  */
/* #undef pid_t */

/* Define to `unsigned' if <sys/types.h> doesn't define.  */
/* #undef size_t */

/* Define if you have the ANSI C header files.  */
#define STDC_HEADERS 1

/* Define if you can safely include both <sys/time.h> and <time.h>.  */
#define TIME_WITH_SYS_TIME 1

/* Define to `int' if <sys/types.h> doesn't define.  */
/* #undef uid_t */

/* Define vfork as fork if vfork does not work.  */
/* #undef vfork */

/* Define as 1 if you have the stpcpy function.  */
/* #undef HAVE_STPCPY */

/* Define to `int' if <sys/types.h> doesn't define.  */
/* #undef ssize_t */

/* Define if you have the atoll function.  */
/* #undef HAVE_ATOLL */

/* Define if you have the atoq function.  */
/* #undef HAVE_ATOQ */

/* Define if you have the clock function.  */
#define HAVE_CLOCK 1

/* Define if you have the dcgettext function.  */
/* #undef HAVE_DCGETTEXT */

/* Define if you have the getpagesize function.  */
#define HAVE_GETPAGESIZE 1

/* Define if you have the getrlimit function.  */
/* #undef HAVE_GETRLIMIT */

/* Define if you have the getrusage function.  */
/* #undef HAVE_GETRUSAGE */

/* Define if you have the kill function.  */
/* #undef HAVE_KILL */

/* Define if you have the lstat function.  */
/* #undef HAVE_LSTAT */

/* Define if you have the munmap function.  */
/* #undef HAVE_MUNMAP */

/* Define if you have the nl_langinfo function.  */
/* #undef HAVE_NL_LANGINFO */

/* Define if you have the putenv function.  */
/* #undef HAVE_PUTENV */

/* Define if you have the setenv function.  */
/* #undef HAVE_SETENV */

/* Define if you have the setlocale function.  */
/* #undef HAVE_SETLOCALE */

/* Define if you have the setrlimit function.  */
/* #undef HAVE_SETRLIMIT */

/* Define if you have the stpcpy function.  */
/* #undef HAVE_STPCPY */

/* Define if you have the strcasecmp function.  */
/* #undef HAVE_STRCASECMP */

/* Define if you have the strchr function.  */
#define HAVE_STRCHR 1

/* Define if you have the strdup function.  */
/* #undef HAVE_STRDUP */

/* Define if you have the strrchr function.  */
#define HAVE_STRRCHR 1

/* Define if you have the strstr function.  */
/* #undef HAVE_STRSTR */

/* Define if you have the times function.  */
/* #undef HAVE_TIMES */

/* Define if you have the <argz.h> header file.  */
/* #undef HAVE_ARGZ_H */

/* Define if you have the <direct.h> header file.  */
#define HAVE_DIRECT_H 1

/* Define if you have the <fcntl.h> header file.  */
#define HAVE_FCNTL_H 1

/* Define if you have the <iconv.h> header file.  */
/* #undef HAVE_ICONV_H */

/* Define if you have the <langinfo.h> header file.  */
/* #undef HAVE_LANGINFO_H */

/* Define if you have the <limits.h> header file.  */
#define HAVE_LIMITS_H 1

/* Define if you have the <locale.h> header file.  */
/* #undef HAVE_LOCALE_H */

/* Define if you have the <malloc.h> header file.  */
#define HAVE_MALLOC_H 1

/* Define if you have the <nl_types.h> header file.  */
/* #undef HAVE_NL_TYPES_H */

/* Define if you have the <stddef.h> header file.  */
#define HAVE_STDDEF_H 1

/* Define if you have the <stdlib.h> header file.  */
#define HAVE_STDLIB_H 1

/* Define if you have the <string.h> header file.  */
#define HAVE_STRING_H 1

/* Define if you have the <strings.h> header file.  */
#define HAVE_STRINGS_H 1

/* Define if you have the <sys/file.h> header file.  */
#define HAVE_SYS_FILE_H 1

/* Define if you have the <sys/param.h> header file.  */
#define HAVE_SYS_PARAM_H 1

/* Define if you have the <sys/resource.h> header file.  */
/* #undef HAVE_SYS_RESOURCE_H */

/* Define if you have the <sys/stat.h> header file.  */
#define HAVE_SYS_STAT_H 1

/* Define if you have the <sys/time.h> header file.  */
#define HAVE_SYS_TIME_H 1

/* Define if you have the <sys/times.h> header file.  */
/* #undef HAVE_SYS_TIMES_H */

/* Define if you have the <time.h> header file.  */
#define HAVE_TIME_H 1

/* Define if you have the <unistd.h> header file.  */
#define HAVE_UNISTD_H 1

/* Define if you have the i library (-li).  */
/* #undef HAVE_LIBI */

/* Define to enable the use of a default linker. */
/* #undef DEFAULT_LINKER */

/* Define to enable the use of a default assembler. */
/* #undef DEFAULT_ASSEMBLER */

/* Define if you want more run-time sanity checks.  This one gets a grab
   bag of miscellaneous but relatively cheap checks. */
/* #undef ENABLE_CHECKING */

/* Define if you want all operations on trees (the basic data
   structure of the front ends) to be checked for dynamic type safety
   at runtime.  This is moderately expensive. */
/* #undef ENABLE_TREE_CHECKING */

/* Define if you want all operations on RTL (the basic data structure
   of the optimizer and back end) to be checked for dynamic type safety
   at runtime.  This is quite expensive. */
/* #undef ENABLE_RTL_CHECKING */

/* Define if you want the garbage collector to do object poisoning and
   other memory allocation checks.  This is quite expensive. */
/* #undef ENABLE_GC_CHECKING */

/* Define if you want the garbage collector to operate in maximally
   paranoid mode, validating the entire heap and collecting garbage at
   every opportunity.  This is extremely expensive. */
/* #undef ENABLE_GC_ALWAYS_COLLECT */

/* Define if you want the C and C++ compilers to support multibyte
   character sets for source code. */
/* #undef MULTIBYTE_CHARS */

/* Define if your compiler understands volatile. */
/* #undef HAVE_VOLATILE */

/* Define if your compiler supports the `long double' type. */
/* #undef HAVE_LONG_DOUBLE */

/* The number of bytes in type short */
#define SIZEOF_SHORT 2

/* The number of bytes in type int */
#define SIZEOF_INT 4

/* The number of bytes in type long */
#define SIZEOF_LONG 4

/* Define if the host execution character set is EBCDIC. */
/* #undef HOST_EBCDIC */

/* Always define this when using the GNU C Library */
/* #undef _GNU_SOURCE */

/* Define if you have a working <stdbool.h> header file. */
/* #undef HAVE_STDBOOL_H */

/* Define if you can safely include both <string.h> and <strings.h>. */
#define STRING_WITH_STRINGS 1

/* Define as the number of bits in a byte, if `limits.h' doesn't. */
/* #undef CHAR_BIT */

/* Define if the host machine stores words of multi-word integers in
   big-endian order. */
/* #undef HOST_WORDS_BIG_ENDIAN */

/* Define to the floating point format of the host machine, if not IEEE. */
/* #undef HOST_FLOAT_FORMAT */

/* Define to 1 if the host machine stores floating point numbers in
   memory with the word containing the sign bit at the lowest address,
   or to 0 if it does it the other way around.

   This macro should not be defined if the ordering is the same as for
   multi-word integers. */
/* #undef HOST_FLOAT_WORDS_BIG_ENDIAN */

/* Define if you have a working <inttypes.h> header file. */
#define HAVE_INTTYPES_H 1

/* Define if printf supports %p. */
/* #undef HAVE_PRINTF_PTR */

/* Define if mmap can get us zeroed pages from /dev/zero. */
/* #undef HAVE_MMAP_DEV_ZERO */

/* Define if mmap can get us zeroed pages using MAP_ANON(YMOUS). */
/* #undef HAVE_MMAP_ANON */

/* Define if read-only mmap of a plain file works. */
/* #undef HAVE_MMAP_FILE */

/* Define to 1 if we found this declaration otherwise define to 0. */
#define HAVE_DECL_GETENV 0

/* Define to 1 if we found this declaration otherwise define to 0. */
#define HAVE_DECL_ABORT 0

/* Define to 1 if we found this declaration otherwise define to 0. */
#define HAVE_DECL_ERRNO 0

/* Define to 1 if we found this declaration otherwise define to 0. */
#define HAVE_DECL_MALLOC 0

/* Define to 1 if we found this declaration otherwise define to 0. */
#define HAVE_DECL_REALLOC 0

/* Define to 1 if we found this declaration otherwise define to 0. */
#define HAVE_DECL_CALLOC 0

/* Define to 1 if we found this declaration otherwise define to 0. */
#define HAVE_DECL_FREE 0

/* Define to 1 if we found this declaration otherwise define to 0. */
/* #undef HAVE_DECL_BASENAME */

/* Define to 1 if we found this declaration otherwise define to 0. */
#define HAVE_DECL_GETOPT 0

/* Define to 1 if we found this declaration otherwise define to 0. */
#define HAVE_DECL_CLOCK 0

/* Define to 1 if we found this declaration otherwise define to 0. */
/* #undef HAVE_DECL_GETRLIMIT */

/* Define to 1 if we found this declaration otherwise define to 0. */
/* #undef HAVE_DECL_SETRLIMIT */

/* Define to 1 if we found this declaration otherwise define to 0. */
/* #undef HAVE_DECL_GETRUSAGE */

/* Define to 1 if we found this declaration otherwise define to 0. */
#define HAVE_DECL_TIMES 0

/* Define if <sys/times.h> defines struct tms. */
/* #undef HAVE_STRUCT_TMS */

/* Define if <time.h> defines clock_t. */
/* #undef HAVE_CLOCK_T */

/* Define if host mkdir takes a single argument. */
#define MKDIR_TAKES_ONE_ARG 1

/* Define to the name of the distribution. */
#define PACKAGE "sdcc"

/* Define to the version of the distribution. */
#define VERSION "3.1"

/* Define to 1 if installation paths should be looked up in Windows32
   Registry. Ignored on non windows32 hosts. */
/* #undef ENABLE_WIN32_REGISTRY */

/* Define to be the last portion of registry key on windows hosts. */
/* #undef WIN32_REGISTRY_KEY */

/* Define if your assembler supports .subsection and .subsection -1 starts
   emitting at the beginning of your section. */
/* #undef HAVE_GAS_SUBSECTION_ORDERING */

/* Define if your assembler supports .weak. */
/* #undef HAVE_GAS_WEAK */

/* Define if your assembler supports .hidden. */
/* #undef HAVE_GAS_HIDDEN */

/* Define if your assembler supports .uleb128. */
/* #undef HAVE_AS_LEB128 */

/* Define if your assembler mis-optimizes .eh_frame data. */
/* #undef USE_AS_TRADITIONAL_FORMAT */

/* Define if your assembler supports .register. */
/* #undef HAVE_AS_REGISTER_PSEUDO_OP */

/* Define if your assembler supports -relax option. */
/* #undef HAVE_AS_RELAX_OPTION */

/* Define if the assembler supports 64bit sparc. */
/* #undef AS_SPARC64_FLAG */

/* Define if your assembler supports offsetable %lo(). */
/* #undef HAVE_AS_OFFSETABLE_LO10 */

/* Define if your assembler supports dwarf2 .file/.loc directives,
   and preserves file table indicies exactly as given. */
/* #undef HAVE_AS_DWARF2_DEBUG_LINE */

/* Define 0/1 to force the choice for exception handling model. */
/* #undef CONFIG_SJLJ_EXCEPTIONS */


/* Bison unconditionally undefines `const' if neither `__STDC__' nor
   __cplusplus are defined.  That's a problem since we use `const' in
   the GCC headers, and the resulting bison code is therefore type
   unsafe.  Thus, we must match the bison behavior here.  */

#ifndef __STDC__
#ifndef __cplusplus
/* #undef const */
#define const
#endif
#endif
#endif /* !__BORLANDC__ */
