/*-------------------------------------------------------------------------
  _strtok.c - part of string library functions

             Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1999)

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
#include "string.h" 
#define NULL (void *)0

#if defined(SDCC_MODEL_LARGE) || defined (SDCC_MODEL_FLAT24)
#pragma NOINDUCTION
#pragma NOINVARIANT
#endif

char * strtok (
	char * str,
	char * control ) 
{
	static  char * s;
	register char * s1;

	if ( str )
		s = str ;

	s1 = s ;

	while (*s) {
		if (strchr(control,*s)) {
			*s++ = '\0';
			return s1 ;
		}
		s++ ;
	}
	return (NULL);
}  

