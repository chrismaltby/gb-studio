/*-------------------------------------------------------------------------
  MySystem - SDCC Support function

             Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1999)

   This program is free software; you can redistribute it and/or modify it
   under the terms of the GNU General Public License as published by the
   Free Software Foundation; either version 2, or (at your option) any
   later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.

   In other words, you are welcome to use, share and improve this program.
   You are forbidden to forbid anyone else to use, share and improve
   what you give them.   Help stamp out software-hoarding!
-------------------------------------------------------------------------*/

#include "common.h"
#include "newalloc.h"
#if defined(_MSC_VER)
#include <io.h>
#else
#include <sys/stat.h>
#endif


#if !defined(__BORLANDC__) && !defined(_MSC_VER)
#include <unistd.h>
#else
// No unistd.h in Borland C++
extern int access (const char *, int);
#define X_OK 1
#endif

/*!
Call an external program with arguements
*/

//char *ExePathList[]= {SRCDIR "/bin",PREFIX "/bin", NULL};
char *ExePathList[] = {NULL, NULL};			/* First entry may be overwritten, so use two. */

int
my_system (const char *cmd)
{
  int argsStart, e, i = 0;
  char *cmdLine = NULL;

  argsStart = strstr (cmd, " ") - cmd;

  // try to find the command in predefined path's
  while (ExePathList[i])
    {
      cmdLine = (char *) Safe_alloc (strlen (ExePathList[i]) + strlen (cmd) + 10);
      strcpy (cmdLine, ExePathList[i]);	// the path

      strcat (cmdLine, DIR_SEPARATOR_STRING);
      strncat (cmdLine, cmd, argsStart);	// the command

#if NATIVE_WIN32
      strcat (cmdLine, ".exe");
#endif

      if (access (cmdLine, X_OK) == 0)
	{
	  // the arguments
	  strcat (cmdLine, cmd + argsStart);
	  break;
	}
      Safe_free (cmdLine);
      cmdLine = NULL;
      i++;
    }

  if (verboseExec)
    {
      printf ("+ %s\n", cmdLine ? cmdLine : cmd);
    }

  if (cmdLine)
    {
      // command found in predefined path
      e = system (cmdLine);
      Safe_free (cmdLine);
    }
  else
    {
      // trust on $PATH
      e = system (cmd);
    }
  return e;
}

