/** @name Maccer
    A simple macro pre-processor based around a finite state machine

    Rather simple.  Designed originally for GBDK (www.gbdev.org/gbdk/) and
    ASxxxx but it can also target the Sega jas assembler.
    Supports macros, defines, and the including of binary and Intel IHX files

    Use doc++ to extract the comments from this file into some form of documentation
    @author Michael Hope - michaelh@earthling.net
    @date   (C) 1999
*/
/*@{*/

#include <stdio.h>
#include <ctype.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

/** #define for copius quantities of debugging info */
#define DEBUG		0

/** @name Typedefs
*/
/*@{*/
/** 32 bit unsigned */
typedef unsigned long	ULONG;
/** 16 bit unsigned */
typedef unsigned short	UWORD;
/*@}*/


/** @name Error codes */
/*@{*/
/** No error */
#define	EOK			0
/** Generic fail */ 
#define EFAIL			-1
/** File not found */
#define ENOTFOUND		-2
/** Generic file read/write error */
#define EFILE			-3
/*@}*/

/** @name States */
/*@{*/
/** Starting state */
#define RST                   0
#define SOPCODE_OR_DIRECTIVE  1
#define SOPCODE               2
#define SDIRECTIVE            3
#define SLABEL_OR_MACRO       4
#define SCOMMENT              5
#define SMACRO                6
#define SLABEL                7
#define SMACRO_WS             8
#define SMACRO_ARGS           9
#define SMACRO_ARGS_WS        10
#define SLABEL_WS             11
#define SOPCODE_ARGS          12
#define SOPCODE_ARGS_WS       13
#define SOPCODE_ARGS_SPECIAL	14
#define SOPCODE_ARGS_STRING	15
#define SOPCODE_COMMA		16
#define SOPCODE_ARGS_ENDSTRING	17
#define SOPCODE_ARGS_SPECIAL2	18
#define SERROR			19
#define SLABEL_OR_DIR		20
/*@}*/

/** @name Static strings 
 */
/*@{*/
/** List of the textual names of the states for debugging */
char state_names[][23] =
{
    "RST", "SOPCODE_OR_DIRECTIVE", "SOPCODE", "SDIRECTIVE",
    "SLABEL_OR_MACRO", "SCOMMENT", "SMACRO", "SLABEL", 
    "SMACRO_WS", "SMACRO_ARGS", "SMACRO_ARGS_WS", "SLABEL_WS",
    "SOPCODE_ARGS", "SOPCODE_ARGS_WS", "SOPCODE_ARGS_SPECIAL", "SOPCODE_ARGS_STRING",
    "SOPCODE_COMMA", "SOPCODE_ARGS_ENDSTRING", "SOPCODE_ARGS_SPECIAL2", "SERROR",
    "SLABEL_OR_DIR"
};

/** String to prepend to the output for a given state */
char prepend[][3] =
{
    "", "", "\t", "\t",
    "", "", "", "", 
    "", " ", "", "", 
    "", "", "", "",
    "", "", "", "",
    ""
};

/** String to postpend to the output */
char postpend[][3] =
{
    "", "", "\t", "\t",
    "", "", "", "", 
    "", "", "", "", 
    "", "", "", "",
    "", "", "", "", 
    ""
};

/** 1 is the corresponding state should be kept, 0 to drop it */
int remotely_interesting[] =
{
    1, 0, 1, 1,
    1, 0, 1, 1, 
    0, 1, 0, 0, 
    1, 0, 1, 1,
    1, 1, 1, 0,
    1
};
/*@}*/
/** @name Character classes 
    The various character classes for state transitions */
/*@{*/
#define TDEFAULT        0
/** ' ', '\t', but not '\n' */
#define TWHITESPACE     1
/** [a..z] | [A..Z] */
#define TALPHA          2
/** ';' */
#define TCOMMENT        3
/** '.' */
#define TDOT            4
/** '\n' or EOF */
#define TEOL            5
/** ':' */
#define TCOLON          6
/** ',' */
#define TCOMMA		7
/** '$#<>=+-(/)*' */
#define TSPECIAL	8
/** '\'', '"' */
#define TSPEECHMK	9
/** [0..9] */
#define TNUMBER		10
/*@}*/

/** @name Internal structures
 */
/*@{*/
typedef struct sstate mstate;
typedef struct sstate *pmstate;

/** A mstate contains the edges to the state transition table
   eg if the current state is current and the character calss is tokenclass
   then go to state next */
struct sstate {
    /** Current state */
    int current;
    /** The token class that causes the transition */
    int tokenclass;
    /** The next state given a valid transition */
    int next;
};

typedef struct stoken mtoken;
typedef struct stoken *pmtoken;

/** A token is a sequence of characters.  
    The list is doubly linked so that I can do evil things to it 
    Note that a list of tokens is not cicrular - the first token has previous
    set to NULL and the last has next set to NULL
*/
struct stoken {
    /** The state or type of this token */
    int state;
    /** The token text */
    char text[100];
    /** Pointer to the next token in the list */
    pmtoken next;
    /** Pointer to the previous token in the list */
    pmtoken previous;
};

typedef struct sdefine mdefine;
typedef struct sdefine *pmdefine;

/** Holds the define identifier and what it should be replaced with
    Pretty much a token based search and replace.  If the tokens text equals
    find then the text replace is printed instead 
*/
struct sdefine {
    /** Name of the define */
    char find[100];
    /** String to replace the name with */
    char replace[100];
    /** Next define in the list */
    pmdefine next;
};

typedef struct smacro mmacro;
typedef struct smacro *pmmacro;

/** A macro that expands a name into a series of tokens
    A macro is a name and a list of tokens that should be printed instead
    of the macro token
*/
struct smacro {
    /** The name of the macro */
    char name[100];
    /** Pointer to a list of tokens that should replace the name */
    pmtoken macro;
    /** A list of defines that are used as arguments to the macro */
    pmdefine args;
    /** The next macro in the list */
    pmmacro next;
};

typedef struct serror merror;
typedef struct serror *pmerror;

/** Error descriptor
    An error is a state, character class and string which describes what type of
    error has occured when your in state state and you try to follow the non-existant
    edge described by character class
*/
struct serror {
    /** The state the error occured in */
    int	state;
    /** The character class of the input that caused the error */
    int charclass;
    /** String description of what the error is */
    char description[100];
};

typedef struct sstyle mstyle;
typedef struct sstyle *pmstyle;

/** Output style definition
    A style defines assembler specific ways of inserting data eg how to start
    a hex number or how to write binary data 
    Note that an array of mstyle is terminated by a "END", "", "" style 
*/
struct sstyle {
    /** The string name of the style */
    char	name[8];
    /** What to use as a prefix to a hex number
	Used in INCBIN */
    char	hex_prefix[8];
    /** What to use to start a line of data
	Used in INCBIN.  Eg .db, DB */
    char	db[8];
};
/*@}*/

/** Style in use for this file */
pmstyle current_style;

/** Currently known styles */
static mstyle styles[] = {
	{ "asgb",	"0x",	".db" },
	{ "jas",	"$",	"dc.b" },
	{ "END",	"",		"" }		/* Terminator */
};

/** A list of all the state transitions
    Note that currently there's alot of duplication
    Note that a default action _must_ be last in the transitions for that state
*/
static mstate states[] =
{
    {RST,						TWHITESPACE,	SOPCODE_OR_DIRECTIVE },
    {RST,						TCOMMENT,		SCOMMENT },
    {RST,						TALPHA,			SLABEL_OR_MACRO },
    {RST,						TNUMBER,		SLABEL_OR_MACRO },
	{RST,						TDOT,			SLABEL_OR_DIR },
    {RST,						TEOL,			RST },
    {SOPCODE_OR_DIRECTIVE,		TWHITESPACE,	SOPCODE_OR_DIRECTIVE},
    {SOPCODE_OR_DIRECTIVE,		TDOT,			SDIRECTIVE},
    {SOPCODE_OR_DIRECTIVE,		TALPHA,			SOPCODE},
    {SOPCODE_OR_DIRECTIVE,		TCOMMENT,		SCOMMENT},
    {SOPCODE_OR_DIRECTIVE,		TEOL,			RST},
    {SOPCODE,					TEOL,			RST},
    {SOPCODE,					TWHITESPACE,	SOPCODE_ARGS_WS},
	{SOPCODE,					TCOMMENT,		SCOMMENT},
    {SOPCODE,					TDEFAULT,		SOPCODE},
    {SOPCODE_ARGS_WS,			TWHITESPACE,	SOPCODE_ARGS_WS},
    {SOPCODE_ARGS_WS,			TEOL,			RST},
    {SOPCODE_ARGS_WS,			TALPHA,			SOPCODE_ARGS},
    {SOPCODE_ARGS_WS,			TNUMBER,		SOPCODE_ARGS},
    {SOPCODE_ARGS_WS,			TSPEECHMK,		SOPCODE_ARGS_STRING},
    {SOPCODE_ARGS_WS,			TDOT,			SOPCODE_ARGS},
    {SOPCODE_ARGS_WS,			TSPECIAL,		SOPCODE_ARGS_SPECIAL},
    {SOPCODE_ARGS_WS,			TCOMMENT,		SCOMMENT},
    {SOPCODE_ARGS,				TEOL,			RST},
	{SOPCODE_ARGS,				TDOT,			SOPCODE_ARGS },
    {SOPCODE_ARGS,				TCOMMA,			SOPCODE_COMMA},
    {SOPCODE_ARGS,				TSPECIAL,		SOPCODE_ARGS_SPECIAL},
    {SOPCODE_ARGS,				TWHITESPACE,	SOPCODE_ARGS_WS},	/* xxx not really */
	{SOPCODE_ARGS,				TCOMMENT,		SCOMMENT },
	{SOPCODE_ARGS,				TALPHA,			SOPCODE_ARGS },
	{SOPCODE_ARGS,				TNUMBER,		SOPCODE_ARGS },
	{SOPCODE_ARGS,				TSPEECHMK,		SOPCODE_ARGS },
	{SOPCODE_ARGS,				TDOT,			SOPCODE_ARGS },
/*    {SOPCODE_ARGS,				TDEFAULT,		SOPCODE_ARGS},*/
    {SOPCODE_COMMA,				TWHITESPACE,	SOPCODE_ARGS_WS},
    {SOPCODE_COMMA,				TSPECIAL,		SOPCODE_ARGS_SPECIAL},
    {SOPCODE_COMMA,				TALPHA,			SOPCODE_ARGS},
    {SOPCODE_COMMA,				TNUMBER,		SOPCODE_ARGS},
    {SOPCODE_COMMA,				TSPEECHMK,		SOPCODE_ARGS_STRING},
    {SOPCODE_COMMA,				TDOT,			SOPCODE_ARGS},
    {SOPCODE_ARGS_SPECIAL,		TEOL,			RST},
	{SOPCODE_ARGS_SPECIAL,		TSPECIAL,		SOPCODE_ARGS_SPECIAL2 },
	{SOPCODE_ARGS_SPECIAL,		TCOMMENT,		SCOMMENT},
	{SOPCODE_ARGS_SPECIAL,		TDEFAULT,		SOPCODE_ARGS},
    {SOPCODE_ARGS_SPECIAL2,		TEOL,			RST},
	{SOPCODE_ARGS_SPECIAL2,		TCOMMENT,		SCOMMENT},
	{SOPCODE_ARGS_SPECIAL2,		TSPECIAL,		SOPCODE_ARGS_SPECIAL },
    {SOPCODE_ARGS_SPECIAL2,		TDEFAULT,		SOPCODE_ARGS},
    {SOPCODE_ARGS_STRING,		TSPEECHMK,		SOPCODE_ARGS_ENDSTRING},
    {SOPCODE_ARGS_STRING,		TEOL,			SERROR},
    {SOPCODE_ARGS_STRING,		TDEFAULT,		SOPCODE_ARGS_STRING},
    {SOPCODE_ARGS_ENDSTRING,	TCOMMA,			SOPCODE_COMMA},
    {SOPCODE_ARGS_ENDSTRING,	TEOL,			RST},
    {SOPCODE_ARGS_ENDSTRING,	TDEFAULT,		SOPCODE_ARGS},
    {SDIRECTIVE,				TEOL,			RST},
    {SDIRECTIVE,				TWHITESPACE,	SOPCODE_ARGS_WS},
	{SDIRECTIVE,				TCOMMENT,		SCOMMENT},
	{SDIRECTIVE,				TALPHA,			SDIRECTIVE},
    {SLABEL_OR_MACRO,			TWHITESPACE,	SMACRO_WS},
    {SLABEL_OR_MACRO,			TCOLON,			SLABEL},
    {SLABEL_OR_MACRO,			TALPHA,			SLABEL_OR_MACRO},
    {SLABEL_OR_MACRO,			TNUMBER,		SLABEL_OR_MACRO},
    {SLABEL_OR_MACRO,			TSPECIAL,		SLABEL_OR_MACRO},
    {SLABEL_OR_DIR,				TWHITESPACE,	SOPCODE_ARGS_WS},
    {SLABEL_OR_DIR,				TCOLON,			SLABEL},
    {SLABEL_OR_DIR,				TALPHA,			SLABEL_OR_DIR},
    {SLABEL_OR_DIR,				TNUMBER,		SLABEL_OR_DIR},
    {SLABEL_OR_DIR,				TSPECIAL,		SLABEL_OR_DIR},
    {SLABEL_OR_DIR,				TEOL,			RST},
    {SCOMMENT,					TEOL,			RST},
    {SCOMMENT,					TDEFAULT,		SCOMMENT},
    {SLABEL,					TCOLON,			SLABEL},
    {SLABEL,					TWHITESPACE,	SLABEL_WS},
	{SLABEL,					TCOMMENT,		SCOMMENT},
    {SLABEL,					TEOL,			RST},
    {SLABEL_WS,					TEOL,			RST},
    {SLABEL_WS,					TWHITESPACE,	SLABEL_WS},
    {SLABEL_WS,					TALPHA,			SOPCODE},
    {SLABEL_WS,					TDOT,			SDIRECTIVE},
    {SLABEL_WS,					TCOMMENT,		SCOMMENT},
    {SMACRO_WS,					TWHITESPACE,	SMACRO_WS},
    {SMACRO_WS,					TALPHA,			SMACRO},
	{SMACRO_WS,					TSPECIAL,		SOPCODE_ARGS },	/* CHECK */
	{SMACRO_WS,					TEOL,			RST },
    {SMACRO,					TEOL,			RST},
    {SMACRO,					TWHITESPACE,	SMACRO_ARGS_WS},
	{SMACRO,					TALPHA,			SMACRO},
	{SMACRO,					TNUMBER,		SMACRO},
    {SMACRO_ARGS_WS,			TWHITESPACE,	SMACRO_ARGS_WS},
    {SMACRO_ARGS_WS,			TALPHA,			SMACRO_ARGS},
    {SMACRO_ARGS_WS,			TNUMBER,		SMACRO_ARGS},
    {SMACRO_ARGS_WS,			TCOMMENT,		SCOMMENT},
    {SMACRO_ARGS,				TEOL,			RST},
    {SMACRO_ARGS,				TCOMMA,			SMACRO_ARGS_WS},
	{SMACRO_ARGS,				TALPHA,			SMACRO_ARGS},
	{SMACRO_ARGS,				TNUMBER,		SMACRO_ARGS},
	{-1, -1, -1}
};

merror errors[] = {
	{SOPCODE_ARGS_STRING,	TEOL,		"Unterminated string" },
	{SMACRO_ARGS,			TDEFAULT,	"Only alphanumberics are allowed in a macro argument name."},
	{SMACRO_ARGS_WS,		TDEFAULT,	"A macro argument must start with a letter or number"},
	{SMACRO,				TDEFAULT,	"Unexpected character in second field."},
	{RST,					TDEFAULT,	"Unexpected character at start of line."},
	{SOPCODE_OR_DIRECTIVE,	TDEFAULT,	"Unexpected character before start of opcode."},
	{SOPCODE_ARGS_WS,		TDEFAULT,	"Weird character present."},
	{SOPCODE_ARGS_WS,		TDEFAULT,	"Weird character present in argument."},
	{SDIRECTIVE,			TDEFAULT,	"Only letters can be used in a .directive."},
	{SLABEL_OR_MACRO,		TDEFAULT,	"Unexpected character in label."},
	{SLABEL,				TDEFAULT,	"Unexpected character following label."},
	{-1,					-1,			""}
};
	
int parse_in( pmtoken *first_token, char *file_name, FILE *fp );

/** Output a floating point number in GBDK format
    @param token	Pointer to the token that starts the .DF 1.0 statement
    @return 		EOK on success
 */
int output_float( pmtoken token )
{
	ULONG mantissa;
	UWORD exponent;
	double f1, f2;
	char arg[100];

	strcpy(arg, token->text);

	if (token->text[0]=='-') {
		if (token->next) {
			strcat( arg, token->next->text );
		}
	}

	f1 = strtod( arg, (char **)NULL );
	/* Convert f1 to a gb-lib type fp
	 * 24 bit mantissa followed by 7 bit exp and 1 bit sign
	*/
	if (f1!=0) {
		f2 = floor(log(fabs(f1))/log(2))+1;
		mantissa = (0x1000000*fabs(f1))/exp(f2*log(2));
		mantissa &=0xffffff;
		exponent = f2 + 0x40;
		if (f1<0)
			exponent |=0x80;
	}
	else {
		mantissa=0;
		exponent=0;
	}
	printf("; 	.df %s\n"
		   "	%s\t%s%02X,%s%02X,%s%02X,%s%02X\n",
			arg,
		    current_style->db,
		    current_style->hex_prefix,
			(unsigned int)mantissa&0x0ff,
		    current_style->hex_prefix,
			(unsigned int)((mantissa>>8)&0x0ff),
		    current_style->hex_prefix,
			(unsigned int)((mantissa>>16)&0x0ff),
		    current_style->hex_prefix,
			exponent&0xff);
	return EOK;
};

/** Holder for something clever later 
    @param function	The function that the error occured in
    @param text		The error description
 */
void record_error(char *function, char *text)
{
    fprintf( stderr, "%s: %s\n", function, text);
};


void debug(char *function, char *msg)
{
#if DEBUG
    fprintf(stderr, "%s: %s\n", function, msg);
#endif
}

/** Set the style to the one given in 'name' 
    This scans the global style list for one with the same name
    as 'name'.
    @param name		The name of the style to take on
    @return		ENOTFOUND if the style doesnt exist, EOK otherwise
*/
int set_style(char *name)
{
	pmstyle search;
	search = styles;

	while (strcmp(search->name, "END")) {
		if (!strcmp(search->name, name)) {
			current_style = search;
			return EOK;
		}
		search++;
	}
	return ENOTFOUND;
}

/** Return the character class of the current character 
    @param token	The byte to find the character class of
    @return		The character class of the byte 
*/
int get_token_class(char token)
{
    if ((token == ' ') || (token == '\t'))
	return TWHITESPACE;
    if (token == ';')
	return TCOMMENT;
    if (token == '.')
	return TDOT;
    if ((token == '\n') || (token == '\0'))
	return TEOL;
    if (token == ':')
	return TCOLON;
    if (token == ',')
	return TCOMMA;
    if ((token == '\"')||(token == '\''))
	return TSPEECHMK;
    if (strchr("$#<>=+-(/)*", token) != NULL)
	return TSPECIAL;
    if (isdigit(token))
	return TNUMBER;
    if (isprint(token))
	return TALPHA;
    return TDEFAULT;
}
	
/** Find the corresponding transition for the current character and state 
    Searches the state table for a matching start state and tokenclass
    @param state	The starting state
    @param tokenclass	The tokenclass of the current input
    @return		A pointer to the next state
*/
pmstate find_rule(int state, int tokenclass)
{
    int search;
    search = 0;

    while (states[search].current != -1) {
	if (states[search].current == state) {
	    if ((states[search].tokenclass == tokenclass)
		|| (states[search].tokenclass == TDEFAULT)) {
		debug("find_rule", "Found a rule");
		return &states[search];
	    }
	}
	search++;
    }
    debug("find_rule", "No rule found.");
    return NULL;
}

/** Create a macro from the current place in the token list
    Delete the macro definition tokens once the macro is defined
*/	
pmmacro *create_macro(pmtoken start_token, pmmacro *current_macro)
{
    pmtoken token, token_copy = NULL;		/* To pacify gcc */
    pmdefine arg = NULL;
    int first;

	
    (*current_macro) = malloc(sizeof(mmacro));
    (*current_macro)->next = NULL;

    strcpy((*current_macro)->name, start_token->text);

    /* Find the token after the next RST and copy off the args */
    token = start_token->next->next;
    first = 1;
    (*current_macro)->args = NULL;

    while ((token) && (token->state != RST)) {
	/* Add an arg to the list */
	if (first) {
	    (*current_macro)->args = malloc(sizeof(mdefine));
	    first = 0;
	    arg = (*current_macro)->args;
	}
	else {
	    arg->next = malloc(sizeof(mdefine));
	    arg = arg->next;
	}
	strcpy(arg->find, token->text);
	arg->next = NULL;
	
	token = token->next;
    }
    
    if (token) {
	token = token->next;	/* Start of macro body */
	if (token) {		/* ...potentially null */
	    /* Copy from here into the macro */
	    first = 1;
	    
	    while ((token) && (strcmp(token->text, "ENDM"))) {
		if (first) {
		    (*current_macro)->macro = malloc(sizeof(mtoken));
		    first = 0;
		    token_copy = (*current_macro)->macro;
		    token_copy->next = NULL;
		}
		else {
		    token_copy->next = malloc(sizeof(mtoken));
		    token_copy = token_copy->next;
		}
		
		memcpy(token_copy, token, sizeof(mtoken));
		token_copy->next = NULL;
		
		token = token->next;
	    }
	    /* Strip out all the tokens that describe the macro */
	    start_token->previous->next = token->next;
	    return &(*current_macro)->next;
	}
	record_error("create_macro", "Improperly terminated macro.");
	return NULL;
    }
    record_error("create_macro", "Improperly terminated macro.");
    return NULL;
};

int linkcount = 0;

/** Scan the given token list and parse in any macros
    @param current_token	A pointer to the current token in the stream
    @param first_macro		A pointer to the start of the macro list
    @return			EOK on success
*/
int add_macros(pmtoken current_token, pmmacro *first_macro)
{
    pmmacro *current_macro;

    current_macro = first_macro;

    while (current_token) {
	if (current_token->state == SLABEL_OR_MACRO) {
	    if (current_token->next!=NULL) {
		if (current_token->next->state == SMACRO) {
		    /* We have a new macro ! */
		    if (strcmp(current_token->next->text, "MACRO")) {
			record_error("add_macros", "Malformed macro line");
		    } 
		    else {
			/* Add current_token to macro list */
			current_macro = create_macro(current_token, current_macro);
		    }
		}
	    }
	}
	current_token = current_token->next;
    }
    return EOK;
}

/** Adds in the tokens from any INCLUDE statements
    @param first_token		A pointer to the token to begin parsing from
*/
int add_includes(pmtoken first_token)
{
    pmtoken current_token;
    char filename[100];
    FILE *included;
    
    current_token = first_token;
    
    while (current_token) {
	if (current_token->state == SOPCODE) {
	    if (!strcmp( current_token->text, "INCLUDE")) {
		if (current_token->next!=NULL) {
		    if (current_token->next->state==SOPCODE_ARGS_ENDSTRING) {
			/* Sofar so good */
			strcpy( filename, &current_token->next->text[1] );
			filename[strlen(filename)-1]='\0';
			included = fopen( filename, "r" );
			if (included) {
			    debug("add_includes", "Including file.");
			    if (parse_in( &current_token->next, filename, included )) {
				record_error("add_includes", "Error parsing include file.");
			    }
			    else {
				/* Leave the INCLUDE in but comment it out */
				strcpy( filename, current_token->text );
				strcpy( current_token->text, "; ");
				strcat( current_token->text, filename );
			    }
			    fclose(included);
			}
			else {
			    record_error("add_includes", "Error opening include file for reading.");
			}
		    }
		    else {
			record_error("add_includes", "Argument to INCLUDE is not a string.");
		    }
		}
		else {
		    record_error("add_includes", "No argument to INCLUDE.");
		}
	    }
	}
	current_token = current_token->next;
    }
    return EOK;
}

/** Scan the current list of defines and make any required replacements 
    Return the original text if no changes were made
*/
char *replace_defines( char *text, pmdefine first_define )
{
    pmdefine scan_defines;
    
    scan_defines = first_define;
    while (scan_defines) {
	if (!strcmp(scan_defines->find, text)) {
	    /* Found it */
	    return scan_defines->replace;
	}
	scan_defines = scan_defines->next;
    }
    return text;
}

/** Create a list of defines from the macro args */
int build_macro_args(pmmacro macro, pmtoken first_token, pmdefine first_define )
{
    /* the first arg is at first_token->next.  Scan until end of line */
    pmtoken token;
    pmdefine current_define;
    
    current_define = macro->args;
    token = first_token->next;
    
    while ((token) && (token->state != RST)) {
	if ((token->state == SOPCODE_ARGS) || (token->state == SOPCODE_ARGS_ENDSTRING)) {
	    strcpy(current_define->replace, replace_defines(token->text, first_define));
	    current_define = current_define->next;
	}
	token = token->next;
    }
    return EOK;
};

/** Get a hex byte from a file
    Doesnt die on error, but will act unpredictably
    @param fp		File to read from
    @return		The byte read
*/
int get_hex_byte(FILE *fp)
{
	int ret, got;

	got = toupper(fgetc(fp))-'0';
	if (got>9) {
		got-='A'-'9'-1;
	}
	if ((got>15)||(got<0)) {
		got = 0;
		record_error("get_hex_byte", "Invalid hex character found.");
	}
	ret = got;
	got = toupper(fgetc(fp))-'0';
	if (got>9) {
		got-='A'-'9'-1;
	}
	if ((got>15)||(got<0)) {
		got = 0;
		record_error("get_hex_byte", "Invalid hex character found.");
	}
	return ret<<4 | got;
}
	
/** Includes the binary file referenced by the current token
 */
int include_binary_file( pmtoken current_token )
{
    FILE *included;
    char filename[100];
    int count = 0;
    int byte;
    
    if (current_token->next) {
	current_token = current_token->next;
	if (current_token->state==SOPCODE_ARGS_ENDSTRING) {
	    /* Sofar so good */
	    strcpy( filename, &current_token->text[1] );
	    filename[strlen(filename)-1]='\0';
	    included = fopen( filename, "rb" );
	    if (included) {
		while ((byte=fgetc(included))!=EOF) {
		    if (count==0) {
			printf("\n\t%s\t", current_style->db);
		    }
		    else
			printf(", ");
		    printf("%s%02X", current_style->hex_prefix, byte );
		    count++;
		    if (count==8)
			count = 0;
		}
		fclose( included );
	    }
	    else {
		record_error("include_binary_file", "Cant open include file for reading.");
	    }
	}
	else
	    record_error("include_binary_file", "Argument to INCBIN is not a string.");
    }
    return EFAIL;
};

/** Includes the Intel format IHX file referenced by the current token
 */
int include_ihx_file( pmtoken current_token )
{
    FILE *included;
    char filename[100];
    int bytes_in_line;
    int addr = -1, next_addr, t, i;
    int done = 0;
    
    if (current_token->next) {
	current_token = current_token->next;
	if (current_token->state==SOPCODE_ARGS_ENDSTRING) {
	    strcpy( filename, &current_token->text[1] );
	    filename[strlen(filename)-1]='\0';
	    included = fopen( filename, "rb" );
	    if (included) {
		while (!done) {
		    if (fgetc(included)==':') {
			/* 'Valid' ihx line :) */
			bytes_in_line = get_hex_byte(included);
			next_addr = get_hex_byte(included)<<8;
			next_addr |= get_hex_byte(included);
			if (addr!=-1) {
			    if (next_addr>addr) {
				/* Pad... */
				t = 0;
				i = next_addr - addr;
				while (i>0) {
				    if ((t&7)==0) {
					printf("\n\t%s\t%s00", current_style->db, current_style->hex_prefix);
				    }
				    else {
					printf(", %s00", current_style->hex_prefix );
				    }
				    t++;
				    i--;
				}
			    }
			}
			addr = next_addr+bytes_in_line;
			if (get_hex_byte(included)==1) {
			    done = 1;				/* End of file */
			}
			else {
			    if (bytes_in_line>0) {
				printf("\n\t%s\t%s%02X", current_style->db, current_style->hex_prefix, get_hex_byte(included));
				bytes_in_line--;
				while (bytes_in_line!=0) {
				    printf(", %s%02X", current_style->hex_prefix, get_hex_byte(included));
				    bytes_in_line--;
				}
			    }
			    /* Read until end of line */
			    i = fgetc(included);
			    while ((i!='\n')&&(i!=EOF))
				i = fgetc(included);
			    if (i==EOF)
				done = 1;
			}
		    }
		    else {
			record_error("include_ihx_file", "Malformed IHX line (no starting :).");
			/* Read until end of line */
			i = fgetc(included);
			while ((i!='\n')&&(i!=EOF))
			    i = fgetc(included);
			if (i==EOF)
			    done = 1;
		    }
		}
		fclose( included );
	    }
	    else {
		record_error("include_ihx_file", "Cant open include file for reading.");
	    }
	}
	else
	    record_error("include_ihx_file", "Argument to INCIHX is not a string.");
    }
    return EFAIL;
};

/** Recursivly print the token list processing any macros as they appear
    @param current_token 	Token to begin parsing from
    @param first_macro		Pointer to the list of macros
    @param first_define		Pointer to the list of defines
 */
void print_token_chain(pmtoken current_token, pmmacro first_macro, pmdefine first_define)
{
    int dont_print = 0;

    pmmacro current_macro, scan_macro;
    current_macro = first_macro;

    while (current_token) {
	if (current_token->state == RST) {
	    if (current_token->next != NULL) {
		if (current_token->next->state != RST)
		    printf("\n");
	    }
	    dont_print = 0;
	} 
	else {
#define USE_MACROS
#ifdef USE_MACROS
	    if (current_token->state == SOPCODE) {
		/* Check to see if it's a macro */
		scan_macro = first_macro;
		while (scan_macro) {
		    if (!strcmp(scan_macro->name, current_token->text)) {
			dont_print = 1;
			build_macro_args(scan_macro, current_token, first_define);
			print_token_chain(scan_macro->macro, first_macro, scan_macro->args);
		    }
		    scan_macro = scan_macro->next;
		}
		/* Check to see if it's an INCBIN */
		if (!strcmp( current_token->text, "INCBIN")) {
		    include_binary_file( current_token );
		    dont_print = 1;
		}
		if (!strcmp( current_token->text, "INCIHX")) {
		    include_ihx_file( current_token );
		    dont_print = 1;
		}
		if (!strcmp( current_token->text, "DF")) {
		    if (current_token->next) {
			output_float(current_token->next);
		    }
		    dont_print = 1;
		}
	    }
	    /* Handle link opcodes */
	    if (!strcmp(current_token->text, "link")) {
		if (!strcmp(current_token->next->text, "DEFL")) {
		    sprintf(current_token->text, "link%u", ++linkcount);
		}
		else
		    sprintf(current_token->text, "link%u", linkcount);
	    }
	    
#endif
	    if (!dont_print) {
		printf("%s%s%s", prepend[current_token->state], replace_defines(current_token->text, first_define), postpend[current_token->state]);
		/* Special exception that doesnt easially fit in state table */
		if (current_token->next) {
		    if ((current_token->state == SOPCODE_ARGS)&&(current_token->next->state == SOPCODE_ARGS)) {
			printf(" ");
		    }
		}
	    }
	}
	current_token = current_token->next;
    }
}

/** Handles an error by printing the static error message if any
    Scans through the error message table for one that matches this
    state and character class.
    Outputs in a emacs-like next-error format
    @param line_number		The line number that this error occured at
    @param state		The state parsing was in
    @param charclass		The characterclass in the input
    @param file_name		The name of the file currently being parsed
*/
void handle_error( int line_number, int state, int charclass, char *file_name)
{
    int search, done;
    
    search = 0;
    done = 0;
    
    debug("handle_error", "entered");
    fflush(stdout);
    while ((errors[search].state !=-1)&&(!done)) {
	debug("handle_error", state_names[errors[search].state]);
	if (errors[search].state == state) {
	    if ((errors[search].charclass == TDEFAULT)||(errors[search].charclass==charclass)) {
		fprintf(stderr, "%s:%u:%s\n", file_name, line_number, errors[search].description);
		done = 1;
	    }
	}
	search++;
    }
    if (!done)
	fprintf(stderr, "%s:%u:Unexpected error due to transition from %s -> ??? Class = %u.\n", file_name, line_number, state_names[state], charclass);
}

/** Read the source file from stdin 
    @parma first_token	The token to append after
    @param fp		The file to read from
    @return		The number of errors that occured during parsing
*/
int parse_in( pmtoken *first_token, char *file_name, FILE *fp )
{
    int state;
    char line[100], current_text[100];
    char *current, *store;
    pmstate rule;
    pmtoken current_token, insert_before;
    int tokenclass;
    int line_number, errors_found;

    state = RST;
    line_number = 0;
    errors_found = 0;
    
    current_text[0] = '\0';
    store = current_text;
    
    if (*first_token) {
	insert_before = (*first_token)->next;
	current_token = *first_token;
    }
    else {
	insert_before = NULL;
	current_token = NULL;
    }
    
    while (fgets(line,100,fp)!=NULL) {
	
	current = line;
	line_number++;
	
	while ((*current != '\0')&&(state!=SERROR)) {
	    tokenclass = get_token_class(*current);
	    rule = find_rule(state, tokenclass);
#if DEBUG
	    fprintf(stderr, "[%s, %c] ", state_names[state], *current);
#endif
	    fflush(stdout);
	    
	    if ((rule != NULL)&&(rule->next!=SERROR)) {
		if ((rule->current != rule->next)) {
		    if (!((rule->next == SOPCODE_ARGS_ENDSTRING) && (rule->current == SOPCODE_ARGS_STRING))) {
			/* Print what was scanned and what rule it falls under */
			*store = '\0';
			if (remotely_interesting[state]) {
			    /* Add it on to the list of tokens */
			    
			    if (*first_token == NULL) {
				/* First in the list */
				*first_token = malloc( sizeof( mtoken ));
				current_token = *first_token;
				current_token->previous = NULL;
				insert_before = NULL;
			    }
			    else {
				current_token->next = malloc(sizeof(mtoken));
				current_token->next->previous = current_token;
				current_token = current_token->next;
			    }
			    current_token->next = insert_before;
			    
			    if (insert_before)
				insert_before->previous = current_token;
			    
			    current_token->state = state;
			    strcpy(current_token->text, current_text);
			}
			store = current_text;
			*store = '\0';
		    }
		    state = rule->next;
		}
		*store = *current;
		store++;
	    }
	    else {
		handle_error( line_number, state, tokenclass, file_name );
		state = RST;
		errors_found++;
	    }
	    current++;
	}
    }
    
    return errors_found;
};

/** Dump the currently defined macros */
int print_macros( pmmacro current_macro )
{
	pmdefine current_define;

	printf("\nDefined macros:\n");
	while (current_macro) {
	    printf("  [%s]", current_macro->name);
	    current_define = current_macro->args;
	    while (current_define) {
			printf(" %s", current_define->find);
			current_define = current_define->next;
	    }
	    printf("\n");
	    current_macro = current_macro->next;
	}
	return EOK;
}

/** Print the usage of this program */
void useage( char *program )
{
	pmstyle search;
	printf(	"maccer - assembler macro pre-processor, M. Hope 1998.\n"
			"Version " VERSION_STRING ", built " __DATE__ ".\n"
			"Useage:\n"
			"  %s [-ttype] [-o output file] [input file]\n"
			"  Will read from stdin and write to stdout otherwise.\n"
			"  'type' is the output style to use.  Currently defined styles are:\n"
			"\t"
			, program );
	search = styles;
	while (strcmp(search->name, "END")) {
		printf("%s ", search->name);
		search++;
	}
	printf("\n");
}

/** Main function 
    Parses the command line options, opens the initial files, then
    hands off to parse_in, add_macros and print_token_chain for the output
*/
int main( int argc, char **argv )
{
    pmtoken first_token;
    pmmacro first_macro;
    char file_name[100] = "<stdin>";
    int i, output_set, input_set;
    
    current_style = &styles[0];		/* Set the default style */
    first_token = NULL;
    first_macro = NULL;
    output_set = 0;
    input_set = 0;
    
    /* Handle command line arguments */
    for (i=1; i<argc; i++) {
	if (!strcmp("--help", argv[i])) {
	    useage(argv[0]);
	    return EOK;
	}
	if (argv[i][0] == '-') {
	    switch (argv[i][1]) {
	    case 'h': {
		/* Help */
		useage(argv[0]);
		return EOK;
		break;
	    }
	    case 'o': {
		if ((i+1)<argc) {
		    if (!output_set) {
			output_set = 1;
			
			if (freopen( argv[i+1], "w", stdout )==NULL) {
			    record_error( argv[0], "error: cannot open file for writing." );
			    return EFILE;
			}
		    }
		    else
			record_error( argv[0], "warning: extra -o ignored.");
		    i++;
		}
		else
		    record_error( argv[0], "warning: -o without an argument.");
		break;
	    }
	    case 't': {
		/* Set the target style */
		if (set_style(&argv[i][2])!=EOK)
		    record_error( argv[0], "warning: unknown target, ignoring.");
		break;
	    }
	    default: {
		/* Unknown option */
		record_error(argv[0], "warning: invalid option.  Try --help.");
		break;
	    }
	    }
	}
	else {
	    if (!input_set) {
		if (freopen( argv[i], "r", stdin )==NULL) {
		    record_error( argv[0], "error: cannot open file for reading.");
		    return EFILE;
		}
		input_set = 1;
		strcpy( file_name, argv[i] );
	    }
	    else {
		record_error( argv[0], "warning: second input file ignored.");
	    }
	}
    }
    
    debug("main", "calling parse_in");
    if (parse_in( &first_token, file_name, stdin )) {
	return EFAIL;
    }
    
    /* Print out the token list */
    add_includes(first_token);
    debug("main", "calling add_macros");
    add_macros(first_token, &first_macro);
    debug("main", "calling print_token_chain");
    print_token_chain(first_token, first_macro, NULL);
    
    printf("\n");
    /*	print_macros( first_macro );*/
    return EOK;
    
}
/*@}*/
