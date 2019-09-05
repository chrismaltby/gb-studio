/* Demonstrates the aliasing problem with the z80 port when loop
   induction is turned on.  Run_Index and Int_2_Loc get joined into
   the same spill location.

   Stripped down version of dhry.c
 */

#include <testfwk.h>

#define NOENUM		1
#define NOSTRUCTASSIGN	1
#define REG

#define Ident_2 1

typedef int   Enumeration;

typedef int     One_Fifty;
typedef char    Capital_Letter;

char            Ch_2_Glob;

Enumeration Func_1 (Capital_Letter Ch_1_Par_Val, Capital_Letter Ch_2_Par_Val);

void
testDhry(void)
{
    One_Fifty       Int_1_Loc;
    REG   One_Fifty       Int_2_Loc;
    One_Fifty       Int_3_Loc;
    REG   Capital_Letter Ch_Index;
    Enumeration     Enum_Loc;
    REG   int             Run_Index;
    REG   int             Number_Of_Runs;

    /* Must be more than 13... */
    Number_Of_Runs = 50;

    /* Main test loop */
    for (Run_Index = 1; Run_Index <= Number_Of_Runs; ++Run_Index) {
	Int_1_Loc = 2;
	Int_2_Loc = 3;
	Enum_Loc = Ident_2;

        /* Removing this section removes the problem. */
	while (Int_1_Loc < Int_2_Loc)
	    {
		Int_3_Loc = 5 * Int_1_Loc - Int_2_Loc;
		Int_1_Loc += 1;
	    }

        /* Removing this section removes the problem. */
	for (Ch_Index = 'A'; Ch_Index <= Ch_2_Glob; ++Ch_Index)
	    {
		if (Enum_Loc == Func_1 (Ch_Index, 'C'))
		    {
			Int_2_Loc = Run_Index;
		    }
	    }

        /* Removing any one of the following lines removes the problem. */
	Int_2_Loc = Int_2_Loc * Int_1_Loc;
	Int_1_Loc = Int_2_Loc / Int_3_Loc;
	Int_2_Loc = 7 * (Int_2_Loc - Int_3_Loc) - Int_1_Loc;
    }
}

Enumeration Func_1 (Capital_Letter Ch_1_Par_Val, Capital_Letter Ch_2_Par_Val)
{
    UNUSED(Ch_1_Par_Val);
    UNUSED(Ch_2_Par_Val);

    return 0;
}
