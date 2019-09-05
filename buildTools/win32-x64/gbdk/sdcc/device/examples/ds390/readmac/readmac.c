// readmac.c
//
// Uses the internal 1-wire access routines in ow.c to read the MAC address
// from the 2502 on the TINI.


#include <stdio.h>

#include "ow.h"
#include "crcutil.h"

void main(void)
{
   unsigned char serial[32];   
   unsigned char mac[6];
   unsigned char myCRC;
   unsigned char rc = 0;
   unsigned char i;

   printf("Probing internal one-wire bus...\n"); 

   if (owTouchReset())
   {
       printf("No presence pulse.\n");	
       rc = 1;
   }

   if (!rc && !owFirst(0, 0))
   {
       printf("Nothing on internal 1-wire bus.\n");
       rc = 1;
   }

   if (!rc)
   {
        // Find first device of type 89 on internal 1-wire.
        {
       	    owSerialNum(serial, 1);
       
	    #ifdef NOISY
       	    printf("found 1-wire device: %02x%02x%02x%02x%02x%02x%02x%02x\n",
       	    	   serial[0], serial[1], serial[2], serial[3],
       	    	   serial[4], serial[5], serial[6], serial[7]);
	    #endif
       	} while (serial[0] != 0x89 && owNext(0, 0));

        owTouchReset();
       
        if (serial[0] != 0x89)
        {
	    printf("No DS2502 found on internal 1-wire bus.\n");
	    rc = 1;
        }
   }
    
   if (!rc)
   {
       	printf("DS2502 located (ID %02x%02x%02x%02x%02x%02x%02x%02x).\n",
       	    	   serial[0], serial[1], serial[2], serial[3],
       	    	   serial[4], serial[5], serial[6], serial[7]);       
        /* Build command packet. */
	serial[0] = 0xCC;	/* Skip ROM. */
	serial[1] = 0xF0;	/* Read memory. */
	serial[2] = 0x00;	/* Start address least significant byte. */
	serial[3] = 0x00;	/* start address MSB. */
	serial[4] = 0xFF;	/* listen slot for CRC8 of 1-3. */
	
	owBlock(0, serial, 5);
	
	myCRC = docrc8(0, serial[1]);
	myCRC = docrc8(myCRC, serial[2]);
        myCRC = docrc8(myCRC, serial[3]);
	if (myCRC != serial[4])
	{
	    printf("read failed: bogus CRC: %x != %x\n", myCRC, serial[4]);
	    rc = 1;
	}
    }

    if (!rc)
    {
        for (i = 0; i < 32; i++)
        {
	    serial[i] = 0xFF;
        }
        owBlock(0, serial, 32);
	 
	#ifdef NOISY
	printf("DS2502 memory: ");
	for (i = 0; i < 32; i++)
        {
	    printf("%02x ", serial[i]);
        }       
        printf("\n");
	#endif
	{
	    unsigned char *mptr = mac;
	    unsigned char *sptr = &(serial[10]);
	    
	    for (i = 0; i < 6; i++)
	    {
		*mptr++ = *sptr--;
	    }
	}
	
	printf("MAC address: %02x%02x%02x%02x%02x%02x\n",
	        mac[0], mac[1], mac[2],
	        mac[3], mac[4], mac[5]);
	owTouchReset();
    }
}
