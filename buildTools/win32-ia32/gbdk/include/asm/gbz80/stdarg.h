#ifndef ASM_GBZ80_STDARG_INCLUDE
#define ASM_GBZ80_STDARG_INCLUDE

/* sdcc pushes right to left with the real sizes, not cast up
   to an int.
   so printf(int, char, long)
   results in push long, push char, push int
   On the z80 the stack grows down, so the things seem to be in
   the correct order.
 */

typedef char * va_list;
#define va_start(list, last)	list = (char *)&last + sizeof(last)
#define va_arg(list, type)	*((type *)((list += sizeof(type)) - sizeof(type)))

#define va_end(list)

#endif
