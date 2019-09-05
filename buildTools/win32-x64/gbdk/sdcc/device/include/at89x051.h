/*-------------------------------------------------------------------------
  Register Declarations for Atmel AT89C1051, AT89C2051 and AT89C4051 Processors

   Written By - Bela Torok (august 2000)
   bela.torokt@kssg.ch
   based on 8051.h (8051.h must be in mcs51 subdirectory)

   KEIL C compatible definitions are included

   This program is free software; you can redistribute it and/or modify it
   under the terms of the GNU General Public License as published by the
   Free Software Foundation; either version 2, or (at your option) any
   later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.

   In other words, you are welcome to use, share and improve this program.
   You are forbidden to forbid anyone else to use, share and improve
   what you give them.   Help stamp out software-hoarding!
-------------------------------------------------------------------------*/

#ifndef AT89Cx051_H
#define AT89Cx051_H

#include <8051.h>     /* load difinitions for the 8051 core */

#ifdef REG8051_H
#undef REG8051_H
#endif

/* remove non existing registers */

#ifdef P0				  /* P0 is defined in <8051.h> */
#undef P0				  /* AT89Cx051 has no P0 */
#undef P0_0				  /* undefine bit addressable registers in P0 */
#undef P0_1
#undef P0_2
#undef P0_3
#undef P0_4
#undef P0_5
#undef P0_6
#undef P0_7
#endif

#ifdef P2				  /* P2 is defined in <8051.h> */
#undef P2				  /* AT89Cx051 has no P2 */
#undef P2_0				  /* undefine bit addressable registers in P2 */
#undef P2_1
#undef P2_2
#undef P2_3
#undef P2_4
#undef P2_5
#undef P2_6
#undef P2_7
#endif

#endif

