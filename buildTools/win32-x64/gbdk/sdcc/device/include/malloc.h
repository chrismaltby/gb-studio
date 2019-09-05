/*-------------------------------------------------------------------------
  malloc.h - malloc header file

             Written By - Written by Dmitry S. Obukhov, 1997  dso@usa.net

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
/* malloc.h */
#define MEMHEADER   struct MAH// Memory Allocation Header

#ifndef __SDCC51_MALLOC_H
#define __SDCC51_MALLOC_H

MEMHEADER
{
      MEMHEADER xdata *  next;
      MEMHEADER xdata *  prev;
      unsigned int       len;
      unsigned char      mem[1];
};

#ifdef SDCC_STACK_AUTO
#warning Make sure you recompile malloc.c as 'reentrant'

extern void init_dynamic_memory(MEMHEADER xdata *  , unsigned int ) reentrant;
extern void xdata * malloc (unsigned int ) reentrant;
extern void free (void * xdata p) reentrant;

#else

extern void init_dynamic_memory(MEMHEADER xdata *  , unsigned int );
extern void xdata * malloc (unsigned int );
extern void free (void xdata *  p);

#endif

#endif
