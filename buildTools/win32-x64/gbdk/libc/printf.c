/** Simple printf implementation
    Again a stub - will use the std one later...
*/
#include <gbdk-lib.h>
#include <stdio.h>
#include <stdarg.h>
#pragma bank=BASE

static void _printn(unsigned u, unsigned base, char issigned, 
                    volatile void (*emitter)(char, void *), void *pData)
{
    const char *_hex = "0123456789ABCDEF";
    if (issigned && ((int)u < 0)) {
	(*emitter)('-', pData);
	u = (unsigned)-((int)u);
    }
    if (u >= base)
	_printn(u/base, base, 0, emitter, pData);
    (*emitter)(_hex[u%base], pData);
}

/* PENDING: HACK: A bug in 2.96a pulls emitter into registers and then
   destroys them.  Marking it as volatile stops this.
*/
static void _printf(const char *format, volatile void (*emitter)(char, void *), void *pData, va_list va)
{
    while (*format) {
	if (*format == '%') {
	    switch (*++format) {
	    case 'c': {
		char c = va_arg(va, char);
		(*emitter)(c, pData);
		break;
	    }
	    case 'u':
		{
		    unsigned u = va_arg(va, unsigned);
		    _printn(u, 10, 0, emitter, pData);
		    break;
		}
	    case 'd':
		{
		    unsigned u = va_arg(va, unsigned);
		    _printn(u, 10, 1, emitter, pData);
		    break;
		}
	    case 'x':
		{
		    unsigned u = va_arg(va, unsigned);
		    _printn(u, 16, 0, emitter, pData);
		    break;
		}
	    case 's': 
		{
		    char *s = va_arg(va, char *);
		    while (*s) {
			(*emitter)(*s, pData);
			s++;
		    }
		    break;
		}
	    }
	}
	else {
	    (*emitter)(*format, pData);
	}
	format++;
    }
}

static void _char_emitter(char c, void *pData)
{
    putchar(c);
}

void printf(const char *format, ...) NONBANKED
{
    va_list va;
    va_start(va, format);

    _printf(format, _char_emitter, NULL, va);
}

typedef struct {
    char *at;
} _SPRINTF_INFO;

static void _sprintf_emitter(char c, void *pData)
{
    /* This way to avoid bugs in sdcc */
    *(((_SPRINTF_INFO *)pData)->at) = c;
    ((_SPRINTF_INFO *)pData)->at++;
}

void sprintf(char *into, const char *format, ...) NONBANKED
{
    _SPRINTF_INFO si;
    va_list va;

    si.at = into;
    va_start(va, format);

    _printf(format, _sprintf_emitter, &si, va);
    _sprintf_emitter('\0', &si);
}
