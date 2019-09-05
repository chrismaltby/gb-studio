#ifndef ASM_Z80_TYPES_INCLUDE
#define ASM_Z80_TYPES_INCLUDE

#if SDCC_PORT!=z80
#error z80 only.
#endif

typedef char          	INT8;
typedef unsigned char 	UINT8;
typedef int           	INT16;
typedef unsigned int  	UINT16;
typedef long          	INT32;
typedef unsigned long 	UINT32;

typedef int	      	size_t;
typedef UINT16		clock_t;

#endif
