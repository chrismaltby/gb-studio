/*-----------------------------------------------------------------------------------*/
/* stdarg.h - ANSI macros for variable parameter list				     */
/*-----------------------------------------------------------------------------------*/

#ifndef __SDC51_STDARG_H
#define __SDC51_STDARG_H 1

#if defined(__z80) || defined(__gbz80)

typedef unsigned char * va_list;
#define va_start(list, last)	list = (unsigned char *)&last + sizeof(last)
#define va_arg(list, type)	*((type *)((list += sizeof(type)) - sizeof(type)))

#elif defined(__ds390)

typedef	unsigned char * va_list ;
#define va_arg(marker,type) *((type *)(marker -= sizeof(type)))
#define	va_start(marker,first) { marker = &first; }

#elif defined(SDCC_USE_XSTACK)

typedef	unsigned char _pdata * va_list ;
#define va_arg(marker,type) *((type data *)(marker -= sizeof(type)))
#define	va_start(marker,first) { marker = (va_list)((char _pdata *)&first); }

#else

typedef	unsigned char data * va_list ;
#define va_arg(marker,type) *((type data * )(marker -= sizeof(type)))
#define	va_start(marker,first) { marker = (va_list) ((char data * )&first); }

#endif

#define va_end(marker) marker = (va_list) 0;

#endif
