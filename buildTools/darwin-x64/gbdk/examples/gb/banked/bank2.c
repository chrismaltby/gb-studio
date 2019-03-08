#include "bank.h"
#pragma bank=2


int bank2(int i) BANKED
{
    int j;
    puts(" In bank 2");
    for (j=0; j<i; j++) {
	bank3();
    }
    return 2;
}
