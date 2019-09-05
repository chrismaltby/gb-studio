/** @file asm.c
    Provides output functions that modify the output string
    based on the input tokens and the assembler token mapping
    specification loaded.

    Note that the functions below only handle digit format modifiers.
    eg %02X is ok, but %lu and %.4u will fail.
*/
#include "common.h"
#include "asm.h"

/* A 'token' is like !blah or %24f and is under the programmers
   control. */
#define MAX_TOKEN_LEN		64

static hTab *_h;

char *
FileBaseName (char *fileFullName)
{
  char *p = fileFullName;

  if (!fileFullName) {
    return "unknown";
  }

  while (*fileFullName)
    {
      if ((*fileFullName == '/') || (*fileFullName == '\\') || (*fileFullName == ':'))
	{
	  p = fileFullName;
	  p++;
	}
      fileFullName++;
    }
  return p;
}

static const char *
_findMapping (const char *szKey)
{
  return shash_find (_h, szKey);
}

#if 0
static void 
_iprintf (char *pInto, const char *sz, va_list * pap)
{
  char format[MAX_TOKEN_LEN];
  char *pStart = pInto;
  static int count;

  while (*sz)
    {
      if (*sz == '%')
	{
	  switch (*++sz)
	    {
	      /* See if it's a special emitter */
	    case 'r':
	      wassert (0);
	      break;
	      /* Name of the code segment */
	    case 'C':
	      strcpy (pInto, CODE_NAME);
	      pInto = pStart + strlen (pStart);
	      sz++;
	      break;
	    case 'F':
	      strcpy (pInto, srcFileName);
	      pInto = pStart + strlen (pStart);
	      sz++;
	      break;
	    case 'I':
	      sprintf (pInto, "%u", ++count);
	      pInto = pStart + strlen (pStart);
	      sz++;
	      break;
	    default:
	      {
		/* Scan out the arg and pass it on to sprintf */
		char *p = format;
		*p++ = '%';
		while (isdigit (*sz))
		  *p++ = *sz++;
		*p++ = *sz++;
		*p = '\0';
		vsprintf (pInto, format, *pap);
		/* PENDING: Assume that the arg length was an int */
		(void) va_arg (*pap, int);
	      }
	    }
	  pInto = pStart + strlen (pStart);
	}
      else
	{
	  *pInto++ = *sz++;
	}
    }
  *pInto = '\0';
}

void 
tvsprintf (char *buffer, const char *sz, va_list ap)
{
  char *pInto = buffer;
  char *p;
  char token[MAX_TOKEN_LEN];

  buffer[0] = '\0';

  while (*sz)
    {
      if (*sz == '!')
	{
	  /* Start of a token.  Search until the first
	     [non alplha, *] and call it a token. */
	  const char *t;
	  p = token;
	  sz++;
	  while (isalpha (*sz) || *sz == '*')
	    {
	      *p++ = *sz++;
	    }
	  *p = '\0';
	  /* Now find the token in the token list */
	  if ((t = _findMapping (token)))
	    {
	      printf ("tvsprintf: found token \"%s\" to \"%s\"\n", token, t);
	      _iprintf (pInto, t, &ap);
	      pInto = buffer + strlen (buffer);
	    }
	  else
	    {
	      fprintf (stderr, "Cant find token \"%s\"\n", token);
	      wassert (0);
	    }
	}
      else if (*sz == '%')
	{
	  p = token;
	  *p++ = *sz++;
	  while (!isalpha (*sz))
	    {
	      *p++ = *sz++;
	    }
	  *p++ = *sz++;
	  *p = '\0';
	  vsprintf (pInto, token, ap);
	  pInto = buffer + strlen (buffer);
	  (void) va_arg (ap, int);
	}
      else
	{
	  *pInto++ = *sz++;
	}
    }
  *pInto = '\0';
}
#else
// Append a string onto another, and update the pointer to the end of
// the new string.
static char *
_appendAt (char *at, char *onto, const char *sz)
{
  wassert (at && onto && sz);
  strcpy (at, sz);
  return at + strlen (sz);
}

void 
tvsprintf (char *buffer, const char *format, va_list ap)
{
  // Under Linux PPC va_list is a structure instead of a primitive type,
  // and doesnt like being passed around.  This version turns everything
  // into one function.

  // Supports:
  //  !tokens
  //  %[CIF] - special formats with no argument (ie list isnt touched)
  //  All of the system formats

  // This is acheived by expanding the tokens and zero arg formats into
  // one big format string, which is passed to the native printf.
  static int count;
  char newformat[INITIAL_INLINEASM];
  char *pInto = newformat;
  char *p;
  char token[MAX_TOKEN_LEN];
  const char *sz = format;

  // NULL terminate it to let strlen work.
  *pInto = '\0';

  while (*sz)
    {
      if (*sz == '!')
	{
	  /* Start of a token.  Search until the first
	     [non alpha, *] and call it a token. */
	  const char *t;
	  p = token;
	  sz++;
	  while (isalpha (*sz) || *sz == '*')
	    {
	      *p++ = *sz++;
	    }
	  *p = '\0';
	  /* Now find the token in the token list */
	  if ((t = _findMapping (token)))
	    {
	      pInto = _appendAt (pInto, newformat, t);
	    }
	  else
	    {
	      fprintf (stderr, "Cant find token \"%s\"\n", token);
	      wassert (0);
	    }
	}
      else if (*sz == '%')
	{
	  // See if its one that we handle.
	  sz++;
	  switch (*sz)
	    {
	    case 'C':
	      // Code segment name.
	      pInto = _appendAt (pInto, newformat, CODE_NAME);
	      break;
	    case 'F':
	      // Source file name.
	      pInto = _appendAt (pInto, newformat, srcFileName);
	      break;
	    case 'I':
	      {
		// Unique ID.
		char id[20];
		sprintf (id, "%u", ++count);
		pInto = _appendAt (pInto, newformat, id);
		break;
	      }
	    default:
	      // Not one of ours.  Copy until the end.
	      *pInto++ = '%';
	      while (!isalpha (*sz))
		{
		  *pInto++ = *sz++;
		}
	      *pInto++ = *sz++;
	    }
	}
      else
	{
	  *pInto++ = *sz++;
	}
    }
  *pInto = '\0';

  // Now do the actual printing
  vsprintf (buffer, newformat, ap);
}
#endif

void 
tfprintf (FILE * fp, const char *szFormat,...)
{
  va_list ap;
  char buffer[INITIAL_INLINEASM];

  va_start (ap, szFormat);
  tvsprintf (buffer, szFormat, ap);
  fputs (buffer, fp);
}

void 
tsprintf (char *buffer, const char *szFormat,...)
{
  va_list ap;
  va_start (ap, szFormat);
  tvsprintf (buffer, szFormat, ap);
}

void 
asm_addTree (const ASM_MAPPINGS * pMappings)
{
  const ASM_MAPPING *pMap;

  /* Traverse down first */
  if (pMappings->pParent)
    asm_addTree (pMappings->pParent);
  pMap = pMappings->pMappings;
  while (pMap->szKey && pMap->szValue) {
      shash_add (&_h, pMap->szKey, pMap->szValue);
      pMap++;
  }
}

static const ASM_MAPPING _asxxxx_mapping[] =
{
  {"labeldef", "%s::"},
  {"slabeldef", "%s:"},
  {"tlabeldef", "%05d$:"},
  {"tlabel", "%05d$"},
  {"immed", "#"},
  {"zero", "#0x00"},
  {"one", "#0x01"},
  {"area", ".area %s"},
  {"areacode", ".area %s"},
  {"areadata", ".area %s"},
  {"areahome", ".area %s"},
  {"ascii", ".ascii \"%s\""},
  {"ds", ".ds %d"},
  {"db", ".db"},
  {"dbs", ".db %s"},
  {"dw", ".dw"},
  {"dws", ".dw %s"},
  {"constbyte", "0x%02X"},
  {"constword", "0x%04X"},
  {"immedword", "#0x%04X"},
  {"immedbyte", "#0x%02X"},
  {"hashedstr", "#%s"},
  {"lsbimmeds", "#<%s"},
  {"msbimmeds", "#>%s"},
  {"module", ".module %s"},
  {"global", ".globl %s"},
  {"fileprelude", ""},
  {"functionheader",
   "; ---------------------------------\n"
   "; Function %s\n"
   "; ---------------------------------"
  },
  {"functionlabeldef", "%s:"},
  {"bankimmeds", "0	; PENDING: bank support"},
  {NULL, NULL}
};

static const ASM_MAPPING _gas_mapping[] =
{
  {"labeldef", "%s::"},
  {"slabeldef", "%s:"},
  {"tlabeldef", "%05d$:"},
  {"tlabel", "%05d$"},
  {"immed", "#"},
  {"zero", "#0x00"},
  {"one", "#0x01"},
  {"area", ".section %s"},
  {"areacode", ".section %s"},
  {"areadata", ".section %s"},
  {"areahome", ".section %s"},
  {"ascii", ".ascii \"%s\""},
  {"ds", ".ds %d"},
  {"db", ".db"},
  {"dbs", ".db %s"},
  {"dw", ".dw"},
  {"dws", ".dw %s"},
  {"constbyte", "0x%02X"},
  {"constword", "0x%04X"},
  {"immedword", "#0x%04X"},
  {"immedbyte", "#0x%02X"},
  {"hashedstr", "#%s"},
  {"lsbimmeds", "#<%s"},
  {"msbimmeds", "#>%s"},
  {"module", ".file \"%s.c\""},
  {"global", ".globl %s"},
  {"fileprelude", ""},
  {"functionheader",
   "; ---------------------------------\n"
   "; Function %s\n"
   "; ---------------------------------"
  },
  {"functionlabeldef", "%s:"},
  {"bankimmeds", "0	; PENDING: bank support"},
  {NULL, NULL}
};

const ASM_MAPPINGS asm_asxxxx_mapping =
{
  NULL,
  _asxxxx_mapping
};

const ASM_MAPPINGS asm_gas_mapping =
{
  NULL,
  _gas_mapping
};
