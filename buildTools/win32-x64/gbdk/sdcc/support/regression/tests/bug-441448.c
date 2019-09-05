/* bug-441448.c
   PENDING
 */
#include <testfwk.h>

#define DATA

typedef struct 
{ 
    unsigned char buffer[0x18];
    unsigned char OutPtr, InPtr; 
    unsigned char Count; 
} Fifo; 

DATA Fifo TxFifo={"ABCD", 0, 0, 0}, RxFifo={"FGHI", 0, 0, 0}; 
DATA unsigned char dummy1, dummy2; 

void 
testPrePostIncrement(void) 
{ 
    dummy2 = TxFifo.buffer[++TxFifo.OutPtr]; 
    dummy1 = RxFifo.buffer[RxFifo.OutPtr++];

    ASSERT(dummy2 == 'B');
    ASSERT(dummy1 == 'F');
}
