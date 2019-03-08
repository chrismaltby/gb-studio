#include <stdio.h>
#include <stdarg.h>
#include <ctype.h>

static UINT8 scan_skip(char *s, UINT8 i)
{
oncemore:
  while(isspace(s[i]))
    i++;
  if(s[i] == 0) {
    gets(s);
    i = 0;
    goto oncemore;
  }
  return i;
}

static UINT8 scan_int(char *s, UINT8 i, UINT8 base, INT8 *nb)
{
  INT8 n = 0;
  UINT8 j, sign = 0;

  switch(s[i])
    {
    case '-':
      sign++;
      /* and fall through */
    case '+':
      ++i;
      break;
    }
  while(1) {
    if(isdigit(s[i]))
      j = s[i] - '0';
    else if(isalpha(s[i]))
      j = toupper(s[i]) - 'A' + 10;
    else
      break;
    if(j >= base)
      break;
    n = base * n + j;
    i++;
  }
  *nb = (sign == 0 ? n : -n);
  return i;
}

static UINT8 scan_long(char *s, UINT8 i, UINT8 base, INT16 *nb)
{
  INT16 n = 0;
  UINT8 j, sign = 0;

  switch(s[i])
    {
    case '-':
      sign++;
      /* and fall through */
    case '+':
      ++i;
      break;
    }
  while(1) {
    if(isdigit(s[i]))
      j = s[i] - '0';
    else if(isalpha(s[i]))
      j = toupper(s[i]) - 'A' + 10;
    else
      break;
    if(j >= base)
      break;
    n = base * n + j;
    i++;
  }
  *nb = (sign == 0 ? n : -n);
  return i;
}

INT8 scanf(char *fmt, ...)
{
  va_list ap;
  char s[64];
  UINT8 i = 0;
  INT8 nb = 0;

  gets(s);
  va_start(ap, fmt);
  for(; *fmt; fmt++) {
    if(isspace(*fmt))
      continue;
    i = scan_skip(s, i);
    if(*fmt == '%') {
      switch(*++fmt) {
      case 'c':
	/* char */
	*va_arg(ap, char *) = s[i++];
	break;
      case 'd':
	/* decimal int */
      case 'u':
	/* unsigned int */
	i = scan_int(s, i, 10, va_arg(ap, INT8 *));
	break;
      case 'o':
	/* octal int */
	i = scan_int(s, i, 8, va_arg(ap, INT8 *));
	break;
      case 'x':
	/* hexadecimal int */
	i = scan_int(s, i, 16, va_arg(ap, INT8 *));
	break;
      case 's':
	/* string */
	{
	  INT8 j = 0;
	  char *d = va_arg(ap, char *);
	  while((d[j++] = s[i++]) != 0)
	    ;
	}
      break;
      case 'l':
	/* long */
	switch(*++fmt) {
	case 'd':
	  /* decimal long */
	case 'u':
	  /* unsigned long */
	  i = scan_long(s, i, 10, va_arg(ap, INT16 *));
	  break;
	case 'o':
	  /* octal long */
	  i = scan_long(s, i, 8, va_arg(ap, INT16 *));
	  break;
	case 'x':
	  /* hexadecimal long */
	  i = scan_long(s, i, 16, va_arg(ap, INT16 *));
	  break;
	}
	break;
      default:
	if(s[i] != *fmt)
	  return -1;
	break;
      }
      nb++;
    } else
      if(s[i] != *fmt)
	return -1;
  }
  va_end(ap);

  return nb;
}
