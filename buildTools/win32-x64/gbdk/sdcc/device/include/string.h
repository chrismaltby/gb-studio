/*-------------------------------------------------------------------------
   string.h - ANSI functions forward declarations    
  
       Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1998)

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


#ifndef __SDC51_STRING_H
#define __SDC51_STRING_H 1

#ifndef SDCC_mcs51
#define reentrant
#endif

#define memmove memcpy

#ifdef SDCC_STACK_AUTO
#ifdef SDCC_mcs51
#warning Make sure you recompiled _str*.c and _mem*.c library functions as 'reentrant'
#endif

extern char *strcpy (char *, char *) reentrant ;
extern char *strncpy(char *, char *,int ) reentrant ;
extern char *strcat (char *, char *) reentrant ;
extern char *strncat(char *, char *,int ) reentrant ;
extern int   strcmp (char *, char *) reentrant ;
extern int   strncmp(char *, char *,int ) reentrant ;
extern char *strchr (char *, char  ) reentrant ;
extern char *strrchr(char *, char  ) reentrant ;
extern int   strspn (char *, char *) reentrant ;
extern int   strcspn(char *, char *) reentrant ;
extern char *strpbrk(char *, char *) reentrant ;
extern char *strstr (char *, char *) reentrant ;
extern int   strlen (char *        ) reentrant ;
extern char *strtok (char *, char *) reentrant ;
extern void *memcpy (void *, void *, int ) reentrant ;
extern int   memcmp (void *, void *, int ) reentrant ;
extern void *memset (void *, unsigned char  , int ) reentrant ;
 
#else

extern char *strcpy (char *, char *)  ;
extern char *strncpy(char *, char *,int )  ;
extern char *strcat (char *, char *)  ;
extern char *strncat(char *, char *,int )  ;
extern int   strcmp (char *, char *)  ;
extern int   strncmp(char *, char *,int )  ;
extern char *strchr (char *, char  )  ;
extern char *strrchr(char *, char  )  ;
extern int   strspn (char *, char *)  ;
extern int   strcspn(char *, char *)  ;
extern char *strpbrk(char *, char *)  ;
extern char *strstr (char *, char *)  ;
extern int   strlen (char *  )  ;
extern char *strtok (char *, char *)  ;
extern void *memcpy (void *, void *, int )  ;
extern int   memcmp (void *, void *, int )  ;
extern void *memset (void *, unsigned char  , int )  ;

#if SDCC_ds390
extern void xdata * memcpyx(void xdata *, void xdata *, int) _naked;
#endif

#endif

#endif
