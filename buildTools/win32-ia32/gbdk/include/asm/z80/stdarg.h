#ifndef ASM_Z80_STDARG_INCLUDE
#define ASM_Z80_STDARG_INCLUDE

/* sdcc pushes right to left with the real sizes, not cast up
   to an int.
   so printf(int, char, long)
   results in push long, push char, push int
   On the z80 the stack grows down, so the things seem to be in
   the correct order.
 */

typedef char * va_list;
#define va_start(list, last)	list = (char *)&last + sizeof(last)
#ifdef STDIO_INCLUDE
#define va_arg(list, type)	*(type *)list; list + sizeof(type)
#else
#define va_arg(list, type)	(list + sizeof(type), *(type *)(list - sizeof(type)))
#endif

#endif
