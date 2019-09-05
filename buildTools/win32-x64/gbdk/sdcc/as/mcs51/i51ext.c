/* i51ext.c */

/*
 * (C) Copyright 1989,1990
 * All Rights Reserved
 *
 * Alan R. Baldwin
 * 721 Berkeley St.
 * Kent, Ohio  44240
 *
 * Ported from 8085 to 8051 by John Hartman 30-Apr-1995
 */

#include <stdio.h>
#include <setjmp.h>
#include "asm.h"
#include "i8051.h"

char	*cpu	= "Intel 8051";
int	hilo	= 1;
char	*dsft	= "ASM";
