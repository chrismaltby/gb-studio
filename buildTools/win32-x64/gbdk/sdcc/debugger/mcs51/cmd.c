/*-------------------------------------------------------------------------
    cmd.c - source  file for debugger command execution

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

#include "sdcdb.h"
#include "symtab.h"
#include "simi.h"
#include "break.h"
#include "cmd.h"

int listLines = 10;
EXTERN_STACK_DCL(callStack,function *,1024);

#if defined(__APPLE__) && defined(__MACH__)
static char *copying=
{"                   GNU GENERAL PUBLIC LICENSE Version 2"};
#else
static char *copying=
"                   GNU GENERAL PUBLIC LICENSE
                       Version 2, June 1991

 Copyright (C) 1989, 1991 Free Software Foundation, Inc.
 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

                            Preamble

  The licenses for most software are designed to take away your
freedom to share and change it.  By contrast, the GNU General Public
License is intended to guarantee your freedom to share and change free
software--to make sure the software is free for all its users.  This
General Public License applies to most of the Free Software
Foundation's software and to any other program whose authors commit to
using it.  (Some other Free Software Foundation software is covered by
the GNU Library General Public License instead.)  You can apply it to
your programs, too.

  When we speak of free software, we are referring to freedom, not
price.  Our General Public Licenses are designed to make sure that you
have the freedom to distribute copies of free software (and charge for
this service if you wish), that you receive source code or can get it
if you want it, that you can change the software or use pieces of it
in new free programs; and that you know you can do these things.

  To protect your rights, we need to make restrictions that forbid
anyone to deny you these rights or to ask you to surrender the rights.
These restrictions translate to certain responsibilities for you if you
distribute copies of the software, or if you modify it.

  For example, if you distribute copies of such a program, whether
gratis or for a fee, you must give the recipients all the rights that
you have.  You must make sure that they, too, receive or can get the
source code.  And you must show them these terms so they know their
rights.

  We protect your rights with two steps: (1) copyright the software, and
(2) offer you this license which gives you legal permission to copy,
distribute and/or modify the software.

  Also, for each author's protection and ours, we want to make certain
that everyone understands that there is no warranty for this free
software.  If the software is modified by someone else and passed on, we
want its recipients to know that what they have is not the original, so
that any problems introduced by others will not reflect on the original
authors' reputations.

  Finally, any free program is threatened constantly by software
patents.  We wish to avoid the danger that redistributors of a free
program will individually obtain patent licenses, in effect making the
program proprietary.  To prevent this, we have made it clear that any
patent must be licensed for everyone's free use or not licensed at all.

  The precise terms and conditions for copying, distribution and
modification follow.
^L
                    GNU GENERAL PUBLIC LICENSE
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

  0. This License applies to any program or other work which contains
a notice placed by the copyright holder saying it may be distributed
under the terms of this General Public License.  The \"Program\", below,
refers to any such program or work, and a \"work based on the Program\"
means either the Program or any derivative work under copyright law:
that is to say, a work containing the Program or a portion of it,
either verbatim or with modifications and/or translated into another
language.  (Hereinafter, translation is included without limitation in
the term \"modification\".)  Each licensee is addressed as \"you\".

Activities other than copying, distribution and modification are not
covered by this License; they are outside its scope.  The act of
running the Program is not restricted, and the output from the Program
is covered only if its contents constitute a work based on the
Program (independent of having been made by running the Program).
Whether that is true depends on what the Program does.

  1. You may copy and distribute verbatim copies of the Program's
source code as you receive it, in any medium, provided that you
conspicuously and appropriately publish on each copy an appropriate
copyright notice and disclaimer of warranty; keep intact all the
notices that refer to this License and to the absence of any warranty;
and give any other recipients of the Program a copy of this License
along with the Program.

You may charge a fee for the physical act of transferring a copy, and
you may at your option offer warranty protection in exchange for a fee.

  2. You may modify your copy or copies of the Program or any portion
of it, thus forming a work based on the Program, and copy and
distribute such modifications or work under the terms of Section 1
above, provided that you also meet all of these conditions:

    a) You must cause the modified files to carry prominent notices
    stating that you changed the files and the date of any change.

    b) You must cause any work that you distribute or publish, that in
    whole or in part contains or is derived from the Program or any
    part thereof, to be licensed as a whole at no charge to all third
    parties under the terms of this License.

    c) If the modified program normally reads commands interactively
    when run, you must cause it, when started running for such
    interactive use in the most ordinary way, to print or display an
    announcement including an appropriate copyright notice and a
    notice that there is no warranty (or else, saying that you provide
    a warranty) and that users may redistribute the program under
    these conditions, and telling the user how to view a copy of this
    License.  (Exception: if the Program itself is interactive but
    does not normally print such an announcement, your work based on
    the Program is not required to print an announcement.)

These requirements apply to the modified work as a whole.  If
identifiable sections of that work are not derived from the Program,
and can be reasonably considered independent and separate works in
themselves, then this License, and its terms, do not apply to those
sections when you distribute them as separate works.  But when you
distribute the same sections as part of a whole which is a work based
on the Program, the distribution of the whole must be on the terms of
this License, whose permissions for other licensees extend to the
entire whole, and thus to each and every part regardless of who wrote it.

Thus, it is not the intent of this section to claim rights or contest
your rights to work written entirely by you; rather, the intent is to
exercise the right to control the distribution of derivative or
collective works based on the Program.

In addition, mere aggregation of another work not based on the Program
with the Program (or with a work based on the Program) on a volume of
a storage or distribution medium does not bring the other work under
the scope of this License.

  3. You may copy and distribute the Program (or a work based on it,
under Section 2) in object code or executable form under the terms of
Sections 1 and 2 above provided that you also do one of the following:

    a) Accompany it with the complete corresponding machine-readable
    source code, which must be distributed under the terms of Sections
    1 and 2 above on a medium customarily used for software interchange; or,

    b) Accompany it with a written offer, valid for at least three
    years, to give any third party, for a charge no more than your
    cost of physically performing source distribution, a complete
    machine-readable copy of the corresponding source code, to be
    distributed under the terms of Sections 1 and 2 above on a medium
    customarily used for software interchange; or,

    c) Accompany it with the information you received as to the offer
    to distribute corresponding source code.  (This alternative is
    allowed only for noncommercial distribution and only if you
    received the program in object code or executable form with such
    an offer, in accord with Subsection b above.)

The source code for a work means the preferred form of the work for
making modifications to it.  For an executable work, complete source
code means all the source code for all modules it contains, plus any
associated interface definition files, plus the scripts used to
control compilation and installation of the executable.  However, as a
special exception, the source code distributed need not include
anything that is normally distributed (in either source or binary
form) with the major components (compiler, kernel, and so on) of the
operating system on which the executable runs, unless that component
itself accompanies the executable.

If distribution of executable or object code is made by offering
access to copy from a designated place, then offering equivalent
access to copy the source code from the same place counts as
distribution of the source code, even though third parties are not
compelled to copy the source along with the object code.
^L
  4. You may not copy, modify, sublicense, or distribute the Program
except as expressly provided under this License.  Any attempt
otherwise to copy, modify, sublicense or distribute the Program is
void, and will automatically terminate your rights under this License.
However, parties who have received copies, or rights, from you under
this License will not have their licenses terminated so long as such
parties remain in full compliance.

  5. You are not required to accept this License, since you have not
signed it.  However, nothing else grants you permission to modify or
distribute the Program or its derivative works.  These actions are
prohibited by law if you do not accept this License.  Therefore, by
modifying or distributing the Program (or any work based on the
Program), you indicate your acceptance of this License to do so, and
all its terms and conditions for copying, distributing or modifying
the Program or works based on it.

  6. Each time you redistribute the Program (or any work based on the
Program), the recipient automatically receives a license from the
original licensor to copy, distribute or modify the Program subject to
these terms and conditions.  You may not impose any further
restrictions on the recipients' exercise of the rights granted herein.
You are not responsible for enforcing compliance by third parties to
this License.

  7. If, as a consequence of a court judgment or allegation of patent
infringement or for any other reason (not limited to patent issues),
conditions are imposed on you (whether by court order, agreement or
otherwise) that contradict the conditions of this License, they do not
excuse you from the conditions of this License.  If you cannot
distribute so as to satisfy simultaneously your obligations under this
License and any other pertinent obligations, then as a consequence you
may not distribute the Program at all.  For example, if a patent
license would not permit royalty-free redistribution of the Program by
all those who receive copies directly or indirectly through you, then
the only way you could satisfy both it and this License would be to
refrain entirely from distribution of the Program.

If any portion of this section is held invalid or unenforceable under
any particular circumstance, the balance of the section is intended to
apply and the section as a whole is intended to apply in other
circumstances.

It is not the purpose of this section to induce you to infringe any
patents or other property right claims or to contest validity of any
such claims; this section has the sole purpose of protecting the
integrity of the free software distribution system, which is
implemented by public license practices.  Many people have made
generous contributions to the wide range of software distributed
through that system in reliance on consistent application of that
system; it is up to the author/donor to decide if he or she is willing
to distribute software through any other system and a licensee cannot
impose that choice.

This section is intended to make thoroughly clear what is believed to
be a consequence of the rest of this License.

  8. If the distribution and/or use of the Program is restricted in
certain countries either by patents or by copyrighted interfaces, the
original copyright holder who places the Program under this License
may add an explicit geographical distribution limitation excluding
those countries, so that distribution is permitted only in or among
countries not thus excluded.  In such case, this License incorporates
the limitation as if written in the body of this License.

  9. The Free Software Foundation may publish revised and/or new versions
of the General Public License from time to time.  Such new versions will
be similar in spirit to the present version, but may differ in detail to
address new problems or concerns.

Each version is given a distinguishing version number.  If the Program
specifies a version number of this License which applies to it and \"any
later version\", you have the option of following the terms and conditions
either of that version or of any later version published by the Free
Software Foundation.  If the Program does not specify a version number of
this License, you may choose any version ever published by the Free Software
Foundation.

  10. If you wish to incorporate parts of the Program into other free
programs whose distribution conditions are different, write to the author
to ask for permission.  For software which is copyrighted by the Free
Software Foundation, write to the Free Software Foundation; we sometimes
make exceptions for this.  Our decision will be guided by the two goals
of preserving the free status of all derivatives of our free software and
of promoting the sharing and reuse of software generally.
";
static char *warranty=
"                            NO WARRANTY

  11. BECAUSE THE PROGRAM IS LICENSED FREE OF CHARGE, THERE IS NO WARRANTY
FOR THE PROGRAM, TO THE EXTENT PERMITTED BY APPLICABLE LAW.  EXCEPT WHEN
OTHERWISE STATED IN WRITING THE COPYRIGHT HOLDERS AND/OR OTHER PARTIES
PROVIDE THE PROGRAM \"AS IS\" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED
OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.  THE ENTIRE RISK AS
TO THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU.  SHOULD THE
PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF ALL NECESSARY SERVICING,
REPAIR OR CORRECTION.

  12. IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING
WILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MAY MODIFY AND/OR
REDISTRIBUTE THE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES,
INCLUDING ANY GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING
OUT OF THE USE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED
TO LOSS OF DATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY
YOU OR THIRD PARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER
PROGRAMS), EVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE
POSSIBILITY OF SUCH DAMAGES.
";
#endif

static void printTypeInfo(link *);
static void printValAggregates (symbol *,link *,char,unsigned int);

int srcMode = SRC_CMODE ;

/*-----------------------------------------------------------------*/
/* funcWithName - returns function with name                       */
/*-----------------------------------------------------------------*/
DEFSETFUNC(funcWithName)
{
    function *func = item;
    V_ARG(char *,name);
    V_ARG(function **,funcp);

    if (*funcp)
	return 0;

    if (strcmp(func->sym->name,name) == 0) {
	*funcp = func;
	return 1;
    }
    
    return 0;
}

/*-----------------------------------------------------------------*/
/* setBPatModLine - set break point at the line specified for the  */
/*-----------------------------------------------------------------*/
static void setBPatModLine (module *mod, int line)
{
    /* look for the first executable line after the line
       specified & get the break point there */    
    if (srcMode == SRC_CMODE && line > mod->ncLines) {
	fprintf(stderr,"No line %d in file \"%s\".\n",
		line,mod->c_name);
	return ;
    }
    
    if (srcMode == SRC_AMODE && line > mod->nasmLines) {
	fprintf(stderr,"No line %d in file \"%s\".\n",
		line,mod->asm_name);
	return ;
    }

    for ( ; line < (srcMode == SRC_CMODE ? mod->ncLines : mod->nasmLines ) ; 
	  line++ ) {
	if (srcMode == SRC_CMODE) {
	    if (mod->cLines[line]->addr) {
		setBreakPoint (mod->cLines[line]->addr, CODE, USER, 
			       userBpCB, mod->c_name, line);
		break;
	    }
	}
	else {
	   if (mod->asmLines[line]->addr) {
	       setBreakPoint (mod->asmLines[line]->addr, CODE, USER, 
			      userBpCB, mod->asm_name, line);
	       break;
	   } 
	}
    }

    return;
}

/*-----------------------------------------------------------------*/
/* clearBPatModLine - clr break point at the line specified        */
/*-----------------------------------------------------------------*/
static void clearBPatModLine (module *mod, int line)
{
    /* look for the first executable line after the line
       specified & get the break point there */
    if (srcMode == SRC_CMODE && line > mod->ncLines) {
	fprintf(stderr,"No line %d in file \"%s\".\n",
		line,mod->c_name);
	return ;
    }
    
    if (srcMode == SRC_AMODE && line > mod->ncLines) {
	fprintf(stderr,"No line %d in file \"%s\".\n",
		line,mod->c_name);
	return ;
    }    
    
    for ( ; line < (srcMode == SRC_CMODE ? mod->ncLines : mod->nasmLines ) ; 
	  line++ ) {
	if (srcMode == SRC_CMODE) 
	    if (mod->cLines[line]->addr) {
		clearUSERbp (mod->cLines[line]->addr);			  
		break;
	    }
	else
	    if (mod->asmLines[line]->addr) {
		clearUSERbp (mod->asmLines[line]->addr);			  
		break;
	    }
    }

    return;
}

/*-----------------------------------------------------------------*/
/* funcWithNameModule - returns functions with a name module combo */
/*-----------------------------------------------------------------*/
DEFSETFUNC(funcWithNameModule) 
{
    function *func = item;
    V_ARG(char *,fname);
    V_ARG(char *,mname);
    V_ARG(function **,funcp);

    if (*funcp)
	return 0;

    if (strcmp(func->sym->name,fname) == 0 &&
	strcmp(func->mod->c_name,mname) == 0) {
	*funcp = func;
	return 1;
    }

    return 0;
}

/*-----------------------------------------------------------------*/
/* funcInAddr - given an address returns the function              */
/*-----------------------------------------------------------------*/
DEFSETFUNC(funcInAddr)
{
    function *func = item;
    V_ARG(unsigned int,addr);
    V_ARG(function **,funcp);

    if (*funcp)
	return 0;

    /* in the address range */
    if (func->sym->addr <= addr &&
	func->sym->eaddr >= addr) {
	
	*funcp = func;
	return 1;
    }

    return 0;	    
}

/*-----------------------------------------------------------------*/
/* setStepBp - will set STEP Bp @ function entry points            */
/*-----------------------------------------------------------------*/
DEFSETFUNC(setStepBp)
{
    function *func = item;
    
    if (func->sym && func->sym->addr ) {
	
	/* set the entry break point */
	setBreakPoint (func->sym->addr , CODE , STEP , 
		       stepBpCB ,func->mod->c_name , func->entryline);

	return 1;
    }

    return 0;
}

/*-----------------------------------------------------------------*/
/* setStepEPBp - sets a given type of bp @ the execution point     */
/*-----------------------------------------------------------------*/
DEFSETFUNC(setStepEPBp)
{
    exePoint *ep = item;
    V_ARG(int,bptype);
    V_ARG(char *,mname);
   
    setBreakPoint (ep->addr, CODE, bptype, 
		   stepBpCB, mname, ep->line);
    return 1;
}

/*-----------------------------------------------------------------*/
/* setNextEPBp - sets a given type of bp @ the execution point     */
/*-----------------------------------------------------------------*/
DEFSETFUNC(setNextEPBp)
{
    exePoint *ep = item;
    V_ARG(int,bptype);
    V_ARG(char *,mname);
   
    setBreakPoint (ep->addr, CODE, bptype, 
		   nextBpCB, mname, ep->line);
    return 1;
}

/*-----------------------------------------------------------------*/
/* lineAtAddr - for execution points returns the one with addr     */
/*-----------------------------------------------------------------*/
DEFSETFUNC(lineAtAddr)
{
    exePoint *ep = item;
    V_ARG(unsigned int,addr);
    V_ARG(int *,line);
    V_ARG(int *,block);
    V_ARG(int *,level);

    /* address must be an exact match */
    if (ep->addr == addr) {
	*line = ep->line;
	if (block)
	    *block = ep->block ;
	if (level)
	    *level = ep->level ;
	return 1;
    }

    return 0;
    
}

/*-----------------------------------------------------------------*/
/* discoverContext - find out the current context of the bp        */
/*-----------------------------------------------------------------*/
context *discoverContext (unsigned addr)
{
    function *func = NULL;
    int line = 0;

    /* find the function we are in */
    if (!applyToSet(functions,funcInAddr,addr,&func)) {
      fprintf(stderr, "Error?:discoverContext: cannot apply to set!\n");
     	return NULL;
    }

    currCtxt->func = func;
    currCtxt->addr = func->laddr = addr;
    currCtxt->modName = func->modName;
    
    /* find the c line number */
    if(applyToSet(func->cfpoints,lineAtAddr,addr,
		  &line,&currCtxt->block,&currCtxt->level)) 
	currCtxt->cline = func->lline = line;
    else
	currCtxt->cline = func->exitline;
    
    /* find the asm line number */
    line = 0;
    if (applyToSet(func->afpoints,lineAtAddr,addr,
		   &line,NULL,NULL))
	currCtxt->asmline = line;       
    else
	currCtxt->asmline = -1;
        
    return currCtxt ;
}


/*-----------------------------------------------------------------*/
/* simGo - send 'go' cmd to simulator and wait till a break occurs */
/*-----------------------------------------------------------------*/
void simGo (unsigned int gaddr)
{   
    unsigned int addr ;
    context *ctxt;
    int rv;
    static int initial_break_flag = 0;

 top:    
    addr = simGoTillBp (gaddr);

    /* got the pc for the break point now first
       discover the program context i.e. module, function 
       linenumber of the source etc, etc etc */
    ctxt = discoverContext (addr);
    
    /* dispatch all the break point call back functions */
    rv = dispatchCB (addr,ctxt);    

 ret:    

    /* the dispatch call back function will return
       non-zero if an user break point has been hit
       if not then we continue with the execution 
       of the program */
    if (!rv) {
      if (!initial_break_flag) {
        initial_break_flag = 1;  // kludge to stop only at first run
        fprintf(stdout, "Stopping at entry.  You can now list and set breakpoints\n");
      }
      else {
       	gaddr = -1;
       	goto top ;
      }

// notes: kpb
// I took this out, after running "run" it would just keep re-running
// even after a lot of break points hit.  For some reason above code
// not triggering(dispatchCB).  This seems to be by design, startup adds
// a bunch of breakpoints-but they are not USER breakpoints.  Perhaps the
// debugger changed with its implementation of "go"("run").  It seems we
// need to add a "next" or "step" followed by a "run"...
// I added a "step" in simi.c when we want a resume function, this seems
// to work.

// still there is question of how do we stop it initially, since
// it must be started before it can get a context.  If so, we would
// want it to just run up to an initial entry point you'd think...
// I don't see why we can't set breakpoints before an initial run,
// this does not seem right to me.

// line #'s are a bit off too.

#if 0
	gaddr = -1;
	goto top ;
#endif
    }
    
}

/*-----------------------------------------------------------------*/
/* cmdSetUserBp - set break point at the user specified location   */
/*-----------------------------------------------------------------*/
int cmdSetUserBp (char *s, context *cctxt)
{
    char *bp ;
    function *func = NULL;
	
    /* user break point location specification can be of the following
       forms
       a) <nothing>        - break point at current location
       b) lineno           - number of the current module
       c) filename:lineno  - line number of the given file
       e) filename:function- function X in file Y (useful for static functions)
       f) function         - function entry point
    */

    if (!cctxt) {
	fprintf(stdout,"No symbol table is loaded.  Use the \"file\" command.\n");
	return 0;
    }
    /* white space skip */
    while (*s && isspace(*s)) s++;
    
    /* null terminate it after stripping trailing blanks*/
    bp = s + strlen(s);
    while (bp != s && isspace(*bp)) bp--;
    *bp = '\0';

    /* case a) nothing */
    /* if nothing given then current location : we know
       the current execution location from the currentContext */
    if (! *s ) {

	/* if current context is known */
	if (cctxt->func) {
	    if (srcMode == SRC_CMODE)
		/* set the break point */
		setBreakPoint ( cctxt->addr , CODE , USER , userBpCB ,
				cctxt->func->mod->c_name, cctxt->cline);
	    else
		setBreakPoint ( cctxt->addr , CODE , USER , userBpCB ,
				cctxt->func->mod->asm_name, cctxt->asmline);
		
	}
	else
	    fprintf(stderr,"No default breakpoint address now.\n");
			
	goto ret ;
    }

    /* case b) lineno */
    /* check if line number */
    if (isdigit(*s)) {
	/* get the lineno */
	int line = atoi(s);

	/* if current context not present then we must get the module
	   which has main & set the break point @ line number provided
	   of that module : if current context known then set the bp 
	   at the line number given for the current module 
	*/
	if (cctxt->func) {
	    if (!cctxt->func->mod) {
		if (!applyToSet(functions,funcWithName,"main"))
		    fprintf(stderr,"Function \"main\" not defined.\n");
		else 
		    setBPatModLine(func->mod,line);
	    } else 
		setBPatModLine(cctxt->func->mod,line);			
	} else {
		fprintf(stdout,"No symbol information currently\n");
	}
	
	goto ret;
    }

    if ((bp = strchr(s,':'))) {
	
	module *mod = NULL;
	*bp = '\0';
	
	if (srcMode == SRC_CMODE) {
	    if (!applyToSet(modules,moduleWithCName,s,&mod)) {
		fprintf (stderr,"No source file named %s.\n",s);
		goto ret;
	    }
	} else {
	    if (!applyToSet(modules,moduleWithAsmName,s,&mod)) {
		fprintf (stderr,"No source file named %s.\n",s);
		goto ret;
	    }
	}
	    	
	/* case c) filename:lineno */
	if (isdigit(*(bp +1))) {	    	    
	 
	    setBPatModLine (mod,atoi(bp+1));	    
	    goto ret;
	    
	}
	/* case d) filename:function */
	if (!applyToSet(functions,funcWithNameModule,bp+1,s,&func)) 
	    fprintf(stderr,"Function \"%s\" not defined.\n",bp+1); 
	else 	    
	    setBPatModLine (mod,
			    (srcMode == SRC_CMODE ? 
			     func->entryline :
			     func->aentryline));
	
	goto ret;
    }
            
    /* case e) function */
    if (!applyToSet(functions,funcWithName,s,&func))
	fprintf(stderr,"Function \"%s\" not defined.\n",s); 
    else
	setBPatModLine(func->mod,
		       (srcMode == SRC_CMODE ?
			func->entryline :
			func->aentryline));

 ret:    
    return 0;
}

/*-----------------------------------------------------------------*/
/* cmdListAsm - list assembler source code                         */
/*-----------------------------------------------------------------*/
int cmdListAsm (char *s, context *cctxt)
{
    fprintf(stderr,"'listasm' command not yet implemented\n");
    return 0;
}

/*-----------------------------------------------------------------*/
/* cmdSetOption - set debugger options                             */
/*-----------------------------------------------------------------*/
int cmdSetOption (char *s, context *cctxt)
{
    while (*s && isspace(*s)) s++;
    if (strncmp(s,"srcmode",7) == 0 ) {
	if (srcMode == SRC_CMODE)
	    srcMode = SRC_AMODE;
	else
	    srcMode = SRC_CMODE;
	fprintf(stderr,"source mode set to '%s'\n", 
		(srcMode == SRC_CMODE ? "C" : "asm"));
	return 0;
    }
    
    fprintf(stderr,"'set %s' command not yet implemented\n",s);
    return 0;
}

/*-----------------------------------------------------------------*/
/* cmdContinue - continue till next break point                    */
/*-----------------------------------------------------------------*/
int cmdContinue (char *s, context *cctxt)
{
    if (!cctxt || !cctxt->func) {
	fprintf(stdout,"The program is not being run.\n");
	return 0;
    }

    fprintf(stdout,"Continuing.\n");
    simGo(-1);
    return 0;
}

/*-----------------------------------------------------------------*/
/* cmdDelUserBp - delete user break point                          */
/*-----------------------------------------------------------------*/
int cmdDelUserBp (char *s, context *cctxt)
{
    int bpnum ;
    while (isspace(*s)) s++;
    
    if (!*s ) {
	if (userBpPresent) {
	    char buffer[10];
	    fprintf (stdout,"Delete all breakpoints? (y or n) ");
	    fflush(stdout);
	    fgets(buffer,sizeof(buffer),stdin);
	    if (toupper(buffer[0]) == 'Y')
		deleteUSERbp(-1);	   
	}
	return 0;
    }
    
    /* determine the break point number */
    if (sscanf(s,"%d",&bpnum) == 1)
	deleteUSERbp(bpnum);

    return 0;
}

/*-----------------------------------------------------------------*/
/* cmdStep - single step thru C source file                        */
/*-----------------------------------------------------------------*/
int cmdStep (char *s, context *cctxt)
{
    function *func = NULL;

    if (!cctxt || !cctxt->func || !cctxt->func->mod) 
	fprintf(stdout,"The program is not being run.\n");
    else {
	/* if we are @ the end of a function then set
	   break points at execution points of the
	   function in the call stack... */
	if (cctxt->addr == cctxt->func->sym->eaddr) {
	    if ((func = STACK_PEEK(callStack))) {
		if (srcMode == SRC_CMODE)
		    applyToSet (func->cfpoints,setStepEPBp,STEP,
				func->mod->c_name);	
		else
		    applyToSet (func->afpoints,setStepEPBp,STEP,
				func->mod->asm_name);
	    }
	} else {
	    /* set breakpoints at all function entry points
	       and all exepoints of this functions & for
	       all functions one up in the call stack */
	    
	    /* all function entry points */
	    applyToSet(functions,setStepBp); 
	    
	    if (srcMode == SRC_CMODE) {
		/* for all execution points in this function */
		applyToSet(cctxt->func->cfpoints,setStepEPBp,STEP,
			   cctxt->func->mod->c_name);
		
		/* set a break point @ the current function's
		   exit */
		setBreakPoint (cctxt->func->sym->eaddr, CODE, STEP , 
			       stepBpCB, cctxt->func->mod->c_name, 
			       cctxt->func->exitline);
		
		/* now break point @ callers execution points */
		if ((func = STACK_PPEEK(callStack))) {
		    applyToSet (func->cfpoints,setStepEPBp,STEP,
				func->mod->c_name);	
		    /* set bp @ callers exit point */
		    setBreakPoint (func->sym->eaddr, CODE, STEP , 
				   stepBpCB, func->mod->c_name, 
				   func->exitline);
		}
	    } else {
		/* for all execution points in this function */
		applyToSet(cctxt->func->afpoints,setStepEPBp,STEP,
			   cctxt->func->mod->asm_name);
		
		/* set a break point @ the current function's
		   exit */
		setBreakPoint (cctxt->func->sym->eaddr, CODE, STEP , 
			       stepBpCB, cctxt->func->mod->asm_name, 
			       cctxt->func->aexitline);
		
		/* now break point @ callers execution points */
		if ((func = STACK_PPEEK(callStack))) {
		    
		    applyToSet (func->afpoints,setStepEPBp,STEP,
				func->mod->asm_name);	
		    
		    /* set bp @ callers exit point */
		    setBreakPoint (func->sym->eaddr, CODE, STEP , 
				   stepBpCB, func->mod->asm_name, 
				   func->aexitline);
		}
	    }
	}

	simGo(-1);
    }
    return 0;
}

/*-----------------------------------------------------------------*/
/* cmdNext - next executable C statement file                      */
/*-----------------------------------------------------------------*/
int cmdNext (char *s, context *cctxt)
{
    function *func = NULL;
    /* next is almost the same as step except we don't
       we don't set break point for all function entry
       points */
    if (!cctxt || !cctxt->func || !cctxt->func->mod) 
	fprintf(stdout,"The program is not being run.\n");
    else {
	
	/* if we are @ the end of a function then set
	   break points at execution points of the
	   function in the call stack... */
	if (cctxt->addr == cctxt->func->sym->eaddr) {
	    if ((func = STACK_PEEK(callStack))) {
		if (srcMode == SRC_CMODE)
		    applyToSet (func->cfpoints,setStepEPBp,STEP,
				func->mod->c_name);	
		else
		    applyToSet (func->afpoints,setStepEPBp,STEP,
			       func->mod->asm_name);
	    }
	} else {
	    if (srcMode == SRC_CMODE) {
		/* for all execution points in this function */
		applyToSet(cctxt->func->cfpoints,setNextEPBp,NEXT,
			   cctxt->func->mod->c_name);
		/* set a break point @ the current function's
		   exit */
		setBreakPoint (cctxt->func->sym->eaddr, CODE, NEXT , 
			       nextBpCB, cctxt->func->mod->c_name, 
			       cctxt->func->exitline);
		
		/* now break point @ callers execution points */	
		if ((func = STACK_PPEEK(callStack))) {
		    applyToSet (func->cfpoints,setNextEPBp,NEXT ,
				func->mod->c_name);	
		    /* set bp @ callers exit point */
		    setBreakPoint (func->sym->eaddr, CODE, NEXT , 
				   stepBpCB, func->mod->c_name, 
				   func->exitline);
		}
	    } else {
		/* for all execution points in this function */
		applyToSet(cctxt->func->afpoints,setNextEPBp,NEXT,
			   cctxt->func->mod->asm_name);
		/* set a break point @ the current function's
		   exit */
		setBreakPoint (cctxt->func->sym->eaddr, CODE, NEXT , 
			       nextBpCB, cctxt->func->mod->asm_name, 
			       cctxt->func->aexitline);
		
		/* now break point @ callers execution points */	
		if ((func = STACK_PPEEK(callStack))) {
		    applyToSet (func->cfpoints,setNextEPBp,NEXT ,
				func->mod->asm_name);	
		    /* set bp @ callers exit point */
		    setBreakPoint (func->sym->eaddr, CODE, NEXT , 
				   stepBpCB, func->mod->asm_name, 
				   func->aexitline);
		}
	    }
	    simGo(-1);	
	}
    }    
    return 0;
}

/*-----------------------------------------------------------------*/
/* cmdRun  - run till next break point                             */
/*-----------------------------------------------------------------*/
int cmdRun (char *s, context *cctxt)
{
    char buff[10];
    if (!cctxt || !cctxt->func || !cctxt->func->mod) {
	fprintf(stdout,"Starting program\n");
	simGo(0);
    } else {
	
	fprintf(stdout,
		"The program being debugged has been started already.\n");
	fprintf(stdout,"Start it from the beginning? (y or n) ");
	fflush(stdout);

	fgets(buff,sizeof(buff),stdin);
	if (toupper(buff[0]) == 'Y') {
	    simReset();
	    simGo(0);
	}
    }

    return 0;
}

/*-----------------------------------------------------------------*/
/* infoStack - print call stack information                        */
/*-----------------------------------------------------------------*/
static void infoStack(context *ctxt)
{
    function *func ;
    int i = 0 ;

    STACK_STARTWALK(callStack) ;
    while ((func = STACK_WALK(callStack))) {

	fprintf(stdout,"#%d 0x%04x %s () at %s:%d\n",i++,
		func->laddr,func->sym->name,
		func->mod->c_name,func->lline);
    }

}

/*-----------------------------------------------------------------*/
/* cmdInfo - info command                                          */
/*-----------------------------------------------------------------*/
int cmdInfo (char *s, context *cctxt)
{
    while (isspace(*s)) s++;

    /* list all break points */
    if (strcmp(s,"break") == 0) {
	listUSERbp();
	return 0;
    }

    /* info frame same as frame */
    if (strcmp(s,"frame") == 0) {
	cmdFrame (s,cctxt);
	return 0;
    }

    /* info stack display call stack */
    if (strcmp(s,"stack") == 0) {
	infoStack(cctxt);
	return 0;
    }

    /* info stack display call stack */
    if (strcmp(s,"registers") == 0) {
	fprintf(stdout,"%s",simRegs());
	return 0;
    }

    fprintf(stdout,"Undefined info command: \"%s\".  Try \"help\n",s);
    return 0;

}

/*-----------------------------------------------------------------*/
/* cmdQuit  - quit debugging                                       */
/*-----------------------------------------------------------------*/
int cmdQuit (char *s, context *cctxt)
{   
    if (simactive)
	closeSimulator();
    return 1;
}

/*-----------------------------------------------------------------*/
/* cmdListSrc  - list src                                          */
/*-----------------------------------------------------------------*/
int cmdListSrc (char *s, context *cctxt)
{   
    static int currline = 0;
    int i =0 ;
    int pline = 0;
    static module *mod = NULL;
    int llines = listLines;

    while (*s && isspace(*s)) s++;
    
    /* if the user has spcified line numer then the line number
       can be of the following formats
       LINE          - just line number
       FILE:LINE     - filename line number
       FUNCTION      - list a function
       FILE:FUNCTION - function in file */
    if (!cctxt || !cctxt->func || !cctxt->func->mod) {
	fprintf(stdout,"No symbol table is loaded.  Use the \"file\" command.\n");
	return 0;
    }
    if (*s) {
	/* case a) LINE */
	if (isdigit(*s)) {
	    sscanf(s,"%d",&pline);
	    mod = cctxt->func->mod;
	}
	else {
	    char *bp;
	    function *func = NULL;
	    
	    /* if ':' present then FILE:LINE || FILE:FUNCTION */
	    if ((bp = strchr(s,':'))) {
		*bp = '\0';
		bp ++;
		if (isdigit(*bp)) {
		    /* FILE:LINE */
		    if (srcMode == SRC_CMODE) {
			if (!applyToSet(modules,moduleWithCName,s,&mod)) {
			    fprintf (stderr,"No source file named %s.\n",s);
			    return 0;
			}
		    } else {
			if (!applyToSet(modules,moduleWithAsmName,s,&mod)) {
			    fprintf (stderr,"No source file named %s.\n",s);
			    return 0;
			}
		    }
		    sscanf(bp,"%d",&pline); 	 		    
		} else {
		    /* FILE:FUCTION */
		    if (!applyToSet(functions,funcWithNameModule,bp,s,&func)) {
			fprintf(stdout,"Function \"%s\" not defined.\n",bp);
			return 0;
		    }
		    mod = func->mod;
		    if (srcMode == SRC_CMODE) {
			pline = func->entryline;
			llines = func->exitline - func->entryline + 1;
		    } else {
			pline = func->aentryline;
			llines = func->aexitline - func->aentryline + 1;
		    }
		}
	    }
	    else {
		/* FUNCTION */
		if (!applyToSet(functions,funcWithName,s,&func)) {
		    fprintf(stderr,"Function \"%s\" not defined.\n",s); 
		    return 0;
		}
		else {
		    mod = func->mod;
		    if (srcMode == SRC_CMODE) {
			pline = func->entryline;
			llines = func->exitline - func->entryline + 1; 
		    } else {
			pline = func->aentryline;
			llines = func->aexitline - func->aentryline + 1; 
		    }
		}
	    }	    	    
	}
    } else {
	/* if no line specified & we had listed
	   before then continue from that listing */
	if (currline)
	    pline = currline ;
	else {
	    mod = cctxt->func->mod;
	    if (srcMode == SRC_CMODE)
		pline = cctxt->cline;
	    else
		pline = cctxt->asmline;
	}
    }
    
    for ( i = 0 ; i < llines ; i++ ) {
	if (srcMode == SRC_CMODE) {
	    if ( (pline + i) >= mod->ncLines )
		break;
	    fprintf(stdout,"%d\t%s",pline + i,
		    mod->cLines[pline +i]->src);
	} else {
	    if ( (pline + i) >= mod->nasmLines )
		break;
	    fprintf(stdout,"%d\t%s",pline + i,
		    mod->asmLines[pline +i]->src);
	}
    }
    currline = pline + i ;
    return 0;
}

/*-----------------------------------------------------------------*/
/* printValBasic - print value of basic types                      */
/*-----------------------------------------------------------------*/
static void printValBasic(symbol *sym,unsigned addr,char mem, int size)
{
    union {  	
	float f;     
	unsigned long val;
	long         sval;
	struct {
	    short    lo;
	    short    hi;
	} i;
	unsigned char b[4];
    }v;
    union {
	unsigned char b[4];
    }v1;
    
    v.val = simGetValue(addr,mem,size);
    /* if this a floating point number then */
    if (IS_FLOAT(sym->type)) 	
	fprintf(stdout,"%f",v.f);    
    else
	if (IS_PTR(sym->type))
	    fprintf(stdout,"0x%x",v.val);
	else
	    if (IS_SPEC(sym->type) && IS_INTEGRAL(sym->type)) {
		if (IS_CHAR(sym->etype)) 
		    fprintf(stdout,"'%c' %d 0x%x",v.val,v.val,v.val);
		else
		    if (IS_INT(sym->etype)) 
			if (IS_LONG(sym->etype))
			    if (SPEC_USIGN(sym->etype))
				fprintf(stdout,"%d 0x%x",v.val,v.val);
			    else
				fprintf(stdout,"%d 0x%x",v.sval,v.sval);
			else
			    fprintf(stdout,"%d 0x%x",v.i.lo,v.i.lo);
		    else
			fprintf(stdout,"0x%x",v.val);
	    } else
		fprintf(stdout,"0x%x",v.val);
		
    
}

/*-----------------------------------------------------------------*/
/* printValFunc  - prints function values                          */
/*-----------------------------------------------------------------*/
static void printValFunc (symbol *sym)
{
    fprintf(stdout,"print function not yet implemented\n");
}

/*-----------------------------------------------------------------*/
/* printArrayValue - will print the values of array elements       */
/*-----------------------------------------------------------------*/
static void printArrayValue (symbol *sym, char space, unsigned int addr)
{
	link *elem_type = sym->type->next;
	int i;
	
	fprintf(stdout," { ");
	for (i = 0 ; i < DCL_ELEM(sym->type) ; i++) {		
		if (IS_AGGREGATE(elem_type)) {
			printValAggregates(sym,elem_type,space,addr);		       
		} else {
			printValBasic(sym,addr,space,getSize(elem_type));
		}
		addr += getSize(elem_type);
		if (i != DCL_ELEM(sym->type) -1)
			fprintf(stdout,",");
	}

	fprintf(stdout,"}\n");		
}

/*-----------------------------------------------------------------*/
/* printStructValue - prints structures elements                   */
/*-----------------------------------------------------------------*/
static void printStructValue (symbol *sym,link *type, char space, unsigned int addr) 
{
	symbol *fields = SPEC_STRUCT(type)->fields;

	fprintf(stdout," { ");
	while (fields) {
		fprintf(stdout,"%s = ",fields->name);
		if (IS_AGGREGATE(fields->type)) {
			printValAggregates(fields,fields->type,space, addr);
		} else {
			printValBasic(fields,addr,space,getSize(fields->type));
		}
		addr += getSize(fields->type);
		fields = fields->next;
	}
	fprintf(stdout,"}\n");
}

/*-----------------------------------------------------------------*/
/* printValAggregates - print value of aggregates                  */
/*-----------------------------------------------------------------*/
static void printValAggregates (symbol *sym, link *type,char space,unsigned int addr)
{

	if (IS_ARRAY(type)) {
		printArrayValue(sym, space, addr);
		return ;
	}

 	if (IS_STRUCT(type)) { 
 		printStructValue(sym,sym->type,space, addr); 
 		return; 
 	} 
}

/*-----------------------------------------------------------------*/
/* printSymValue - print value of a symbol                         */
/*-----------------------------------------------------------------*/
static void printSymValue (symbol *sym, context *cctxt)
{
    static int stack = 1;
    unsigned long val;
    /* if it is on stack then compute address & fall thru */
    if (sym->isonstack) {
	symbol *bp = symLookup("bp",cctxt);
	if (!bp) {
	    fprintf(stdout,"cannot determine stack frame\n");
	    return ;
	}

	sym->addr = simGetValue(bp->addr,bp->addrspace,bp->size)
	  + sym->offset ;      
    }
    
    /* get the value from the simulator and
       print it */
    fprintf(stdout,"$%d = ",stack++);
    /* arrays & structures first */
    if (IS_AGGREGATE(sym->type))
	printValAggregates(sym,sym->type,sym->addrspace,sym->addr);
    else
	/* functions */
	if (IS_FUNC(sym->type))
	    printValFunc(sym);
	else {
	    printValBasic(sym,sym->addr,sym->addrspace,sym->size);
	    fprintf(stdout,"\n");
	}
}

/*-----------------------------------------------------------------*/
/* printStructInfo - print out structure information               */
/*-----------------------------------------------------------------*/
static void printStructInfo (structdef *sdef)
{
    symbol *field = sdef->fields ;
    int i = 0 ;
    
    while (field) {
	i += field->offset;
	field = field->next;
    }

    fprintf(stdout,"%s %s {\n",(i ? "struct" : "union" ), sdef->tag);
    field = sdef->fields;
    while (field) {
	printTypeInfo (field->type);
	fprintf(stdout," %s ;\n",field->name);
	field = field->next ;
    }

    fprintf(stdout,"}\n");

}

/*-----------------------------------------------------------------*/
/* printTypeInfo - print out the type information                  */
/*-----------------------------------------------------------------*/
static void printTypeInfo(link *p)
{
    if (!p)
	return ;

    if (IS_DECL(p)) {
	switch (DCL_TYPE(p))  {
	case FUNCTION:
	    printTypeInfo (p->next);
	    fprintf(stdout,"()");
	    break;
	case ARRAY:
	    printTypeInfo (p->next);
	    fprintf(stdout,"[%d]",DCL_ELEM(p));
	    break;
	
	case IPOINTER:
	case PPOINTER:
	case POINTER:
	    printTypeInfo (p->next);
	    fprintf(stdout,"(_near *)");
	    break;

	case FPOINTER:
	    printTypeInfo (p->next);
	    fprintf(stdout,"(_xdata *)");
	    break;

	case CPOINTER:
	    printTypeInfo( p->next);
	    fprintf(stdout,"(_code *)");
	    break;
	    
	case GPOINTER:
	    printTypeInfo( p->next);
	    fprintf(stdout,"(_generic *)");
	    break;	             
	}
    } else {
	switch (SPEC_NOUN(p)) { /* depending on the specifier type */
	case V_INT:
	    (IS_LONG(p) ? fputs("long ",stdout) : 
	     ( IS_SHORT(p) ? fputs("short ",stdout) : 
	       fputs("int ",stdout))) ;
	    break;
	case V_FLOAT:
	     fputs("float ",stdout);
	     break;

	case V_CHAR:
	    fputs ("char ",stdout);
	    break;

	case V_VOID:
	    fputs("void ",stdout);
	    break;

	case V_STRUCT:
	    printStructInfo (SPEC_STRUCT(p));
	    break;

	case V_SBIT:
	    fputs("sbit ",stdout);
	    break;

	case V_BIT:
	    fprintf(stdout,": %d" ,SPEC_BLEN(p));       
	    break;
	}
    }
}

/*-----------------------------------------------------------------*/
/* cmdPrint - print value of variable                              */
/*-----------------------------------------------------------------*/
int cmdPrint (char *s, context *cctxt)
{   
    symbol *sym ;
    char *bp = s+strlen(s) -1;

    while (isspace(*s)) s++;
    if (!*s) return 0;
    while (isspace(*bp)) bp--;
    bp++ ;
    *bp = '\0';

    if (!cctxt || !cctxt->func) {
	fprintf(stdout,"No symbol \"%s\" in current context.\n",
		s);
	return 0;
    }
    if ((sym = symLookup(s,cctxt))) {
	printSymValue(sym,cctxt);
    } else {
	fprintf(stdout,
		"No symbol \"%s\" in current context.\n",	       
		s);
    }
    return 0;
}

/*-----------------------------------------------------------------*/
/* cmdPrintType - print type of a variable                         */
/*-----------------------------------------------------------------*/
int cmdPrintType (char *s, context *cctxt)
{   
        symbol *sym ;
    char *bp = s+strlen(s) -1;

    while (isspace(*s)) s++;
    if (!*s) return 0;
    while (isspace(*bp)) bp--;
    bp++ ;
    *bp = '\0';

    if (!cctxt || !cctxt->func) {
	fprintf(stdout,"No symbol \"%s\" in current context.\n",
		s);
	return 0;
    }

    if ((sym = symLookup(s,cctxt))) {
	printTypeInfo(sym->type);
	fprintf(stdout,"\n");
    } else {
	fprintf(stdout,
		"No symbol \"%s\" in current context.\n",	       
		s);
    }
    return 0;   
}

/*-----------------------------------------------------------------*/
/* cmdClrUserBp - clear user break point                           */
/*-----------------------------------------------------------------*/
int cmdClrUserBp (char *s, context *cctxt)
{   
    char *bp ;    
    function *func = NULL;
	
    /* clear break point location specification can be of the following
       forms
       a) <nothing>        - break point at current location
       b) lineno           - number of the current module
       c) filename:lineno  - line number of the given file
       e) filename:function- function X in file Y (useful for static functions)
       f) function         - function entry point
    */

    if (!cctxt) {
	fprintf(stdout,"No symbol table is loaded.  Use the \"file\" command.\n");
	return 0;
    }

    /* white space skip */
    while (*s && isspace(*s)) s++;
    
    /* null terminate it after stripping trailing blanks*/
    bp = s + strlen(s);
    while (bp != s && isspace(*bp)) bp--;
    *bp = '\0';

    /* case a) nothing */
    /* if nothing given then current location : we know
       the current execution location from the currentContext */
    if (! *s ) {

	/* if current context is known */
	if (cctxt->func) 
	    /* clear the break point @ current location */
	    clearUSERbp (cctxt->addr);
	else
	    fprintf(stderr,"No default breakpoint address now.\n");
			
	goto ret ;
    }

    /* case b) lineno */
    /* check if line number */
    if (isdigit(*s)) {
	/* get the lineno */
	int line = atoi(s);

	/* if current context not present then we must get the module
	   which has main & set the break point @ line number provided
	   of that module : if current context known then set the bp 
	   at the line number given for the current module 
	*/
	if (cctxt->func) {
	    if (!cctxt->func->mod) {
		if (!applyToSet(functions,funcWithName,"main"))
		    fprintf(stderr,"Function \"main\" not defined.\n");
		else 
		    clearBPatModLine(func->mod,line);
	    } else 
		clearBPatModLine(cctxt->func->mod,line);			
	}
	
	goto ret;
    }

    if ((bp = strchr(s,':'))) {
	
	module *mod = NULL;
	*bp = '\0';
	
	if (!applyToSet(modules,moduleWithCName,s,&mod)) {
	    fprintf (stderr,"No source file named %s.\n",s);
	    goto ret;
	}

	/* case c) filename:lineno */
	if (isdigit(*(bp +1))) {	    	    
	 
	    clearBPatModLine (mod,atoi(bp+1));	    
	    goto ret;
	    
	}
	/* case d) filename:function */
	if (!applyToSet(functions,funcWithNameModule,bp+1,s,&func)) 
	    fprintf(stderr,"Function \"%s\" not defined.\n",bp+1); 
	else
	    clearBPatModLine (mod,func->entryline);
	
	goto ret;
    }
            
    /* case e) function */
    if (!applyToSet(functions,funcWithName,s,&func))
	fprintf(stderr,"Function \"%s\" not defined.\n",s); 
    else
	clearBPatModLine(func->mod,func->entryline);

 ret:    
    return 0;        
}


/*-----------------------------------------------------------------*/
/* cmdSimulator - send command to simulator                        */
/*-----------------------------------------------------------------*/
int cmdSimulator (char *s, context *cctxt)
{   
  char tmpstr[82];

    if (strlen(s) > 80) {
      printf("error 3A\n");
      exit(1);
    }
    strcpy(tmpstr, s);
    strcat(tmpstr, "\n");
    sendSim(tmpstr);
    waitForSim();
    fprintf(stdout,"%s",simResponse());
    return 0;
}

/*-----------------------------------------------------------------*/
/* cmdFrame - Frame command                                        */
/*-----------------------------------------------------------------*/
int cmdFrame (char *s, context *cctxt)
{   
    function *func ;

    if ((func = STACK_PEEK(callStack))) {
	fprintf(stdout,"#0  %s () at %s:%d\n",
		func->sym->name,func->mod->c_name,cctxt->cline);

	if (cctxt->cline < func->mod->ncLines)	    
	    fprintf(stdout,"%d\t%s",
		    cctxt->cline,
		    func->mod->cLines[cctxt->cline]->src);
    } else
	fprintf(stdout,"No stack.\n");
    return 0;
}

/*-----------------------------------------------------------------*/
/* cmdFinish - exec till end of current function                   */
/*-----------------------------------------------------------------*/
int cmdFinish (char *s, context *ctxt)
{
    if (!ctxt || ! ctxt->func) {
	fprintf(stdout,"The program is not running.\n");
	return 0;
    }

    if (srcMode == SRC_CMODE) {
	setBreakPoint (ctxt->func->sym->eaddr, CODE, STEP, 
		       stepBpCB, ctxt->func->mod->c_name, 
		       ctxt->func->exitline);
    } else {
	setBreakPoint (ctxt->func->sym->eaddr, CODE, STEP, 
		       stepBpCB, ctxt->func->mod->asm_name, 
		       ctxt->func->aexitline);
    }

    simGo(-1);
    return 0;
    
}


/*-----------------------------------------------------------------*/
/* cmdShow - show command                                          */
/*-----------------------------------------------------------------*/
int cmdShow (char *s, context *cctxt)
{
    /* skip white space */
    while (*s && isspace(*s)) s++ ;

    if (strcmp(s,"copying") == 0) {
	fputs(copying,stdout);
	return 0;
    }
    
    if (strcmp(s,"warranty") == 0) {
	fputs(warranty,stdout);
	return 0;
    }

    return 0;
}

