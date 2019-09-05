/** @file altlex.c
    An alternate lexer to SDCC.lex.
    In development - ie messy and just plain wrong.
    Inspired by the gcc lexer, c-lex.c.
*/
#include "common.h"
#include "reswords.h"
#include <assert.h>

#define DUMP_OUTPUT		0

/* Right.  What are the parts of the C stream?  From SDCC.lex:
   D = [0..9]           digits
   L = [a..z A..Z _]    alphanumerics and _
   H = [a..f A..F 0-9]  Hex digits
   E = [eE+-0-9]        Digits in a float
   FS = [fFlL]          Specifiers for a float
   IS = [uUlL]          Specifiers for a int

   L[LD]*               A 'token' - cant think of a good name
   Check tokens against the reserved words.
   If match 
   return the token id.
   else 
   If in the typedef table, do stuff...
   Blah.  See check_type()
   0[xX]{H}+            Hex number - PENDING: specifiers
   0{D}+                Octal number - PENDING: specifiers
   {D}+                 Decimal - PENDING: specifiers
   Floats               PENDING

   Exceptions:
   Comment start        Strip until end of comment.
   ...                  Ellipses

   So the inputs are:
   Skip whitespace
   switch class
   L    Try to read a token
   D    Try to read a number
   Punct        Try to read punct
 */

extern int fatalError;
extern int lineno;
extern char *filename;

FILE *yyin;

int yylineno;
char *currFname;
char *yytext;

static char linebuf[10000];
static int linepos, linelen;
static int end_of_file;

#ifdef __GNUC__
#define INLINE	inline
#else
#define INLINE
#endif

#define ERRSINK stderr

static void 
error (const char *sz,...)
{
  va_list ap;
  fatalError++;

  if (filename && lineno)
    {
      fprintf (ERRSINK, "%s(%d):", filename, lineno);
    }
  fprintf (ERRSINK, "error *** ");
  va_start (ap, sz);
  vfprintf (ERRSINK, sz, ap);
  va_end (ap);
  fprintf (ERRSINK, "\n");
  fflush (ERRSINK);
}

static int 
underflow (void)
{
  linelen = fread (linebuf, 1, sizeof (linebuf), yyin);
  if (linelen <= 0)
    return EOF;
  linepos = 0;
  return linebuf[linepos++];
}

static int INLINE 
ygetc (void)
{
  if (linepos < linelen)
    return linebuf[linepos++];
  else
    return underflow ();
};

static int INLINE 
yungetc (int c)
{
  linebuf[--linepos] = c;
  return 0;
}

#define GETC()		ygetc()
#define UNGETC(_a)	yungetc(_a)

//#define GETC()                fgetc(yyin);
//#define UNGETC(_a)    ungetc(_a, yyin)
#define ISL(_a)		(isalnum(_a) || _a == '_')
#define ISALNUM(_a)	isalnum(_a)
#define ISHEX(_a)	isxdigit(_a)

static char *
stringLiteral (void)
{
  static char line[1000];
  int ch;
  char *str = line;

  *str++ = '\"';
  /* put into the buffer till we hit the */
  /* first \" */
  while (1)
    {

      ch = GETC ();
      if (!ch)
	break;			/* end of input */
      /* if it is a \ then everything allowed */
      if (ch == '\\')
	{
	  *str++ = ch;		/* backslash in place */
	  *str++ = GETC ();	/* following char in place */
	  continue;		/* carry on */
	}

      /* if new line we have a new line break */
      if (ch == '\n')
	break;

      /* if this is a quote then we have work to do */
      /* find the next non whitespace character     */
      /* if that is a double quote then carry on    */
      if (ch == '\"')
	{

	  while ((ch = GETC ()) && isspace (ch));
	  if (!ch)
	    break;
	  if (ch != '\"')
	    {
	      UNGETC (ch);
	      break;
	    }

	  continue;
	}
      *str++ = ch;
    }
  *str++ = '\"';
  *str = '\0';
  return line;
}

static void 
discard_comments (int type)
{
  int c;
  if (type == '*')
    {
      do
	{
	  c = GETC ();
	  if (c == '*')
	    {
	      c = GETC ();
	      if (c == '/')
		return;
	    }
	  else if (c == EOF)
	    return;
	}
      while (1);
    }
  else if (type == '/')
    {
      do
	{
	  c = GETC ();
	}
      while (c != '\n' && c != EOF);
    }
  else
    {
      assert (0);
    }
}

/* will return 1 if the string is a part
   of a target specific keyword */
static INLINE int 
isTargetKeyword (const char *s)
{
  int i;

  if (port->keywords == NULL)
    return 0;
  for (i = 0; port->keywords[i]; i++)
    {
      if (strcmp (port->keywords[i], s) == 0)
	return 1;
    }

  return 0;
}

static INLINE int 
check_token (const char *sz)
{
  const struct reserved_words *p;
  p = is_reserved_word (sz, strlen (sz));
  if (p)
    {
      if (!p->is_special || isTargetKeyword (sz))
	return p->token;
    }

  /* check if it is in the typedef table */
  if (findSym (TypedefTab, NULL, sz))
    {
      strcpy (yylval.yychar, sz);
      return TYPE_NAME;
    }
  else
    {
      strcpy (yylval.yychar, sz);
      return IDENTIFIER;
    }
}

static void 
handle_pragma (void)
{
  char line[128], *p;
  int c;

  c = GETC ();
  while (c == '\t' || c == ' ')
    c = GETC ();
  p = line;
  while (!isspace (c))
    {
      *p++ = c;
      c = GETC ();
    }
  *p = '\0';
  if (line[0] == '\0')
    error ("Missing argument to pragma");
  else
    {
      /* First give the port a chance */
      if (port->process_pragma && !port->process_pragma (line))
	return;
      /* PENDING: all the SDCC shared pragmas */
      /* Nothing handled it */
      error ("Unrecognised #pragma %s", line);
    }
}

static void 
handle_line (void)
{
  int c;
  char line[128], *p;

  c = GETC ();
  while (c == '\t' || c == ' ')
    c = GETC ();
  p = line;
  while (isdigit (c))
    {
      *p++ = c;
      c = GETC ();
    }
  *p = '\0';
  if (line[0] == '\0')
    error ("Error in number in #line");
  /* This is weird but cpp seems to add an extra three to the line no */
  yylineno = atoi (line) - 3;
  lineno = yylineno;
  /* Fetch the filename if there is one */
  while (c == '\t' || c == ' ')
    c = GETC ();
  if (c == '\"')
    {
      p = line;
      c = GETC ();
      while (c != '\"' && c != EOF && c != '\n')
	{
	  *p++ = c;
	  c = GETC ();
	}
      if (c == '\"')
	{
	  *p = '\0';
	  currFname = Safe_strdup (line);
	}
      filename = currFname;
    }
}

static INLINE void 
invalid_directive (void)
{
  error ("Invalid directive");
}

static INLINE int 
check_newline (void)
{
  int c;
  yylineno++;
  lineno = yylineno;

  /* Skip any leading white space */
  c = GETC ();
  while (c == '\t' || c == ' ')
    c = GETC ();
  /* Were only interested in #something */
  if (c != '#')
    return c;
  c = GETC ();
  while (c == '\t' || c == ' ')
    c = GETC ();
  /* The text in the stream is the type of directive */
  switch (c)
    {
    case 'l':
      /* Start of line? */
      if (GETC () == 'i' && GETC () == 'n' && GETC () == 'e')
	{
	  c = GETC ();
	  if (c == '\t' || c == ' ')
	    handle_line ();
	  else
	    invalid_directive ();
	}
      else
	invalid_directive ();
      break;
    case 'p':
      /* Start of pragma? */
      if (GETC () == 'r' && GETC () == 'a' && GETC () == 'g' &&
	  GETC () == 'm' && GETC () == 'a')
	{
	  c = GETC ();
	  if (c == '\t' || c == ' ')
	    handle_pragma ();
	  else
	    invalid_directive ();
	}
      else
	invalid_directive ();
      break;
    default:
      invalid_directive ();
    }
  /* Discard from here until the start of the next line */
  while (c != '\n' && c != EOF)
    c = GETC ();
  return c;
}

static int 
skip_whitespace (int c)
{
  while (1)
    {
      switch (c)
	{
	case ' ':
	case '\t':
	case '\f':
	case '\v':
	case '\b':
	case '\r':
	  c = GETC ();
	  break;
	case '\n':
	  c = check_newline ();
	default:
	  return c;
	}
    }
}

void 
yyerror (const char *s)
{
  if (end_of_file)
    error ("%s at end of of input", s);
  else if (yytext[0] == '\0')
    error ("%s at null character", s);
  else if (yytext[0] == '"')
    error ("%s before string constant", s);
  else if (yytext[0] == '\'')
    error ("%s before character constant", s);
  else
    error ("%s before %s", s, yytext);
}

static int 
_yylex (void)
{
  int c;
  static char line[128];
  char *p;

  yytext = line;

  c = GETC ();
  while (1)
    {
      switch (c)
	{
	case ' ':
	case '\t':
	case '\f':
	case '\v':
	case '\b':
	  /* Skip whitespace */
	  c = GETC ();
	  break;
	case '\r':
	case '\n':
	  c = skip_whitespace (c);
	  break;
	case '#':
	  UNGETC (c);
	  c = check_newline ();
	  break;
	default:
	  goto past_ws;
	}
    }

past_ws:
  /* Handle comments first */
  if (c == '/')
    {
      int c2 = GETC ();
      if (c2 == '*' || c2 == '/')
	{
	  discard_comments (c2);
	  c = GETC ();
	}
      else
	UNGETC (c2);
    }
  switch (c)
    {
    case EOF:
      end_of_file = TRUE;
      line[0] = '\0';
      return 0;
    case 'a':
    case 'b':
    case 'c':
    case 'd':
    case 'e':
    case 'f':
    case 'g':
    case 'h':
    case 'i':
    case 'j':
    case 'k':
    case 'l':
    case 'm':
    case 'n':
    case 'o':
    case 'p':
    case 'q':
    case 'r':
    case 's':
    case 't':
    case 'u':
    case 'v':
    case 'w':
    case 'x':
    case 'y':
    case 'z':
    case 'A':
    case 'B':
    case 'C':
    case 'D':
    case 'E':
    case 'F':
    case 'G':
    case 'H':
    case 'I':
    case 'J':
    case 'K':
    case 'L':
    case 'M':
    case 'N':
    case 'O':
    case 'P':
    case 'Q':
    case 'R':
    case 'S':
    case 'T':
    case 'U':
    case 'V':
    case 'W':
    case 'X':
    case 'Y':
    case 'Z':
    case '_':
      /* Start of a token.  Parse. */
      p = line;
      *p++ = c;
      c = GETC ();
      while (ISL (c))
	{
	  *p++ = c;
	  c = GETC ();
	}
      *p = '\0';
      UNGETC (c);
      return check_token (line);
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
      p = line;
      *p++ = c;
      c = GETC ();
      if (c == 'x' || c == 'X')
	{
	  *p++ = c;
	  c = GETC ();
	}
      while (ISHEX (c))
	{
	  *p++ = c;
	  c = GETC ();
	}
      if (c == 'U' || c == 'u' || c == 'L' || c == 'l')
	{
	  *p++ = c;
	  c = GETC ();
	}
      if (c == 'U' || c == 'u' || c == 'L' || c == 'l')
	{
	  *p++ = c;
	  c = GETC ();
	}
      *p = '\0';
      UNGETC (c);
      yylval.val = constVal (line);
      return CONSTANT;
    case '\"':
      /* A string */
      p = stringLiteral ();
      yylval.val = strVal (p);
      return (STRING_LITERAL);
    case '\'':
      /* Possible formats:
         ['\n', '\\', '\'', '\"'...]
         ['a'...]
       */
      p = line;
      *p++ = c;
      c = GETC ();
      if (c == '\\')
	{
	  *p++ = c;
	  c = GETC ();
	  /* Fall through */
	}
      *p++ = c;
      c = GETC ();
      *p++ = c;
      *p = '\0';
      if (c != '\'')
	{
	  error ("Unrecognised character constant %s", line);
	}
      yylval.val = charVal (line);
      return CONSTANT;
    case '=':
    case '&':
    case '!':
    case '-':
    case '+':
    case '*':
    case '/':
    case '%':
    case '<':
    case '>':
    case '^':
    case '|':
      {
	/* Cases which can be compounds */
	/* The types and classes of composites are:
	   >>= <<=
	   += -= *= /= %= &= ^= |=
	   >> << ++ --
	   && ||
	   <= >= == !=
	   ->
	   So a composite started by char 'x' can be:
	   1. Followed by itself then an equals
	   2. Followed by itself
	   3. Followed by an equals
	   4. Be a '->'
	   5. Be by itself
	 */
	int next = GETC ();
	/* Class 1 and 2 */
	if (next == c)
	  {
	    next = GETC ();
	    /* Class 1 */
	    if (next == '=')
	      {
		switch (c)
		  {
		  case '>':	// >>=

		    yylval.yyint = RIGHT_ASSIGN;
		    return RIGHT_ASSIGN;
		  case '<':	// <<=

		    yylval.yyint = LEFT_ASSIGN;
		    return LEFT_ASSIGN;
		  default:
		    error ("Unrecognised token %c%c=", c, c);
		  }
	      }
	    else
	      {
		/* Push the next char back on and find the class */
		UNGETC (next);
		/* Case 2 */
		switch (c)
		  {
		  case '>':	// >>

		    return RIGHT_OP;
		  case '<':	// <<

		    return LEFT_OP;
		  case '+':
		    return INC_OP;
		  case '-':
		    return DEC_OP;
		  case '&':
		    return AND_OP;
		  case '|':
		    return OR_OP;
		  case '=':
		    return EQ_OP;
		  default:
		    error ("Unrecognised token %c%c", c, c);
		  }
	      }
	  }
	/* Case 3 */
	else if (next == '=')
	  {
	    int result = 0;
	    switch (c)
	      {
	      case '+':
		result = ADD_ASSIGN;
		break;
	      case '-':
		result = SUB_ASSIGN;
		break;
	      case '*':
		result = MUL_ASSIGN;
		break;
	      case '/':
		result = DIV_ASSIGN;
		break;
	      case '%':
		result = MOD_ASSIGN;
		break;
	      case '&':
		result = AND_ASSIGN;
		break;
	      case '^':
		result = XOR_ASSIGN;
		break;
	      case '|':
		result = OR_ASSIGN;
		break;
	      case '<':
		result = LE_OP;
		break;
	      case '>':
		result = GE_OP;
		break;
	      case '!':
		result = NE_OP;
		break;
	      default:
		error ("Unrecognised token %c=", c);
	      }
	    if (result)
	      {
		yylval.yyint = result;
		return result;
	      }
	  }
	/* Case 4 */
	else if (c == '-' && next == '>')
	  {
	    return PTR_OP;
	  }
	/* Case 5 */
	else
	  {
	    UNGETC (next);
	    return c;
	  }
	break;
      }
    case '{':
      NestLevel++;
      return c;
    case '}':
      NestLevel--;
      return c;
    case '.':
      c = GETC ();
      if (c == '.')
	{
	  c = GETC ();
	  if (c == '.')
	    {
	      return VAR_ARGS;
	    }
	}
      UNGETC (c);
      return '.';
    case '[':
    case ']':
      return c;
    case ',':
    case ':':
    case '(':
    case ')':
    case '~':
    case '?':
    case ';':
      /* Special characters that cant be part of a composite */
      return c;
    default:
      error ("Unhandled character %c", c);
    }
  return 0;
}

#define ENTRY(_a)	case (_a): printf(#_a); break;

int 
yylex (void)
{
  int ret = _yylex ();
#if DUMP_OUTPUT
  static int lastpos = 0;
  char tmp;

  printf ("Returning ");
  switch (ret)
    {
      /* Wrapper */
      ENTRY (IDENTIFIER);
      ENTRY (TYPE_NAME);
      ENTRY (CONSTANT);
      ENTRY (STRING_LITERAL);
      ENTRY (SIZEOF);
      ENTRY (PTR_OP);
      ENTRY (INC_OP);
      ENTRY (DEC_OP);
      ENTRY (LEFT_OP);
      ENTRY (RIGHT_OP);
      ENTRY (LE_OP);
      ENTRY (GE_OP);
      ENTRY (EQ_OP);
      ENTRY (NE_OP);
      ENTRY (AND_OP);
      ENTRY (OR_OP);
      ENTRY (MUL_ASSIGN);
      ENTRY (DIV_ASSIGN);
      ENTRY (MOD_ASSIGN);
      ENTRY (ADD_ASSIGN);
      ENTRY (SUB_ASSIGN);
      ENTRY (LEFT_ASSIGN);
      ENTRY (RIGHT_ASSIGN);
      ENTRY (AND_ASSIGN);
      ENTRY (XOR_ASSIGN);
      ENTRY (OR_ASSIGN);
      ENTRY (TYPEDEF);
      ENTRY (EXTERN);
      ENTRY (STATIC);
      ENTRY (AUTO);
      ENTRY (REGISTER);
      ENTRY (CODE);
      ENTRY (EEPROM);
      ENTRY (INTERRUPT);
      ENTRY (SFR);
      ENTRY (AT);
      ENTRY (SBIT);
      ENTRY (REENTRANT);
      ENTRY (USING);
      ENTRY (XDATA);
      ENTRY (DATA);
      ENTRY (IDATA);
      ENTRY (PDATA);
      ENTRY (VAR_ARGS);
      ENTRY (CRITICAL);
      ENTRY (NONBANKED);
      ENTRY (BANKED);
      ENTRY (CHAR);
      ENTRY (SHORT);
      ENTRY (INT);
      ENTRY (LONG);
      ENTRY (SIGNED);
      ENTRY (UNSIGNED);
      ENTRY (FLOAT);
      ENTRY (DOUBLE);
      ENTRY (CONST);
      ENTRY (VOLATILE);
      ENTRY (VOID);
      ENTRY (BIT);
      ENTRY (STRUCT);
      ENTRY (UNION);
      ENTRY (ENUM);
      ENTRY (ELIPSIS);
      ENTRY (RANGE);
      ENTRY (FAR);
      ENTRY (_XDATA);
      ENTRY (_CODE);
      ENTRY (_GENERIC);
      ENTRY (_NEAR);
      ENTRY (_PDATA);
      ENTRY (_IDATA);
      ENTRY (_EEPROM);
      ENTRY (CASE);
      ENTRY (DEFAULT);
      ENTRY (IF);
      ENTRY (ELSE);
      ENTRY (SWITCH);
      ENTRY (WHILE);
      ENTRY (DO);
      ENTRY (FOR);
      ENTRY (GOTO);
      ENTRY (CONTINUE);
      ENTRY (BREAK);
      ENTRY (RETURN);
      ENTRY (INLINEASM);
      ENTRY (IFX);
      ENTRY (ADDRESS_OF);
      ENTRY (GET_VALUE_AT_ADDRESS);
      ENTRY (SPIL);
      ENTRY (UNSPIL);
      ENTRY (GETHBIT);
      ENTRY (BITWISEAND);
      ENTRY (UNARYMINUS);
      ENTRY (IPUSH);
      ENTRY (IPOP);
      ENTRY (PCALL);
      ENTRY (ENDFUNCTION);
      ENTRY (JUMPTABLE);
      ENTRY (RRC);
      ENTRY (RLC);
      ENTRY (CAST);
      ENTRY (CALL);
      ENTRY (PARAM);
      ENTRY (NULLOP);
      ENTRY (BLOCK);
      ENTRY (LABEL);
      ENTRY (RECEIVE);
      ENTRY (SEND);
    default:
      printf ("default: %c", ret);
    }
  tmp = linebuf[linepos];
  linebuf[linepos] = '\0';
  printf (" for %s (%u bytes)\n", linebuf + lastpos, linepos - lastpos);
  linebuf[linepos] = tmp;
  lastpos = linepos;
  fflush (stdout);
#endif
  return ret;
}

#define TEST(_a)	(_a) ? (void)0 : printf("Test %s failed\n", #_a);

int 
altlex_testparse (const char *input)
{
  /* Fiddle with the read-ahead buffer to insert ourselves */
  strcpy (linebuf, input);
  linelen = strlen (linebuf) + 1;
  linepos = 0;

  return yylex ();
}

int 
altlex_testchar (const char *input)
{
  value *val;
  if (altlex_testparse (input) != CONSTANT)
    return -2;
  val = yylval.val;
  if (val->type->class != SPECIFIER)
    return -3;
  if (SPEC_NOUN (val->type) != V_CHAR)
    return -4;
  if (SPEC_SCLS (val->type) != S_LITERAL)
    return -5;
  return SPEC_CVAL (val->type).v_int;
}

int 
altlex_testnum (const char *input)
{
  value *val;
  if (altlex_testparse (input) != CONSTANT)
    return -2;
  val = yylval.val;
  if (val->type->class != SPECIFIER)
    return -3;
  if (SPEC_NOUN (val->type) != V_INT)
    return -4;
  if (SPEC_SCLS (val->type) != S_LITERAL)
    return -5;
  if (SPEC_USIGN (val->type))
    return SPEC_CVAL (val->type).v_uint;
  else
    return SPEC_CVAL (val->type).v_int;
}

int 
altlex_runtests (void)
{
  /* These conditions are ripped directly from SDCC.lex */
  /* First check the parsing of the basic tokens */
  TEST (altlex_testparse (">>=") == RIGHT_ASSIGN);
  TEST (altlex_testparse ("<<=") == LEFT_ASSIGN);
  TEST (altlex_testparse ("+=") == ADD_ASSIGN);
  TEST (altlex_testparse ("-=") == SUB_ASSIGN);
  TEST (altlex_testparse ("*=") == MUL_ASSIGN);
  TEST (altlex_testparse ("/=") == DIV_ASSIGN);
  TEST (altlex_testparse ("%=") == MOD_ASSIGN);
  TEST (altlex_testparse ("&=") == AND_ASSIGN);
  TEST (altlex_testparse ("^=") == XOR_ASSIGN);
  TEST (altlex_testparse ("|=") == OR_ASSIGN);
  TEST (altlex_testparse (">>") == RIGHT_OP);
  TEST (altlex_testparse ("<<") == LEFT_OP);
  TEST (altlex_testparse ("++") == INC_OP);
  TEST (altlex_testparse ("--") == DEC_OP);
  TEST (altlex_testparse ("->") == PTR_OP);
  TEST (altlex_testparse ("&&") == AND_OP);
  TEST (altlex_testparse ("||") == OR_OP);
  TEST (altlex_testparse ("<=") == LE_OP);
  TEST (altlex_testparse (">=") == GE_OP);
  TEST (altlex_testparse ("==") == EQ_OP);
  TEST (altlex_testparse ("!=") == NE_OP);
  TEST (altlex_testparse (";") == ';');
  TEST (altlex_testparse ("{") == '{');
  TEST (altlex_testparse ("}") == '}');
  TEST (altlex_testparse (",") == ',');
  TEST (altlex_testparse (":") == ':');
  TEST (altlex_testparse ("=") == '=');
  TEST (altlex_testparse ("(") == '(');
  TEST (altlex_testparse (")") == ')');
  TEST (altlex_testparse ("[") == '[');
  TEST (altlex_testparse ("]") == ']');
  TEST (altlex_testparse (".") == '.');
  TEST (altlex_testparse ("&") == '&');
  TEST (altlex_testparse ("!") == '!');
  TEST (altlex_testparse ("~") == '~');
  TEST (altlex_testparse ("-") == '-');
  TEST (altlex_testparse ("+") == '+');
  TEST (altlex_testparse ("*") == '*');
  TEST (altlex_testparse ("/") == '/');
  TEST (altlex_testparse ("%") == '%');
  TEST (altlex_testparse ("<") == '<');
  TEST (altlex_testparse (">") == '>');
  TEST (altlex_testparse ("^") == '^');
  TEST (altlex_testparse ("|") == '|');
  TEST (altlex_testparse ("?") == '?');

  /* Now some character constants */
  TEST (altlex_testchar ("'1'") == '1');
  TEST (altlex_testchar ("'a'") == 'a');
  TEST (altlex_testchar ("'A'") == 'A');
  TEST (altlex_testchar ("'z'") == 'z');
  TEST (altlex_testchar ("'Z'") == 'Z');
  TEST (altlex_testchar ("'\n'") == '\n');
  TEST (altlex_testchar ("'\\\\'") == '\\');
  TEST (altlex_testchar ("'\\''") == '\'');

  /* And some numbers */
  TEST (altlex_testnum ("0") == 0);
  TEST (altlex_testnum ("1") == 1);
  TEST (altlex_testnum ("075") == 075);
  TEST (altlex_testnum ("0xfeed") == 0xfeed);
  TEST (altlex_testnum ("0xFEED") == 0xFEED);
  TEST (altlex_testnum ("0x00005678") == 0x5678);

  /* Keywords */
  TEST (altlex_testparse ("auto") == AUTO);
  TEST (altlex_testparse ("break") == BREAK);
  TEST (altlex_testparse ("case") == CASE);
  TEST (altlex_testparse ("char") == CHAR);
  TEST (altlex_testparse ("const") == CONST);
  TEST (altlex_testparse ("continue") == CONTINUE);
  TEST (altlex_testparse ("default") == DEFAULT);
  TEST (altlex_testparse ("do") == DO);
  /* Prints a warning */
  //    TEST(altlex_testparse("double") == FLOAT);
  TEST (altlex_testparse ("else") == ELSE);
  TEST (altlex_testparse ("enum") == ENUM);
  TEST (altlex_testparse ("extern") == EXTERN);
  TEST (altlex_testparse ("float") == FLOAT);
  TEST (altlex_testparse ("for") == FOR);
  TEST (altlex_testparse ("goto") == GOTO);
  TEST (altlex_testparse ("if") == IF);
  TEST (altlex_testparse ("int") == INT);
  TEST (altlex_testparse ("interrupt") == INTERRUPT);
  TEST (altlex_testparse ("long") == LONG);
  TEST (altlex_testparse ("register") == REGISTER);
  TEST (altlex_testparse ("return") == RETURN);
  TEST (altlex_testparse ("short") == SHORT);
  TEST (altlex_testparse ("signed") == SIGNED);
  TEST (altlex_testparse ("sizeof") == SIZEOF);
  TEST (altlex_testparse ("static") == STATIC);
  TEST (altlex_testparse ("struct") == STRUCT);
  TEST (altlex_testparse ("switch") == SWITCH);
  TEST (altlex_testparse ("typedef") == TYPEDEF);
  TEST (altlex_testparse ("union") == UNION);
  TEST (altlex_testparse ("unsigned") == UNSIGNED);
  TEST (altlex_testparse ("void") == VOID);
  TEST (altlex_testparse ("volatile") == VOLATILE);
  TEST (altlex_testparse ("while") == WHILE);
  TEST (altlex_testparse ("...") == VAR_ARGS);

#if 0
  /* Platform specific keywords */
  TEST (altlex_testparse ("sram") ==)
  {
    count ();
    TKEYWORD (XDATA);
  }
  TEST (altlex_testparse ("using") ==)
  {
    count ();
    TKEYWORD (USING);
  }
  TEST (altlex_testparse ("near") ==)
  {
    count ();
    TKEYWORD (DATA);
  }
  TEST (altlex_testparse ("at") ==)
  {
    count ();
    TKEYWORD (AT);
  }
  TEST (altlex_testparse ("bit") ==)
  {
    count ();
    TKEYWORD (BIT);
  }
  TEST (altlex_testparse ("code") ==)
  {
    count ();
    TKEYWORD (CODE);
  }
  TEST (altlex_testparse ("critical") ==)
  {
    count ();
    TKEYWORD (CRITICAL);
  }
  TEST (altlex_testparse ("data") ==)
  {
    count ();
    TKEYWORD (DATA);
  }
  TEST (altlex_testparse ("far") ==)
  {
    count ();
    TKEYWORD (XDATA);
  }
  TEST (altlex_testparse ("eeprom") ==)
  {
    count ();
    TKEYWORD (EEPROM);
  }
  TEST (altlex_testparse ("flash") ==)
  {
    count ();
    TKEYWORD (CODE);
  }
  TEST (altlex_testparse ("idata") ==)
  {
    count ();
    TKEYWORD (IDATA);
  }
  TEST (altlex_testparse ("nonbanked") ==)
  {
    count ();
    TKEYWORD (NONBANKED);
  }
  TEST (altlex_testparse ("banked") ==)
  {
    count ();
    TKEYWORD (BANKED);
  }
  TEST (altlex_testparse ("pdata") ==)
  {
    count ();
    TKEYWORD (PDATA);
  }
  TEST (altlex_testparse ("reentrant") ==)
  {
    count ();
    TKEYWORD (REENTRANT);
  }
  TEST (altlex_testparse ("sfr") ==)
  {
    count ();
    TKEYWORD (SFR);
  }
  TEST (altlex_testparse ("sbit") ==)
  {
    count ();
    TKEYWORD (SBIT);
  }
  TEST (altlex_testparse ("xdata") ==)
  {
    count ();
    TKEYWORD (XDATA);
  }
  TEST (altlex_testparse ("_data") ==)
  {
    count ();
    TKEYWORD (_NEAR);
  }
  TEST (altlex_testparse ("_code") ==)
  {
    count ();
    TKEYWORD (_CODE);
  }
  TEST (altlex_testparse ("_eeprom") ==)
  {
    count ();
    TKEYWORD (_EEPROM);
  }
  TEST (altlex_testparse ("_flash") ==)
  {
    count ();
    TKEYWORD (_CODE);
  }
  TEST (altlex_testparse ("_generic") ==)
  {
    count ();
    TKEYWORD (_GENERIC);
  }
  TEST (altlex_testparse ("_near") ==)
  {
    count ();
    TKEYWORD (_NEAR);
  }
  TEST (altlex_testparse ("_sram") ==)
  {
    count ();
    TKEYWORD (_XDATA);
  }
  TEST (altlex_testparse ("_xdata") ==)
  {
    count ();
    TKEYWORD (_XDATA);
  }
  TEST (altlex_testparse ("_pdata") ==)
  {
    count ();
    TKEYWORD (_PDATA);
  }
  TEST (altlex_testparse ("_idata") ==)
  {
    count ();
    TKEYWORD (_IDATA);
  }
#endif

  return 0;
}
