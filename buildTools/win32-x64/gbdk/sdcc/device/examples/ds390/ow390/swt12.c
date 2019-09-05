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
//--------------------------------------------------------------------------
//
//  swt12.c - Modifies Channel A and B and returns info byte data for
//            the DS2406 and DS2407.
//  version 2.00


// Include files
#include <stdio.h>
#include "ownet.h"
#include "swt12.h"

//----------------------------------------------------------------------
//  SUBROUTINE - ReadSwitch12
//
//	This routine gets the Channel Info Byte and returns it.
//
// 'portnum'       - number 0 to MAX_PORTNUM-1.  This number was provided to
//                   OpenCOM to indicate the port number.
//	'ClearActivity' - To reset the button
//
//	Returns: (-1) If the Channel Info Byte could not be read.
//			 (Info Byte) If the Channel Info Byte could be read.
//                                                           
int ReadSwitch12(int portnum, int ClearActivity)
{
   int rt=-1;			   //this is the return value depending if the byte was read
   int trans_cnt=0;		//this is the counter for the number of bytes to send
   uchar transfer[30];	//this is the whole block of byte info
   
   // access and verify it is there
   if (owAccess(portnum)) 
   {
      // reset CRC 
      setcrc16(portnum,0);
   
      // channel access command 
	   transfer[trans_cnt++] = 0xF5;
      docrc16(portnum,0xF5);
   
      // control bytes                
      if (ClearActivity)
      {
		   transfer[trans_cnt++] = 0xD5;
         docrc16(portnum,0xD5); 
      }
      else
      {
		   transfer[trans_cnt++] = 0x55;
         docrc16(portnum,0x55);                      
      }

	   transfer[trans_cnt++] = 0xFF;
      docrc16(portnum,0xFF);
   
      // read the info byte
	   transfer[trans_cnt++] = 0xFF;

	   // dummy data
	   transfer[trans_cnt++] = 0xFF;
	   transfer[trans_cnt++] = 0xFF;
	   transfer[trans_cnt++] = 0xFF;
 
      if (owBlock(portnum,FALSE,transfer,trans_cnt))
      {
		   rt = transfer[3];
		   // read a dummy read byte and CRC16
		   docrc16(portnum,transfer[trans_cnt-4]);
		   docrc16(portnum,transfer[trans_cnt-3]);
		   docrc16(portnum,transfer[trans_cnt-2]);
		   if(docrc16(portnum,transfer[trans_cnt-1]) != 0xB001)
            rt = -1;
      }
   }
   else
      rt = -1;

   return rt;
}

//----------------------------------------------------------------------
//	SUBROUTINE - SetSwitch12
//
//  This routine sets the channel state of the specified DS2406
//
// 'portnum'     - number 0 to MAX_PORTNUM-1.  This number was provided to
//                 OpenCOM to indicate the port number.
// 'SerialNum'   - Serial Number of DS2406 to set the switch state
// 'State'       - Is a type containing what to set A and/or B to.  It 
//				   also contains the other fields that maybe written later 
//
//  Returns: TRUE(1)  State of DS2406 set and verified  
//           FALSE(0) could not set the DS2406, perhaps device is not
//                    in contact
//
int SetSwitch12(int portnum, uchar *SerialNum, SwitchProps *State)
{
   ushort st;  
   int rt=FALSE;
   uchar send_block[30];
   int send_cnt=0;

   setcrc16(portnum,0);

   // set the device serial number to the counter device
   owSerialNum(portnum,SerialNum,FALSE);

   // access the device 
   if (owAccess(portnum))
   {
      // create a block to send that reads the counter
      // write status command
      send_block[send_cnt++] = 0x55;
      docrc16(portnum,0x55);
      
      // address of switch state
      send_block[send_cnt++] = 0x07;
      docrc16(portnum,0x07);
      send_block[send_cnt++] = 0x00;
      docrc16(portnum,0x00);
      
      // write state
	   st = 0x1F;                     
	   if(!State->Chan_B) st |= 0x40;  
	   if(!State->Chan_A) st |= 0x20;  
	   // more ifs can be added here for the other fields.
	   
      send_block[send_cnt++] = (uchar)st;        
	   docrc16(portnum,st);                                 
      
      // read CRC16
      send_block[send_cnt++] = 0xFF;
      send_block[send_cnt++] = 0xFF;

      // now send the block
      if (owBlock(portnum,FALSE,send_block,send_cnt))
      {
         // perform the CRC16 on the last 2 bytes of packet
         docrc16(portnum,send_block[send_cnt-2]);

         // verify crc16 is correct
         if(docrc16(portnum,send_block[send_cnt-1]) == 0xB001)
            rt = TRUE;
      }
   }
   
   // return the result flag rt
   return rt;
}


//----------------------------------------------------------------------
//	SUBROUTINE - SwitchStateToString12
//
//  This routine uses the info byte to return a string with all the data.
//
// 'infobyte'   - This is the information byte data from the hardware.
// 'outstr'     - This will be the output string.  It gets set in the 
//				      the procedure.
//
int SwitchStateToString12(int infobyte, char *outstr)
{

   int cnt = 0;

   if(infobyte & 0x40)
   {
		cnt += sprintf(outstr+cnt, "%s", "Channel A and B\n");

	   if(infobyte & 0x80)
		   cnt += sprintf(outstr+cnt, "%s", "Supply\n");
	   else
		   cnt += sprintf(outstr+cnt, "%s", "No Supply\n");
			    
	   if(infobyte & 0x20)
		   cnt += sprintf(outstr+cnt, "%s", "Activity on PIO-B\n");
	   else
		   cnt += sprintf(outstr+cnt, "%s", "No activity on PIO-B\n");

	   if(infobyte & 0x10)
		   cnt += sprintf(outstr+cnt, "%s", "Activity on PIO-A\n");
	   else
		   cnt += sprintf(outstr+cnt, "%s", "No activity on PIO-A\n");

	   if(infobyte & 0x08)
		   cnt += sprintf(outstr+cnt, "%s", "Hi level on PIO B\n");
	   else
		   cnt += sprintf(outstr+cnt, "%s", "Lo level on PIO B\n");

	   if(infobyte & 0x04)
		   cnt += sprintf(outstr+cnt, "%s", "Hi level on PIO A\n");
	   else
		   cnt += sprintf(outstr+cnt, "%s", "Lo level on PIO A\n");

	   if(infobyte & 0x02)
		   cnt += sprintf(outstr+cnt, "%s", "Channel B off\n");
	   else
		   cnt += sprintf(outstr+cnt, "%s", "Channel B on\n");

	   if(infobyte & 0x01)
		   cnt += sprintf(outstr+cnt, "%s", "Channel A off\n");
	   else
	  	   cnt += sprintf(outstr+cnt, "%s", "Channel A on\n");
   }
	else
   {
		cnt += sprintf(outstr+cnt, "%s", "Channel A\n");

	   if(infobyte & 0x80)
		   cnt += sprintf(outstr+cnt, "%s", "Supply\n");
	   else
		   cnt += sprintf(outstr+cnt, "%s", "No Supply\n");

	   if(infobyte & 0x10)
		   cnt += sprintf(outstr+cnt, "%s", "Activity on PIO-A\n");
	   else
		   cnt += sprintf(outstr+cnt, "%s", "No activity on PIO-A\n");

	   if(infobyte & 0x04)
		   cnt += sprintf(outstr+cnt, "%s", "Hi level on PIO A\n");
	   else
		   cnt += sprintf(outstr+cnt, "%s", "Lo level on PIO A\n");

	   if(infobyte & 0x01)
		   cnt += sprintf(outstr+cnt, "%s", "Channel A off\n");
	   else
	  	   cnt += sprintf(outstr+cnt, "%s", "Channel A on\n");

   }

   return cnt;
}

   
