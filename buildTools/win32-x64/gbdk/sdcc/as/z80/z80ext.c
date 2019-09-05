/* z80ext.c */

/*
 * (C) Copyright 1989-1995
 * All Rights Reserved
 *
 * Alan R. Baldwin
 * 721 Berkeley St.
 * Kent, Ohio  44240
 */

/*
 * Extensions: P. Felber
 */

#include <stdio.h>
#include <setjmp.h>
#include "asm.h"
#include "z80.h"

#ifndef GAMEBOY
char	*cpu	= "Zilog Z80 / Hitachi HD64180";
#else /* GAMEBOY */
char	*cpu	= "GameBoy Z80-like CPU";
#endif /* GAMEBOY */
int	hilo	= 0;
char	*dsft	= "ASM";
