/*
 * Simulator of microcontrollers (inst.cc)
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

#include "ddconfig.h"

// local
#include "avrcl.h"
#include "regsavr.h"


/*
 * No Instruction
 * NOP
 * 0000 0000 0000 0000
 *----------------------------------------------------------------------------
 */

int
cl_avr::nop(t_mem code)
{
  return(resGO);
}


/*
 * Sleep
 * SLEEP
 * 1001 0101 100X 1000
 *____________________________________________________________________________
 */

int
cl_avr::sleep(t_mem code)
{
  sleep_executed= 1;
  return(resGO);
}


/*
 * Watchdog Reset
 * WDR
 * 1001 0101 101X 1000
 *____________________________________________________________________________
 */

int
cl_avr::wdr(t_mem code)
{
  //FIXME
  return(resGO);
}


/*
 * Set all bits in Register
 * SER Rd  16<=d<=31
 * 1110 1111 dddd 1111
 *____________________________________________________________________________
 */

int
cl_avr::ser_Rd(t_mem code)
{
  t_addr d= (code&0xf0)>>4;
  t_mem data= 0xff;
  ram->write(d, &data);
  return(resGO);
}


/* End of avr.src/inst.cc */
