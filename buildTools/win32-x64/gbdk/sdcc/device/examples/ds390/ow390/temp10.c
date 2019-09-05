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
// ---------------------------------------------------------------------------
//
//  temp10.C - Module to read the DS1920/DS1820 - temperature measurement.
//  
//  Version: 2.00
//             
// ---------------------------------------------------------------------------
// 
//
#include "ownet.h"
#include "temp10.h"

//----------------------------------------------------------------------
// Read the temperature of a DS1920/DS1820
//
// 'portnum'     - number 0 to MAX_PORTNUM-1.  This number was provided to
//                 OpenCOM to indicate the port number.
// 'SerialNum'   - Serial Number of DS1920/DS1820 to read temperature from
// 'Temp '       - pointer to variable where that temperature will be 
//                 returned
//
// Returns: TRUE(1)  temperature has been read and verified
//          FALSE(0) could not read the temperature, perhaps device is not
//                   in contact
//
int ReadTemperature(int portnum, uchar *SerialNum, float *Temp)
{
   int rt=FALSE;
   uchar send_block[30],lastcrc8;
   int send_cnt=0, tsht, i, loop=0;
   float tmp,cr,cpc;
   
   
   setcrc8(portnum,0);

   // set the device serial number to the counter device
   owSerialNum(portnum,SerialNum,FALSE);

   for (loop = 0; rt==FALSE && loop < 2; loop ++)
   {
      // access the device 
      if (owAccess(portnum))
      {
         // send the convert temperature command
         owTouchByte(portnum,0x44);

         // set the 1-Wire Net to strong pull-up
         if (owLevel(portnum,MODE_STRONG5) != MODE_STRONG5)
            return FALSE;
 
         // sleep for 1 second
         msDelay(1000);

         // turn off the 1-Wire Net strong pull-up
         if (owLevel(portnum,MODE_NORMAL) != MODE_NORMAL)
            return FALSE;

         // access the device 
         if (owAccess(portnum))
         {
            // create a block to send that reads the temperature
            // read scratchpad command
            send_block[send_cnt++] = 0xBE;
            // now add the read bytes for data bytes and crc8
            for (i = 0; i < 9; i++)
               send_block[send_cnt++] = 0xFF;

            // now send the block
            if (owBlock(portnum,FALSE,send_block,send_cnt))
            {
               // perform the CRC8 on the last 8 bytes of packet
               for (i = send_cnt - 9; i < send_cnt; i++)
                  lastcrc8 = docrc8(portnum,send_block[i]);

               // verify CRC8 is correct
               if (lastcrc8 == 0x00)
               {
                  // calculate the high-res temperature
                  tsht = send_block[1]/2;
                  if (send_block[2] & 0x01)
                     tsht |= -128;
                  tmp = (float)(tsht);
                  cr = send_block[7];
                  cpc = send_block[8];
                  if (((cpc - cr) == 1) && (loop == 0))
                     continue;
                  if (cpc == 0)
                     return FALSE;   
                  else
                     tmp = tmp - (float)0.25 + (cpc - cr)/cpc;
   
                  *Temp = tmp;
                  // success
                  rt = TRUE;
               }
            }
         }
      }
        
   }
   
 // return the result flag rt
      return rt;
      
}
