/*-----------------------------------------------------------------
    SDCChast.h - contains support routines for hashtables/sets .

    Written By - Sandeep Dutta . sandeep.dutta@usa.net (1998)

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


#ifndef SDCCMACRO_H
#define SDCCMACRO_H

#include "SDCChasht.h"
#include <stdarg.h>
#include <stdio.h>

char *mvsprintf(hTab *pvals, const char *pformat, va_list ap);
char *msprintf(hTab *pvals, const char *pformat, ...);
void mfprintf(FILE *fp, hTab *pvals, const char *pformat, ...);

#endif

