#ifdef __DJGPP__
/* They exist in DOS */
#include <process.h>
#else
/* Specially defined for UNIX and Cygwin */
int spawnv (int mode, const char *path, char *const argv[]);
int spawnvp (int mode, const char *path, char *const argv[]);

#define P_WAIT    1
#define P_NOWAIT  2		/* always generates error for DJGPP! */
#define P_OVERLAY 3

#endif
