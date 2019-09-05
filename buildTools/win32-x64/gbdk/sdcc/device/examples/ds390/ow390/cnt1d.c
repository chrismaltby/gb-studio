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
//  cnt1D.c - Module to read the DS2423 - counter.
//
//  Version: 2.00
//
//
#include "ownet.h"
#include "cnt1d.h"

//----------------------------------------------------------------------
// Read the counter on a specified page of a DS2423.
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number is provided to
//              indicate the symbolic port number.
// 'SerialNum'   - Serial Number of DS2423 that contains the counter 
//                 to be read
// 'CounterPage' - page number that the counter is associated with
// 'Count'       - pointer to variable where that count will be returned
//
// Returns: TRUE(1)  counter has been read and verified
//          FALSE(0) could not read the counter, perhaps device is not
//                   in contact
//
int ReadCounter(int portnum, uchar SerialNum[8], int CounterPage, 
                unsigned long *Count)
{
   int rt=FALSE;
   uchar send_block[30];
   int send_cnt=0, address, i;
   ushort lastcrc16;

   setcrc16(portnum,0);

   // set the device serial number to the counter device
   owSerialNum(portnum,SerialNum,FALSE);
   
   // access the device 
   if (owAccess(portnum))
   {
      // create a block to send that reads the counter
      // read memory and counter command
      send_block[send_cnt++] = 0xA5;
      docrc16(portnum,0xA5);
      // address of last data byte before counter
      address = (CounterPage << 5) + 31;  // (1.02)
      send_block[send_cnt++] = (uchar)(address & 0xFF);
      docrc16(portnum,(ushort)(address & 0xFF));
      send_block[send_cnt++] = (uchar)(address >> 8);
      docrc16(portnum,(ushort)(address >> 8));
      // now add the read bytes for data byte,counter,zero bits, crc16
      for (i = 0; i < 11; i++)
         send_block[send_cnt++] = 0xFF;

      // now send the block
      if (owBlock(portnum,FALSE,send_block,send_cnt))
      {
         // perform the CRC16 on the last 11 bytes of packet
         for (i = send_cnt - 11; i < send_cnt; i++)
            lastcrc16 = docrc16(portnum,send_block[i]);

         // verify CRC16 is correct
         if (lastcrc16 == 0xB001)
         {
            // success
            rt = TRUE;
            // extract the counter value
            *Count = 0;
            for (i = send_cnt - 7; i >= send_cnt - 10; i--)
            {
               *Count <<= 8;
               *Count |= send_block[i];
            }  
         }
      }
   }
   
   // return the result flag rt
   return rt;
} 
