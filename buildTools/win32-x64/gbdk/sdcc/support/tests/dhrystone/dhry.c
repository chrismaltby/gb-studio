/** Sanatised version of the dhrystone-2.1 test.

    Modifications Michael Hope <michaelh@earthling.net>

    This is derrived from the dhrystone-2.1.tar.gz tarball available
    all over the net.  I sourced it from the Red Hat src rpm.

    Modifications:
    * Made it more ANSI compliant.
    * Changed any array function arguments to pointers to make my 
      compiler work.
    * Removed malloc's for a couple of static arrays.
    * Into one file.
    * Proc_8 is a bit messy.  It originally took a 2 dim array, but
      sdcc doesnt support this.  So the offsets are hard coded...

    Notes:
    * The comment at the start of Func_1 about the input being
      H, R on the first call is wrong - Func_1 is first called
      from Func_2 where the input is R, Y.  The test still succeeds.

    References:
    * http://www.netlib.org/performance/html/dhry.intro.html
    * http://www.netlib.org/performance/html/dhry.data.col0.html

    I couldnt find a copyright in the original - the most relevent
    part follows:

    A SPECIAL THANKS
    I didn't write the DHRYSTONE benchmark.  Rheinhold Weicker did. He has
    certainly provided us with a useful tool for benchmarking, and is
    to be congratulated.

    Rick Richardson
    PC Research, Inc.
    (201) 389-8963 (9-17 EST)
    (201) 542-3734 (7-9,17-24 EST)
    ...!uunet!pcrat!rick	(normal mail)
    ...!uunet!pcrat!dry2	(results only)
*/

#define NOENUM		1
#define NOSTRUCTASSIGN	1
#define REG

#include "dhry.h"
#include <string.h>
/** For printf */
#include <stdio.h>

#if defined(SDCC_ds390)
#include <tinibios.h>
#define clock() ClockTicks()
#define CLOCKS_PER_SEC 1000
#define memcpy(d,s,l) memcpyx(d,s,l)

#elif defined(__z80) || defined(__gbz80)
unsigned int _clock(void);

#define clock _clock
#define CLOCKS_PER_SEC	100

#else
/** For clock() */
#include <time.h>
#include <types.h>
#endif

/** Set to one to print more messages about expected values etc. 
 */
#define DEBUG	0

#if DEBUG
#define DPRINTF(_a) printf _a
#else
#define DPRINTF(_a)
#endif

Rec_Pointer     Ptr_Glob,
                Next_Ptr_Glob;
int             Int_Glob;
Boolean         Bool_Glob;
char            Ch_1_Glob,
                Ch_2_Glob;
int             Arr_1_Glob [50];
int             Arr_2_Glob [50] [50];

/* Used instead of malloc() */
static Rec_Type _r[2];

void mark(void)
{
}

void Proc_1 (REG Rec_Pointer Ptr_Val_Par);
void Proc_2 (One_Fifty *Int_Par_Ref);
void Proc_5 (void);
void Proc_4 (void);
void Proc_7 (One_Fifty Int_1_Par_Val, One_Fifty Int_2_Par_Val, One_Fifty *Int_Par_Ref);
void Proc_8 (int *Arr_1_Par_Ref, int *Arr_2_Par_Ref,
	     int Int_1_Par_Val, int Int_2_Par_Val);
void Proc_6 (Enumeration Enum_Val_Par, Enumeration *Enum_Ref_Par);
void Proc_3 (Rec_Pointer *Ptr_Ref_Par);
Enumeration Func_1 (Capital_Letter Ch_1_Par_Val, Capital_Letter Ch_2_Par_Val);
Boolean Func_2 (char *Str_1_Par_Ref, char *Str_2_Par_Ref);
Boolean Func_3 (Enumeration Enum_Par_Val);

unsigned getsp(void);

int main(void)
{
    One_Fifty       Int_1_Loc;
    REG   One_Fifty       Int_2_Loc;
    One_Fifty       Int_3_Loc;
    REG   Capital_Letter Ch_Index;
    Enumeration     Enum_Loc;
    Str_30          Str_1_Loc;
    Str_30          Str_2_Loc;
    REG   int             Run_Index;
    REG   int             Number_Of_Runs;
    unsigned  long runTime;

    printf("[dhry]\n");

    Next_Ptr_Glob = &_r[0];
    Ptr_Glob = &_r[1];

    Ptr_Glob->Ptr_Comp                    = Next_Ptr_Glob;
    Ptr_Glob->Discr                       = Ident_1;
    Ptr_Glob->variant.var_1.Enum_Comp     = Ident_3;
    Ptr_Glob->variant.var_1.Int_Comp      = 40;

    strcpy(Ptr_Glob->variant.var_1.Str_Comp, 
	    "DHRYSTONE PROGRAM, SOME STRING");
    strcpy (Str_1_Loc, "DHRYSTONE PROGRAM, 1'ST STRING");

    Arr_2_Glob [8][7] = 10;

    /* Was missing in published program. Without this statement,    */
    /* Arr_2_Glob [8][7] would have an undefined value.             */
    /* Warning: With 16-Bit processors and Number_Of_Runs > 32000,  */
    /* overflow may occur for this array element.                   */

    /* 32766 is the highest value for a 16 bitter */
#if DEBUG
    Number_Of_Runs = 3000;
#else
    Number_Of_Runs = 32766;
#endif    

    runTime = clock();

    /* Main test loop */
    for (Run_Index = 1; Run_Index <= Number_Of_Runs; ++Run_Index) {
	DPRINTF(("Run_Index = %d\n", Run_Index));
	if (!(Run_Index & 1023))
	    printf("Loops: %u\r\n", Run_Index);
	Proc_5();
	Proc_4();
	/* Ch_1_Glob == 'A', Ch_2_Glob == 'B', Bool_Glob == true */
	DPRINTF(("Ch_1_Glob '%c' == 'A', Ch_2_Glob '%c' == 'B', Bool_Glob %d == 1\n", Ch_1_Glob, Ch_2_Glob, Bool_Glob));

	Int_1_Loc = 2;
	Int_2_Loc = 3;
	strcpy (Str_2_Loc, "DHRYSTONE PROGRAM, 2'ND STRING");
	Enum_Loc = Ident_2;
	Bool_Glob = ! Func_2 (Str_1_Loc, Str_2_Loc);
	/* Bool_Glob == 1 */
	DPRINTF(("Bool_Glob %d == 1, Int_1_Loc %d == 2, Int_2_Loc %d == 3\n", Bool_Glob, Int_1_Loc, Int_2_Loc));
	while (Int_1_Loc < Int_2_Loc)  /* loop body executed once */
	    {
		DPRINTF(("m.1 Executes once.\n"));
		Int_3_Loc = 5 * Int_1_Loc - Int_2_Loc;
		/* Int_3_Loc == 7 */
		DPRINTF(("Int_3_Loc %d == 7\n", Int_3_Loc));
		DPRINTF(("Proc_7\n"));
		Proc_7 (Int_1_Loc, Int_2_Loc, &Int_3_Loc);
		/* Int_3_Loc == 7 */
		Int_1_Loc += 1;
	    } /* while */
	DPRINTF(("m.2 Check above executed once.\n"));
	/* Int_1_Loc == 3, Int_2_Loc == 3, Int_3_Loc == 7 */
	DPRINTF(("Int_1_Loc %d == 3, Int_2_Loc %d == 3, Int_3_Loc %d == 7\n",
	       Int_1_Loc, Int_2_Loc, Int_3_Loc));

	DPRINTF(("Proc_8\n"));
	Proc_8 (Arr_1_Glob, (int *)Arr_2_Glob, Int_1_Loc, Int_3_Loc);
	/* Int_Glob == 5 */
	DPRINTF(("Int_Glob %d == 5\n", Int_Glob));
	DPRINTF(("Proc_1\n"));
	Proc_1 (Ptr_Glob);
	for (Ch_Index = 'A'; Ch_Index <= Ch_2_Glob; ++Ch_Index)
	    /* loop body executed twice */
	    {
		DPRINTF(("Func_1\n"));
		if (Enum_Loc == Func_1 (Ch_Index, 'C'))
		    /* then, not executed */
		    {
			DPRINTF(("Proc_6\n"));
			Proc_6 (Ident_1, &Enum_Loc);
			strcpy (Str_2_Loc, "DHRYSTONE PROGRAM, 3'RD STRING");
			Int_2_Loc = Run_Index;
			Int_Glob = Run_Index;
		    }
	    }
	/* Int_1_Loc == 3, Int_2_Loc == 3, Int_3_Loc == 7 */
	DPRINTF(("Int_1_Loc %d == 3, Int_2_Loc %d == 3, Int_3_Loc %d == 7\n",
	       Int_1_Loc, Int_2_Loc, Int_3_Loc));

	Int_2_Loc = Int_2_Loc * Int_1_Loc;
	Int_1_Loc = Int_2_Loc / Int_3_Loc;
	Int_2_Loc = 7 * (Int_2_Loc - Int_3_Loc) - Int_1_Loc;
	/* Int_1_Loc == 1, Int_2_Loc == 13, Int_3_Loc == 7 */
	DPRINTF(("Int_1_Loc %d == 1, Int_2_Loc %d == 13, Int_3_Loc %d == 7\n",
	       Int_1_Loc, Int_2_Loc, Int_3_Loc));
	DPRINTF(("Proc_2\n"));
	Proc_2 (&Int_1_Loc);
	/* Int_1_Loc == 5 */
	DPRINTF(("Int_1_Loc %d == 5\n", Int_1_Loc));
	DPRINTF(("Looping.\n"));
    } /* loop "for Run_Index" */

    printf("Run_Index = %d\n", Run_Index);

    runTime = clock() - runTime;

#if 1
    printf ("Execution ends\n");
    printf ("\n");
    printf ("Final values of the variables used in the benchmark:\n");
    printf ("\n");
    printf ("Int_Glob:            %d\n", Int_Glob);
    printf ("        should be:   %d\n", (int)5);
    printf ("Bool_Glob:           %d\n", Bool_Glob);
    printf ("        should be:   %d\n", (int)1);
    printf ("Ch_1_Glob:           %c\n", Ch_1_Glob);
    printf ("        should be:   %c\n", 'A');
    printf ("Ch_2_Glob:           %c\n", Ch_2_Glob);
    printf ("        should be:   %c\n", 'B');
    printf ("Arr_1_Glob[8]:       %d\n", Arr_1_Glob[8]);
    printf ("        should be:   %d\n", (int)7);
#if 1
    printf ("Arr_2_Glob[8][7]:    %d\n", Arr_2_Glob[8][7]);
#endif
    printf ("        should be:   Number_Of_Runs + 10\n");
    printf ("Ptr_Glob->\n");
    printf ("  Ptr_Comp:          %d\n", (int) Ptr_Glob->Ptr_Comp);
    printf ("        should be:   (implementation-dependent)\n");
    printf ("  Discr:             %d\n", (int)Ptr_Glob->Discr);
    printf ("        should be:   %d\n", (int)0);
    printf ("  Enum_Comp:         %d\n", (int)Ptr_Glob->variant.var_1.Enum_Comp);
    printf ("        should be:   %d\n", (int)2);
    printf ("  Int_Comp:          %d\n", (int)Ptr_Glob->variant.var_1.Int_Comp);
    printf ("        should be:   %d\n", (int)17);
    printf ("  Str_Comp:          %s\n", (char *)Ptr_Glob->variant.var_1.Str_Comp);
    printf ("        should be:   DHRYSTONE PROGRAM, SOME STRING\n");
    printf ("Next_Ptr_Glob->\n");
    printf ("  Ptr_Comp:          %d\n", (int) Next_Ptr_Glob->Ptr_Comp);
    printf ("        should be:   (implementation-dependent), same as above\n");
    printf ("  Discr:             %d\n", Next_Ptr_Glob->Discr);
    printf ("        should be:   %d\n", (int)0);
    printf ("  Enum_Comp:         %d\n", Next_Ptr_Glob->variant.var_1.Enum_Comp);
    printf ("        should be:   %d\n", (int)1);
    printf ("  Int_Comp:          %d\n", Next_Ptr_Glob->variant.var_1.Int_Comp);
    printf ("        should be:   %d\n", (int)18);
    printf ("  Str_Comp:          %s\n",
	    Next_Ptr_Glob->variant.var_1.Str_Comp);
    printf ("        should be:   DHRYSTONE PROGRAM, SOME STRING\n");
    printf ("Int_1_Loc:           %d\n", Int_1_Loc);
    printf ("        should be:   %d\n", (int)5);
    printf ("Int_2_Loc:           %d\n", Int_2_Loc);
    printf ("        should be:   %d\n", (int)13);
    printf ("Int_3_Loc:           %d\n", Int_3_Loc);
    printf ("        should be:   %d\n", (int)7);
    printf ("Enum_Loc:            %d\n", Enum_Loc);
    printf ("        should be:   %d\n", (int)1);
    printf ("Str_1_Loc:           %s\n", (char *)Str_1_Loc);
    printf ("        should be:   DHRYSTONE PROGRAM, 1'ST STRING\n");
    printf ("Str_2_Loc:           %s\n", (char *)Str_2_Loc);
    printf ("        should be:   DHRYSTONE PROGRAM, 2'ND STRING\n");
    printf ("\n");
#endif
#if 1
    printf("Number of runs: %u.  runTime: %u.\n", Number_Of_Runs, (unsigned)runTime);
    mark();
    printf("Dhrystones/s = %u\n", (unsigned)((unsigned long)Number_Of_Runs / (runTime/CLOCKS_PER_SEC)));
    printf("MIPS = d/s/1757 = (sigh, need floats...)\n");
#endif
#ifdef PRINT_T_STATES    
    _printTStates();
#endif    
#if 1
    printf("Time: %lu ticks\n", runTime);
#endif
}

void Proc_1 (REG Rec_Pointer Ptr_Val_Par)
/* executed once */
{
    REG Rec_Pointer Next_Record = Ptr_Val_Par->Ptr_Comp;  
    /* == Ptr_Glob_Next */
    /* Local variable, initialized with Ptr_Val_Par->Ptr_Comp,    */
    /* corresponds to "rename" in Ada, "with" in Pascal           */
  
    structassign (*Ptr_Val_Par->Ptr_Comp, *Ptr_Glob); 
    Ptr_Val_Par->variant.var_1.Int_Comp = 5;
    Next_Record->variant.var_1.Int_Comp 
        = Ptr_Val_Par->variant.var_1.Int_Comp;
    Next_Record->Ptr_Comp = Ptr_Val_Par->Ptr_Comp;
    Proc_3 (&Next_Record->Ptr_Comp);
    /* Ptr_Val_Par->Ptr_Comp->Ptr_Comp 
       == Ptr_Glob->Ptr_Comp */
    if (Next_Record->Discr == Ident_1)
	/* then, executed */
	{
	    Next_Record->variant.var_1.Int_Comp = 6;
	    Proc_6 (Ptr_Val_Par->variant.var_1.Enum_Comp, 
		    &Next_Record->variant.var_1.Enum_Comp);
	    Next_Record->Ptr_Comp = Ptr_Glob->Ptr_Comp;
	    Proc_7 (Next_Record->variant.var_1.Int_Comp, 10, 
		    &Next_Record->variant.var_1.Int_Comp);
	}
    else /* not executed */
	structassign (*Ptr_Val_Par, *Ptr_Val_Par->Ptr_Comp);
} /* Proc_1 */


void Proc_2 (One_Fifty *Int_Par_Ref)
    /******************/
    /* executed once */
    /* *Int_Par_Ref == 1, becomes 4 */
{
    One_Fifty  Int_Loc;  
    Enumeration   Enum_Loc;

    DPRINTF(("-> Proc_2\n"));

    Int_Loc = *Int_Par_Ref + 10;
    do {
	DPRINTF(("1"));
	/* executed once */
	if (Ch_1_Glob == 'A')
	    /* then, executed */
	    {
		DPRINTF(("2"));
		Int_Loc -= 1;
		*Int_Par_Ref = Int_Loc - Int_Glob;
		Enum_Loc = Ident_1;
	    } /* if */
	DPRINTF(("3"));
    } while (Enum_Loc != Ident_1); /* true */
    DPRINTF(("Proc_2 done.\n"));
} /* Proc_2 */


void Proc_3 (Rec_Pointer *Ptr_Ref_Par)
    /******************/
    /* executed once */
    /* Ptr_Ref_Par becomes Ptr_Glob */
{
    if (Ptr_Glob != Null)
	/* then, executed */
	*Ptr_Ref_Par = Ptr_Glob->Ptr_Comp;
    Proc_7 (10, Int_Glob, &Ptr_Glob->variant.var_1.Int_Comp);
} /* Proc_3 */

void Proc_4 (void) /* without parameters */
    /*******/
    /* executed once */
{
    Boolean Bool_Loc;

    DPRINTF(("-> Proc_4\n"));
    Bool_Loc = Ch_1_Glob == 'A';
    Bool_Glob = Bool_Loc | Bool_Glob;
    Ch_2_Glob = 'B';
    DPRINTF(("Expect Ch_1_Glob '%c' == 'A'\n", (char)Ch_1_Glob));
    DPRINTF(("       Ch_2_Glob '%c' == 'B'\n", (char)Ch_2_Glob));
    DPRINTF(("       Bool_Loc %d == 1\n", (unsigned)Bool_Loc));
    DPRINTF(("       Bool_Glob %d == 1\n", (unsigned)Bool_Glob));
} /* Proc_4 */


void Proc_5 () /* without parameters */
    /*******/
    /* executed once */
{
    Ch_1_Glob = 'A';
    Bool_Glob = false;
} /* Proc_5 */

void Proc_6 (Enumeration Enum_Val_Par, Enumeration *Enum_Ref_Par)
    /*********************************/
    /* executed once */
    /* Enum_Val_Par == Ident_3, Enum_Ref_Par becomes Ident_2 */

{
    *Enum_Ref_Par = Enum_Val_Par;
    if (! Func_3 (Enum_Val_Par))
	/* then, not executed */
	*Enum_Ref_Par = Ident_4;
    switch (Enum_Val_Par)
	{
	case Ident_1: 
	    *Enum_Ref_Par = Ident_1;
	    break;
	case Ident_2: 
	    if (Int_Glob > 100)
		/* then */
		*Enum_Ref_Par = Ident_1;
	    else *Enum_Ref_Par = Ident_4;
	    break;
	case Ident_3: /* executed */
	    *Enum_Ref_Par = Ident_2;
	    break;
	case Ident_4: break;
	case Ident_5: 
	    *Enum_Ref_Par = Ident_3;
	    break;
	} /* switch */
} /* Proc_6 */


/*************************************************/
/* executed three times                                         */
/* first call:      Ch_1_Par_Val == 'H', Ch_2_Par_Val == 'R'    */
/* second call:     Ch_1_Par_Val == 'A', Ch_2_Par_Val == 'C'    */
/* third call:      Ch_1_Par_Val == 'B', Ch_2_Par_Val == 'C'    */
Enumeration Func_1 (Capital_Letter Ch_1_Par_Val, Capital_Letter Ch_2_Par_Val)
{
    Capital_Letter        Ch_1_Loc;
    Capital_Letter        Ch_2_Loc;

    DPRINTF(("-> Func_1\n"));
    DPRINTF(("  Inputs: Ch_1_Par_Val '%c' == { R, A, B }\n", (char)Ch_1_Par_Val));
    DPRINTF(("          Ch_2_Par_Val '%c' == { Y, C, C }\n", (char)Ch_2_Par_Val));

    Ch_1_Loc = Ch_1_Par_Val;
    Ch_2_Loc = Ch_1_Loc;
    if (Ch_2_Loc != Ch_2_Par_Val) {
	/* then, executed */
	return (Ident_1);
    }
    else  /* not executed */
	{
	    Ch_1_Glob = Ch_1_Loc;
	    return (Ident_2);
	}
} /* Func_1 */

Boolean Func_3 (Enumeration Enum_Par_Val)
    /***************************/
    /* executed once        */
    /* Enum_Par_Val == Ident_3 */
{
    Enumeration Enum_Loc;

    Enum_Loc = Enum_Par_Val;
    if (Enum_Loc == Ident_3)
	/* then, executed */
	return (true);
    else /* not executed */
	return (false);
} /* Func_3 */

void Proc_7 (One_Fifty Int_1_Par_Val, One_Fifty Int_2_Par_Val, One_Fifty *Int_Par_Ref)
    /**********************************************/
    /* executed three times                                      */ 
    /* first call:      Int_1_Par_Val == 2, Int_2_Par_Val == 3,  */
    /*                  Int_Par_Ref becomes 7                    */
    /* second call:     Int_1_Par_Val == 10, Int_2_Par_Val == 5, */
    /*                  Int_Par_Ref becomes 17                   */
    /* third call:      Int_1_Par_Val == 6, Int_2_Par_Val == 10, */
    /*                  Int_Par_Ref becomes 18                   */
{
    One_Fifty Int_Loc;

    Int_Loc = Int_1_Par_Val + 2;
    *Int_Par_Ref = Int_2_Par_Val + Int_Loc;
} /* Proc_7 */

/*void Proc_8 (Arr_1_Dim Arr_1_Par_Ref, Arr_2_Dim Arr_2_Par_Ref, 
  int Int_1_Par_Val, int Int_2_Par_Val)*/
void Proc_8 (int *Arr_1_Par_Ref, int *Arr_2_Par_Ref,
	     int Int_1_Par_Val, int Int_2_Par_Val)
{
    REG One_Fifty Int_Index;
    REG One_Fifty Int_Loc;

    DPRINTF(("-> Proc_8\n"));
    Int_Loc = Int_1_Par_Val + 5;
    Arr_1_Par_Ref [Int_Loc] = Int_2_Par_Val;
    DPRINTF(("Int_Loc %d == 8 Int_2_Par_Val %d == 7\n", Int_Loc, Int_2_Par_Val));

    Arr_1_Par_Ref [Int_Loc+1] = Arr_1_Par_Ref [Int_Loc];
    Arr_1_Par_Ref [Int_Loc+30] = Int_Loc;
    for (Int_Index = Int_Loc; Int_Index <= Int_Loc+1; ++Int_Index)
	Arr_2_Par_Ref [Int_Loc*50 + Int_Index] = Int_Loc;
    Arr_2_Par_Ref [Int_Loc * 50 + Int_Loc-1] += 1;
    Arr_2_Par_Ref [(Int_Loc+20 *50) + Int_Loc] = Arr_1_Par_Ref [Int_Loc];
    Int_Glob = 5;
    DPRINTF(("Arr_1_Glob[8] %d == 7\n", Arr_1_Par_Ref[8]));
}

/*********************************************************************/
/* executed once      */
/* Int_Par_Val_1 == 3 */
/* Int_Par_Val_2 == 7 */
Boolean Func_2 (char *Str_1_Par_Ref, char *Str_2_Par_Ref)
    /*************************************************/
    /* executed once */
    /* Str_1_Par_Ref == "DHRYSTONE PROGRAM, 1'ST STRING" */
    /* Str_2_Par_Ref == "DHRYSTONE PROGRAM, 2'ND STRING" */
{
    REG One_Thirty        Int_Loc;
    Capital_Letter    Ch_Loc;

    DPRINTF(("-> Func_2\n"));
    DPRINTF(("  Inputs Str_1_Par_Ref \"%s\" = \"DHRYSTONE PROGRAM, 1'ST STRING\"\n", Str_1_Par_Ref));
    DPRINTF(("         Str_2_Par_Ref \"%s\" = \"DHRYSTONE PROGRAM, 2'ND STRING\"\n", Str_2_Par_Ref));

    Int_Loc = 2;

    while (Int_Loc <= 2) {
	if (Func_1 (Str_1_Par_Ref[Int_Loc],
		    Str_2_Par_Ref[Int_Loc+1]) == Ident_1)
	    /* then, executed */
	    {
		DPRINTF(("  2.3 Then OK.\n"));
		Ch_Loc = 'A';
		Int_Loc += 1;
	    } /* if, while */
	else {
	    DPRINTF(("  2.2 Error.\n"));
	}
    }
    if (Ch_Loc >= 'W' && Ch_Loc < 'Z') {
	/* then, not executed */
	DPRINTF((" 2.4 Error\n"));
	Int_Loc = 7;
    }
    if (Ch_Loc == 'R') {
	/* then, not executed */
	DPRINTF((" 2.5 Error\n"));
	return (true);
    }
    else /* executed */
	{
	    DPRINTF(("Str_1_Par_Ref = \"%s\", Str_2_Par_Ref = \"%s\"\n",
		   Str_1_Par_Ref, Str_2_Par_Ref));
	    if (strcmp (Str_1_Par_Ref, Str_2_Par_Ref) > 0)
		/* then, not executed */
		{
		    DPRINTF((" 2.5 Error diff=%d\n", strcmp(Str_1_Par_Ref, Str_2_Par_Ref)));
		    Int_Loc += 7;
		    Int_Glob = Int_Loc;
		    return (true);
		}
	    else {
		/* executed */
		DPRINTF((" 2.6 OK\n"));
		return (false);
	    }
	} /* if Ch_Loc */
} /* Func_2 */

