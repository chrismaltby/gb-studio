/*-------------------------------------------------------------------------
  break.h - Header file for break point management
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

#ifndef SDCDB_BREAK_H
#define SDCDB_BREAK_H

#include "simi.h"

/* break point type */
enum {
    DATA = 1,
    CODE    ,
    A_CODE  ,
    USER    ,
    STEP    ,
    NEXT    ,
    FENTRY  ,
    FEXIT};  

typedef struct breakp
{
    unsigned addr;           /* address of break point */
    int      bpnum ;         /* break point number */
    char     addrType;       /* data or code */    
    char     bpType  ;       /* bp type USER/ LOGICAL */  
    char     *filename;      /* file name */
    int      lineno  ;       /* lineno */
    int (*callBack)
	 (unsigned,char,char,int,context *);/* address of call back function */
} breakp;


#define BP_CALLBACK(func) \
    int func (unsigned addr, \
	     char addrType, \
	     char bpType  , \
	     int bpnum    ,\
	     context *ctxt)

#define EXTERN_BP_CALLBACK(func) \
    extern int func (unsigned addr, \
	     char addrType, \
	     char bpType  , \
	     int bpnum    ,\
	     context *ctxt)

extern char userBpPresent;
int setBreakPoint (unsigned , char , char, 
		    int (*callBack)(unsigned,char,char,int,context *),char *, int);

void  clearUSERbp ( unsigned int  );
void  deleteSTEPbp();
void  deleteNEXTbp();
void  deleteUSERbp(int);
int   dispatchCB (unsigned, context *);
void  listUSERbp ();

/* call back functions */
EXTERN_BP_CALLBACK(fexitCB);
EXTERN_BP_CALLBACK(fentryCB);
EXTERN_BP_CALLBACK(userBpCB);
EXTERN_BP_CALLBACK(stepBpCB);
EXTERN_BP_CALLBACK(nextBpCB);

#endif
