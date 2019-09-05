/**[txh]********************************************************************

  Module: Spawn replacement for UNIXes
  Description:
  This module provides spawnv and spawnvp functions for UNIX.@*
  Copyright 1999 by Salvador E. Tropea. You can use it under the terms of
the GPL license. e-mail: salvador@inti.gov.ar, set@computer.org

  Include: spawn.h

***************************************************************************/

#ifndef __DJGPP__
#ifndef __MINGW32__

#include <unistd.h>
#include <sys/wait.h>
#include "spawn.h"

/**[txh]********************************************************************

  Description:
  That's a replacement for the DOS spawnv function which was POSIX during
the drafts but then was removed. It avoids the need of the fork/exec/wait
sequence which doesn't work for djgpp.

***************************************************************************/

int 
spawnv (int mode, const char *path, char *const argv[])
{
  int pStatus;

  if (mode == P_OVERLAY)
    return execv (path, argv);
  if (!fork ())
    {
      if (execv (path, argv))
	return -1;
    }
  if (mode == P_WAIT)
    wait (&pStatus);
  return 0;
}

/**[txh]********************************************************************

  Description:
  Same as spawnv but using execvp. @x{spawnv}.

***************************************************************************/

int 
spawnvp (int mode, const char *path, char *const argv[])
{
  int pStatus;

  if (mode == P_OVERLAY)
    return execv (path, argv);
  if (!fork ())
    {
      if (execvp (path, argv))
	return -1;
    }
  if (mode == P_WAIT)
    wait (&pStatus);
  return 0;
}
#endif
#endif
