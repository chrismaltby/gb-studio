/*-------------------------------------------------------------------------
  BuildCmd - SDCC Support function

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

/*! Build a command line with parameter substitution
*/

#include <string.h>
#include <assert.h>

void
buildCmdLine (char *into, const char **cmds,
	      const char *p1, const char *p2,
	      const char *p3, const char **list)
{
  const char *p, *from;

  *into = '\0';

  while (*cmds)
    {
      from = *cmds;
      cmds++;

      /* See if it has a '$' anywhere - if not, just copy */
      if ((p = strchr (from, '$')))
	{
	  strncat (into, from, p - from);
	  /* seperate it */
	  strcat (into, " ");
	  from = p + 2;
	  p++;
	  switch (*p)
	    {
	    case '1':
	      if (p1)
		strcat (into, p1);
	      break;
	    case '2':
	      if (p2)
		strcat (into, p2);
	      break;
	    case '3':
	      if (p3)
		strcat (into, p3);
	      break;
	    case 'l':
	      {
		const char **tmp = list;
		if (tmp)
		  {
		    while (*tmp)
		      {
			strcat (into, *tmp);
			strcat (into, " ");
			tmp++;
		      }
		  }
		break;
	      }
	    default:
	      assert (0);
	    }
	}
      strcat (into, from);	// this includes the ".asm" from "$1.asm"

      strcat (into, " ");
    }
}

