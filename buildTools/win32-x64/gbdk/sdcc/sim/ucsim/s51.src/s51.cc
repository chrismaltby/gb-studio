/*
 * Simulator of microcontrollers (s51.cc)
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

// sim.src
#include "appcl.h"

// local
#include "sim51cl.h"


/*
 * Main function of the Simulator of MCS51. Everything starts here.
 */

int
main(int argc, char *argv[])
{
  int retval;
  class cl_app *app;
  class cl_sim *sim;
  
  app= new cl_app();
  app->init(argc, argv);
  sim= new cl_sim51(app);
  if (sim->init())
    return(1);
  app->set_simulator(sim);
  retval= /*sim->main()*/app->run();
  delete app;
  
  return(retval);
}

/* End of s51.src/s51.cc */
