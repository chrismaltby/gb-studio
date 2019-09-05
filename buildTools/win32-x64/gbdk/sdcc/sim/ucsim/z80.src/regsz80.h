/*
 * Simulator of microcontrollers (regsz80.h)
 *
 * Copyright (C) 1999,99 Drotos Daniel, Talker Bt.
 * 
 * To contact author send email to drdani@mazsola.iit.uni-miskolc.hu
 *
 */

/* This file is part of microcontroller simulator: ucsim.

UCSIM is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

UCSIM is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with UCSIM; see the file COPYING.  If not, write to the Free
Software Foundation, 59 Temple Place - Suite 330, Boston, MA
02111-1307, USA. */
/*@1@*/

#ifndef REGSAVR_HEADER
#define REGSAVR_HEADER

#include "ddconfig.h"


struct t_regpair
{
#ifdef WORDS_BIGENDIAN
  TYPE_UBYTE h;
  TYPE_UBYTE l;
#else
  TYPE_UBYTE l;
  TYPE_UBYTE h;
#endif
};

#define DEF_REGPAIR(BIGNAME,smallname) \
  union { \
    TYPE_UWORD BIGNAME; \
    struct t_regpair smallname; \
  }

struct t_regs
{
  TYPE_UBYTE A;
  TYPE_UBYTE F;
  DEF_REGPAIR(BC, bc);
  DEF_REGPAIR(DE, de);
  DEF_REGPAIR(HL, hl);
  TYPE_UWORD IX;
  TYPE_UWORD IY;
  TYPE_UWORD SP;
};

#define BIT_C	0x01
#define BIT_P	0x04
#define BIT_A	0x10
#define BIT_Z	0x40
#define BIT_S	0x80


#endif

/* End of z80.src/regsz80.h */
