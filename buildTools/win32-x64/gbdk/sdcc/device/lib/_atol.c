/*---------------------------------------------------------------------
   atol - convert a string to long integer and return it

   written By -  Sandeep Dutta . sandeep.dutta@usa.net (1999)

   This library is free software; you can redistribute it and/or modify it
   under the terms of the GNU Library General Public License as published by the
   Free Software Foundation; either version 2, or (at your option) any
   later version.

   This library is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU Library General Public License for more details.

   You should have received a copy of the GNU Library General Public License
   along with this program; if not, write to the Free Software
   Foundation, 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.

   In other words, you are welcome to use, share and improve this program.
   You are forbidden to forbid anyone else to use, share and improve
   what you give them.   Help stamp out software-hoarding!
-------------------------------------------------------------------------*/

long atol(char * s)
{
     register long rv=0; 
     register char sign = 0;

     /* skip till we find either a digit or '+' or '-' */
     while (*s) {
	if (*s <= '9' && *s >= '0')
		break;
	if (*s == '-' || *s == '+') 
		break;
	s++;
     } 	  

     sign = (*s == '-');
     if (*s == '-' || *s == '+') s++;

     while (*s && *s >= '0' && *s <= '9') {
	rv = (rv * 10) + (*s - '0');
        s++;
     }

     return (sign ? -rv : rv);
}

