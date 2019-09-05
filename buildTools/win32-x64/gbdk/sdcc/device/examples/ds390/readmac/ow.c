//---------------------------------------------------------------------------
// Copyright (C) 2000 Dallas Semiconductor Corporation, All Rights Reserved.
// 
// Permission is hereby granted, free of charge, to any person obtaining a 
// copy of this software and associated documentation files (the "Software"), 
// to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense, 
// and/or sell copies of the Software, and to permit persons to whom the 
// Software is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included 
// in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS 
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
// MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
// IN NO EVENT SHALL DALLAS SEMICONDUCTOR BE LIABLE FOR ANY CLAIM, DAMAGES 
// OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, 
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR 
// OTHER DEALINGS IN THE SOFTWARE.
// 
// Except as contained in this notice, the name of Dallas Semiconductor 
// shall not be used except as stated in the Dallas Semiconductor 
// Branding Policy. 
//---------------------------------------------------------------------------
//
// ow.c
//
// Minimal access routines for TINI internal one-wire bus patched together
// from Dallas example code (hence the copyright notice above).
//
// Kevin Vigor, 11/20/2000
 
#include <stdio.h>

#include "ow.h"
#include "crcutil.h"

/* The internal 1-wire bus is hooked to P3.5, a.k.a T1 */
/* The "activity" LED is also hooked to this line.     */
#define INT_OW_PORT T1

// global variables for this module to hold search state information
static int LastDiscrepancy;
static int LastFamilyDiscrepancy;
static int LastDevice;
static unsigned char SerialNum[8];

//--------------------------------------------------------------------------
// Reset all of the devices on the 1-Wire Net and return the result.
//
// Returns: TRUE(1):  presense pulse(s) detected, device(s) reset
//          FALSE(0): no presense pulses detected
//
unsigned char owTouchReset(void)
{
   unsigned char result;
   
   /* Code stolen straight from appnote 126. */
   INT_OW_PORT = 0;  	/* drive bus low. */
   msDelay(480);	/* sleep 480 ms   */
   INT_OW_PORT = 1;	/* bus high. */
   msDelay(120);
   result = INT_OW_PORT; /* get presence detect pulse. */
   msDelay(360);

   return result;
}

//--------------------------------------------------------------------------
// Send 1 bit of communication to the 1-Wire Net and return the
// result 1 bit read from the 1-Wire Net.  The parameter 'sendbit'
// least significant bit is used and the least significant bit
// of the result is the return bit.
//
// Returns: 0:   0 bit read from sendbit
//          1:   1 bit read from sendbit
//
unsigned char owTouchBit(unsigned char sendbit)
{
   unsigned char result;
   
   INT_OW_PORT = 0;		/* start timeslot. */
   msDelay(1);  	

   INT_OW_PORT = sendbit;	/* send bit out. */ 
   msDelay(9);
   result = INT_OW_PORT;		/* sample result @ 10 ms. */
   msDelay(50);    	/* Kill rest of slot. */
   INT_OW_PORT = 1;		/* timeslot done. */
   msDelay(5);		/* Just to make sure... */

   return result;
}

//--------------------------------------------------------------------------
// Send 8 bits of communication to the 1-Wire Net and return the
// result 8 bits read from the 1-Wire Net.  The parameter 'sendbyte'
// least significant 8 bits are used and the least significant 8 bits
// of the result is the return byte.
//
// 'sendbyte'   - 8 bits to send (least significant byte)
//
// Returns:  8 bytes read from sendbyte
//
unsigned char owTouchByte(unsigned char sendbyte)
{
   unsigned char i;
   unsigned char result = 0;
   
   for (i = 0; i < 8; i++)
   {
       result |= (owTouchBit(sendbyte & 1) << i);
       sendbyte >>= 1;
   }
    
   return result;
}

//--------------------------------------------------------------------------
// Send 8 bits of communication to the 1-Wire Net and verify that the
// 8 bits read from the 1-Wire Net is the same (write operation).  
// The parameter 'sendbyte' least significant 8 bits are used.
//
// 'sendbyte'   - 8 bits to send (least significant byte)
//
// Returns:  TRUE: bytes written and echo was the same
//           FALSE: echo was not the same 
//
unsigned char owWriteByte(unsigned char sendbyte)
{
   return (owTouchByte(sendbyte) == sendbyte) ? TRUE : FALSE;
}

//--------------------------------------------------------------------------
// Send 8 bits of read communication to the 1-Wire Net and and return the
// result 8 bits read from the 1-Wire Net.   
//
// Returns:  8 bytes read from 1-Wire Net
//
unsigned char owReadByte(void)
{
   return owTouchByte(0xFF);
}

//--------------------------------------------------------------------------
//  Description:
//     Delay for at least 'len' ms
// 
void msDelay(unsigned int len)
{
   len; /* shut compiler up. */

   _asm
   
   ; len is in dpl/dph
   mov	r0, dpl
   mov  r1, dph
   
   mov	a, r0
   orl  a, r1			; quick out for zero case.
   jz   _sleepDone
   
   inc	r1
   cjne r0, #0, _sleep1msLoop
   dec  r1
   
   _sleep1msLoop:
   nop
   nop
   nop
   nop
   nop
   nop
   nop				; 7 nops
   djnz r0, _sleep1msLoop	; 3 cycles x 1 = 3 cycles
      				; 10 cycles per iter; we want 9.216, but more is better
      				; than less.
   djnz r1, _sleep1msLoop	
_sleepDone:
   
   _endasm;
}

//--------------------------------------------------------------------------
// The 'owBlock' transfers a block of data to and from the 
// 1-Wire Net with an optional reset at the begining of communication.
// The result is returned in the same buffer.
//
// 'do_reset' - cause a owTouchReset to occure at the begining of 
//              communication TRUE(1) or not FALSE(0)
// 'tran_buf' - pointer to a block of unsigned
//              chars of length 'TranferLength' that will be sent 
//              to the 1-Wire Net
// 'tran_len' - length in bytes to transfer

// Supported devices: all 
//
// Returns:   TRUE (1) : The optional reset returned a valid 
//                       presence (do_reset == TRUE) or there
//                       was no reset required.
//            FALSE (0): The reset did not return a valid prsence
//                       (do_reset == TRUE).
//
//  The maximum tran_len is 64
//
unsigned char owBlock(unsigned char do_reset, 
		      unsigned char *tran_buf,
		      unsigned char tran_len)
{
   int i;

   // check for a block too big
   if (tran_len > 64)
      return FALSE;

   // check if need to do a owTouchReset first
   if (do_reset)
   {
      if (!owTouchReset())
         return FALSE;
   }  

   // send and receive the buffer
   for (i = 0; i < tran_len; i++)
      tran_buf[i] = owTouchByte(tran_buf[i]);
      
   return TRUE;
}

//--------------------------------------------------------------------------
// The 'owFirst' finds the first device on the 1-Wire Net  This function 
// contains one parameter 'alarm_only'.  When 
// 'alarm_only' is TRUE (1) the find alarm command 0xEC is 
// sent instead of the normal search command 0xF0.
// Using the find alarm command 0xEC will limit the search to only
// 1-Wire devices that are in an 'alarm' state. 
//
// 'do_reset' - TRUE (1) 
//                perform reset before search. 
// 'alarm_only' - TRUE (1) the find alarm command 0xEC is 
//                sent instead of the normal search command 0xF0
//
// Returns:   TRUE (1) : when a 1-Wire device was found and it's 
//                        Serial Number placed in the global SerialNum[portnum]
//            FALSE (0): There are no devices on the 1-Wire Net.
// 
unsigned char owFirst(unsigned char do_reset, unsigned char alarm_only)
{
   // reset the search state
   LastDiscrepancy = 0;
   LastDevice = FALSE;
   LastFamilyDiscrepancy = 0; 

   return owNext(do_reset,alarm_only);
}

//--------------------------------------------------------------------------
// The 'owNext' function does a general search.  This function
// continues from the previos search state. The search state
// can be reset by using the 'owFirst' function.
// This function contains one parameter 'alarm_only'.  
// When 'alarm_only' is TRUE (1) the find alarm command 
// 0xEC is sent instead of the normal search command 0xF0.
// Using the find alarm command 0xEC will limit the search to only
// 1-Wire devices that are in an 'alarm' state. 
//
// 'do_reset'   - TRUE (1) perform reset before search, FALSE (0) do not
//                perform reset before search. 
// 'alarm_only' - TRUE (1) the find alarm command 0xEC is 
//                sent instead of the normal search command 0xF0
//
// Returns:   TRUE (1) : when a 1-Wire device was found and it's 
//                       Serial Number placed in the global SerialNum[portnum]
//            FALSE (0): when no new device was found.  Either the
//                       last search was the last device or there
//                       are no devices on the 1-Wire Net.
// 
unsigned char owNext(unsigned char do_reset, unsigned char alarm_only)
{
   int bit_test, search_direction, bit_number;
   int last_zero, serial_byte_number, next_result;
   unsigned char serial_byte_mask;
   unsigned char lastcrc8;

   // initialize for search 
   bit_number = 1;
   last_zero = 0;
   serial_byte_number = 0;
   serial_byte_mask = 1;
   next_result = 0;     
   lastcrc8 = 0;
   
   // if the last call was not the last one 
   if (!LastDevice)
   {
      // check if reset first is requested
      if (do_reset)
      {
         // reset the 1-wire 
         // if there are no parts on 1-wire, return FALSE
         if (!owTouchReset())
         {
            // reset the search
            LastDiscrepancy = 0;        
            LastFamilyDiscrepancy = 0; 
            return FALSE;
         }
      }

      // If finding alarming devices issue a different command
      if (alarm_only)
         owWriteByte(0xEC);  // issue the alarming search command 
      else
         owWriteByte(0xF0);  // issue the search command 

      // loop to do the search  
      do
      {
         // read a bit and its compliment 
         bit_test = owTouchBit(1) << 1;
         bit_test |= owTouchBit(1);

         // check for no devices on 1-wire
         if (bit_test == 3)
	 {
            break;
	 }
         else
         {
            // all devices coupled have 0 or 1
            if (bit_test > 0)
	    {
              search_direction = !(bit_test & 0x01);  // bit write value for search 
	    }
            else
            {
               // if this discrepancy if before the Last Discrepancy
               // on a previous next then pick the same as last time 
               if (bit_number < LastDiscrepancy) 
                  search_direction = ((SerialNum[serial_byte_number] & serial_byte_mask) > 0);
               else
                  // if equal to last pick 1, if not then pick 0              
                  search_direction = (bit_number == LastDiscrepancy);       

               // if 0 was picked then record its position in LastZero 
               if (search_direction == 0) 
                  last_zero = bit_number;  

               // check for Last discrepancy in family 
               if (last_zero < 9) 
                  LastFamilyDiscrepancy = last_zero;
            }

            // set or clear the bit in the SerialNum byte serial_byte_number 
            // with mask serial_byte_mask 
            if (search_direction == 1)
              SerialNum[serial_byte_number] |= serial_byte_mask;
            else
              SerialNum[serial_byte_number] &= ~serial_byte_mask;

            // serial number search direction write bit 
            owTouchBit(search_direction);

            // increment the byte counter bit_number 
            // and shift the mask serial_byte_mask 
            bit_number++;
            serial_byte_mask <<= 1;

            // if the mask is 0 then go to new SerialNum byte serial_byte_number
            // and reset mask 
            if (serial_byte_mask == 0)
            {
                lastcrc8 = docrc8(lastcrc8,SerialNum[serial_byte_number]);  // accumulate the CRC 
                serial_byte_number++; 
                serial_byte_mask = 1;
            }
         }
      } 
      while(serial_byte_number < 8);  // loop until through all SerialNum bytes 0-7 

      // if the search was successful then 
      if (!((bit_number < 65) || lastcrc8))  
      {
         // search successful so set LastDiscrepancy,LastDevice,next_result 
         LastDiscrepancy = last_zero;
         LastDevice = (LastDiscrepancy == 0);
         next_result = TRUE;
      }
   }
   
   // if no device found then reset counters so next 'next' will be
   // like a first 
   if (!next_result || !SerialNum[0])
   {
      LastDiscrepancy = 0;
      LastDevice = FALSE;
      LastFamilyDiscrepancy = 0; 
      next_result = FALSE;
   }

   return next_result;
}

//--------------------------------------------------------------------------
// The 'owSerialNum' function either reads or sets the SerialNum buffer 
// that is used in the search functions 'owFirst' and 'owNext'.  
// This function contains two parameters, 'serialnum_buf' is a pointer
// to a buffer provided by the caller.  'serialnum_buf' should point to 
// an array of 8 unsigned chars.  The second parameter is a flag called
// 'do_read' that is TRUE (1) if the operation is to read and FALSE
// (0) if the operation is to set the internal SerialNum buffer from 
// the data in the provided buffer.
//
// 'serialnum_buf' - buffer to that contains the serial number to set
//                   when do_read = FALSE (0) and buffer to get the serial
//                   number when do_read = TRUE (1).
// 'do_read'       - flag to indicate reading (1) or setting (0) the current
//                   serial number.
//
void owSerialNum(unsigned char *serialnum_buf, unsigned char do_read)
{
   int i;

   // read the internal buffer and place in 'serialnum_buf'
   if (do_read)
   {
      for (i = 0; i < 8; i++)
      {
         serialnum_buf[i] = SerialNum[i];
      }
   }
   // set the internal buffer from the data in 'serialnum_buf'
   else
   {
      for (i = 0; i < 8; i++)
      {
         SerialNum[i] = serialnum_buf[i];
      }
   }
}

