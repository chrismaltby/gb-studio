#include <stdio.h>

#include "ds1621.h"
#include "pcf8591.h"


void main (void) {

  while(1) {
    printf ("% 5.2f %03u %03u %03u %03u\n\r", 
	    ReadDS1621(2),
	    ReadPCF8591(0,0), 
	    ReadPCF8591(0,1), 
	    ReadPCF8591(0,2), 
	    ReadPCF8591(0,3));
  }
}
