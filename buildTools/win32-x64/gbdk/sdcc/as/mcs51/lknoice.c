/* lknoice.c */

/*
 * Extensions to CUG 292 linker ASLINK to produce NoICE debug files
 *
 * 31-Oct-1997 by John Hartman
 * 30-Jan-98 JLH add page to DefineNoICE for 8051
 *  2-Feb-98 JLH Allow optional .nest on local vars - C scoping rules...
 */

#include <stdio.h>
#include <setjmp.h>
#include <string.h>
#include "aslink.h"

static void DefineGlobal( char *name, Addr_T value, int page );
static void DefineScoped( char *name, Addr_T value, int page );
static void DefineFile( char *name, Addr_T value, int page );
static void DefineFunction( char *name, Addr_T value, int page );
static void DefineStaticFunction( char *name, Addr_T value, int page );
static void DefineEndFunction( Addr_T value, int page );
static void DefineLine( char *lineString, Addr_T value, int page );
static void PagedAddress( Addr_T value, int page );

/*
 * Called from lstarea in lklist.c for each symbol.
 *
 * Generates appropriate NoICE commands into output file, if any is open
 *
 */
void DefineNoICE( char *name, Addr_T value, int page )
{
	char token1[NCPS];			/* parse for file.function.symbol */
	char token2[NCPS];
	char token3[NCPS];
	//	char token4[NCPS];
	char sep1, sep2;
	int  j, level;

	/* no output if file is not open */
	if (jfp == NULL) return;

        j = sscanf( name, "%[^.]%c%[^.]%c%s",
		    token1, &sep1, token2, &sep2, token3 );
        switch (j)
	{
		/* file.function.symbol, or file.function..SPECIAL */
		case 5:
			DefineFile( token1, 0, 0 );
			if (token3[0] == '.')
			{
				if (strcmp( token3, ".FN" ) == 0)
				{
					/* Global function */
                                        DefineFunction( token2, value, page );
				}
				else if (strcmp( token3, ".SFN" ) == 0)
				{
					/* Static (file-scope) function */
					DefineStaticFunction( token2, value, page );
				}
				else if (strcmp( token3, ".EFN" ) == 0)
				{
					/* End of function */
                                        DefineEndFunction( value, page );
                                }
			}
			else
			{
				/* Function-scope var. */
				DefineFunction( token2, 0, 0 );

                                /* Look for optional level integer */
			        j = sscanf( token3, "%[^.]%c%u", token1, &sep1, &level );
                                if ((j == 3) && (level != 0))
                                {
                                	sprintf( &token1[ strlen(token1) ], "_%u", level );
                        	}
                               	DefineScoped( token1, value, page );
                        }
			break;

		/* file.func. is illegal */
		case 4:
			break;

		/* either file.symbol or file.line# */
		case 3:
			DefineFile( token1, 0, 0 );
			if ((token2[0] >= '0') && (token2[0] <= '9'))
			{
				/* Line number */
                                DefineLine( token2, value, page );
                        }
			else
			{
				/* File-scope symbol.  (Kill any function) */
				DefineEndFunction( 0, 0 );
                                DefineScoped( token2, value, page );
                        }
			break;

		/* symbol. is illegal */
		case 2:
			break;

		/* just a symbol */
		case 1:
                        DefineGlobal( token1, value, page );
                        break;
	}
}

static char currentFile[NCPS];
static char currentFunction[NCPS];

/*
 * static function:
 * Define "name" as a global symbol
 */
void DefineGlobal( char *name, Addr_T value, int page )
{
	fprintf( jfp, "DEF %s ", name );
	PagedAddress( value, page );
}

/*
 * static function:
 * Define "name" as a static (scoped) symbol
 */
void DefineScoped( char *name, Addr_T value, int page )
{
	fprintf( jfp, "DEFS %s ", name );
	PagedAddress( value, page );
}

/*
 * static function:
 * Define "name" as the current file
 */
void DefineFile( char *name, Addr_T value, int page )
{
	if (strcmpi( name, currentFile ) != 0)
	{
		strcpy( currentFile, name );
		if (value != 0)
		{
			fprintf( jfp, "FILE %s ", name );
		        PagedAddress( value, page );
		}
		else
		{
			fprintf( jfp, "FILE %s\n", name );
		}
	}
}

/*
 * static function:
 * Define "name" as the current function
 */
void DefineFunction( char *name, Addr_T value, int page )
{
	if (strcmpi( name, currentFunction ) != 0)
	{
		strcpy( currentFunction, name );
                if (value != 0)
                {
                        fprintf( jfp, "DEF %s ", name );
		        PagedAddress( value, page );
                        fprintf( jfp, "FUNC %s ", name );
		        PagedAddress( value, page );
                }
                else
                {
                        fprintf( jfp, "FUNC %s\n", name );
		}
	}
}

/*
 * static function:
 * Define "name" as the current static (scoped) function
 */
void DefineStaticFunction( char *name, Addr_T value, int page )
{
	if (strcmpi( name, currentFunction ) != 0)
	{
		strcpy( currentFunction, name );
		if (value != 0)
		{
                        fprintf( jfp, "DEFS %s ", name );
		        PagedAddress( value, page );
			fprintf( jfp, "SFUNC %s ", name );
		        PagedAddress( value, page );
		}
		else
		{
			fprintf( jfp, "SFUNC %s\n", name );
		}
	}
}

/*
 * static function:
 * Define the end of the current function
 */
void DefineEndFunction( Addr_T value, int page )
{
	if (currentFunction[0] != 0)
	{
		if (value != 0)
		{
			fprintf( jfp, "ENDF " );
		        PagedAddress( value, page );
		}
		else
		{
			fprintf( jfp, "ENDF\n" );
		}

        	currentFunction[0] = 0;
	}
}

/*
 * static function:
 * Define "lineNumber" as a line in the current file
 */
void DefineLine( char *lineString, Addr_T value, int page )
{
	int indigit, lineNumber = 0;

	while( (indigit=digit( *lineString++, 10 )) >= 0)
	{
		lineNumber = 10*lineNumber + indigit;
	}
	fprintf( jfp, "LINE %u ", lineNumber );
        PagedAddress( value, page );
}

void PagedAddress( Addr_T value, int page )
{
	fprintf( jfp, "%X:0x%X\n", page, value );
}
