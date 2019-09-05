#include <signal.h>
#include <unistd.h>
#include <stdio.h>

#include "memcl.h"

static int go;

static void
alarmed(int sig)
{
  go= 0;
  signal(sig, alarmed);
}

int
main(void)
{
  class cl_mem *mem;
  class cl_m   *m2;
  t_addr a;
  t_mem d;
  double counter;

  signal(SIGALRM, alarmed);

  mem= new cl_mem(MEM_SFR, "egy", 0x10000, 8);
  go= 1;
  counter= 0;
  alarm(10);
  while (go)
    for (a= 0; go && a < mem->size; a++)
      {
	t_mem d2;
	for (d2= 0; d2 <= 255; d2++)
	  {
	    mem->write(a, &d2);
	    d= mem->read(a);
	    if (d != d2)
	      printf("%ld written to mem and %ld read back!\n", d2, d);
	    counter+= 1;
	  }
      }
  printf("%g operations on classic memory within 10 sec\n", counter);

  m2= new cl_m(0x10000, 8);
  go= 1;
  counter= 0;
  alarm(10);
  while (go)
    for (a= 0; go && a < m2->size; a++)
      {
	t_mem d2;
	for (d2= 0; d2 <= 255; d2++)
	  {
	    m2->write(a, &d2);
	    d= m2->read(a);
	    if (d != d2)
	      printf("%ld written to m2 and %ld read back!\n", d2, d);
	    counter+= 1;
	  }
      }
  printf("%g operations on new memory within 10 sec\n", counter);

  return(0);
}
