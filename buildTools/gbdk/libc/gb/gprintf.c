#include <stdarg.h>
#include <gb/drawing.h>

INT8 gprintf(char *fmt, ...) NONBANKED
{
  va_list ap;
  INT8 nb = 0;

  va_start(ap, fmt);
  for(; *fmt; fmt++)
    if(*fmt == '%') {
      switch(*++fmt) {
      case 'c': {
	/* char */
	  char c = va_arg(ap, char);
	  wrtchr(c);
	  break;
      }
      case 'd': {
	/* decimal int */
	  INT8 b = va_arg(ap, INT8);
	  gprintn(b, 10, SIGNED);
	  break;
      }
      case 'u': {
	  /* unsigned int */
	  INT8 b = va_arg(ap, INT8);
	  gprintn(b, 10, UNSIGNED);
	  break;
      }
      case 'o': {
	  /* octal int */
	  INT8 b = va_arg(ap, INT8);
	  gprintn(b, 8, UNSIGNED);
	  break;
      }
      case 'x': {
	  /* hexadecimal int */
	  INT8 b = va_arg(ap, INT8);
	  gprintn(b, 16, UNSIGNED);
	  break;
      }
      case 's': {
	  /* string */
	  char *s = va_arg(ap, char *);
	  gprint(s);
	  break;
      }
#if 0
      case 'l':
	/* long */
	switch(*++fmt) {
	case 'd':
	  /* decimal long */
	  gprintln(va_arg(ap, INT16), 10, SIGNED);
	  break;
	case 'u':
	  /* unsigned long */
	  gprintln(va_arg(ap, INT16), 10, UNSIGNED);
	  break;
	case 'o':
	  /* octal long */
	  gprintln(va_arg(ap, INT16), 8, UNSIGNED);
	  break;
	case 'x':
	  /* hexadecimal long */
	  gprintln(va_arg(ap, INT16), 16, UNSIGNED);
	  break;
	}
	break;
#endif
      case '%':
	/* % */
	wrtchr(*fmt);
	break;
      default:
	return -1;
      }
      nb++;
    } else
      wrtchr(*fmt);
  va_end(ap);

  return nb;
}
