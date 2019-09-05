#define DEBUG_OW_NETU 0
#if DEBUG_OW_NETU
#include <stdio.h>
#endif
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
//  owNetU.C - Network functions for 1-Wire Net devices
//             using the DS2480/DS2480B (U) serial interface chip. 
//
//  Version: 2.00
//
//           1.02 -> 1.03  Removed caps in #includes for Linux capatibility
//           1.03 -> 2.00  Changed 'MLan' to 'ow'. Added support for 
//                         multiple ports.
//

#include "ownet.h"
#include "ds2480.h"

// globally used 
uchar SerialNum[MAX_PORTNUM][8];

// local variables for this module to hold search state information
static int LastDiscrepancy[MAX_PORTNUM];
static int LastFamilyDiscrepancy[MAX_PORTNUM];
static int LastDevice[MAX_PORTNUM];

//--------------------------------------------------------------------------
// The 'owFirst' finds the first device on the 1-Wire Net  This function 
// contains one parameter 'alarm_only'.  When 
// 'alarm_only' is TRUE (1) the find alarm command 0xEC is 
// sent instead of the normal search command 0xF0.
// Using the find alarm command 0xEC will limit the search to only
// 1-Wire devices that are in an 'alarm' state. 
//
// 'portnum'    - number 0 to MAX_PORTNUM-1.  This number is provided to
//                indicate the symbolic port number.
// 'do_reset'   - TRUE (1) perform reset before search, FALSE (0) do not
//                perform reset before search. 
// 'alarm_only' - TRUE (1) the find alarm command 0xEC is 
//                sent instead of the normal search command 0xF0
//
// Returns:   TRUE (1) : when a 1-Wire device was found and it's 
//                       Serial Number placed in the global SerialNum
//            FALSE (0): There are no devices on the 1-Wire Net.
// 
int owFirst(int portnum, int do_reset, int alarm_only)
{
   // reset the search state
   LastDiscrepancy[portnum] = 0;
   LastDevice[portnum] = FALSE;
   LastFamilyDiscrepancy[portnum] = 0; 

   return owNext(portnum, do_reset, alarm_only);
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
// 'portnum'    - number 0 to MAX_PORTNUM-1.  This number was provided to
//                OpenCOM to indicate the port number.
// 'do_reset'   - TRUE (1) perform reset before search, FALSE (0) do not
//                perform reset before search. 
// 'alarm_only' - TRUE (1) the find alarm command 0xEC is 
//                sent instead of the normal search command 0xF0
//
// Returns:   TRUE (1) : when a 1-Wire device was found and it's 
//                       Serial Number placed in the global SerialNum
//            FALSE (0): when no new device was found.  Either the
//                       last search was the last device or there
//                       are no devices on the 1-Wire Net.
// 
int owNext(int portnum, int do_reset, int alarm_only)
{
   int i,tmp_last_desc,pos;
   uchar tmp_serial_num[8];
   uchar readbuffer[20],sendpacket[40];
   int sendlen=0;
   uchar lastcrc8;

   // if the last call was the last one 
   if (LastDevice[portnum])
   {
      // reset the search
      LastDiscrepancy[portnum] = 0;
      LastDevice[portnum] = FALSE;
      LastFamilyDiscrepancy[portnum] = 0;  
#if DEBUG_OW_NETU
      printf ("owNext: no (more) devices\n");
#endif
      return FALSE;
   }

   // check if reset first is requested
   if (do_reset)
   {
      // reset the 1-wire 
      // if there are no parts on 1-wire, return FALSE
      if (!owTouchReset(portnum))
      {
         // reset the search
         LastDiscrepancy[portnum] = 0;        
         LastFamilyDiscrepancy[portnum] = 0; 
         return FALSE;
      }
   }

   // build the command stream
   // call a function that may add the change mode command to the buff
   // check if correct mode 
   if (UMode[portnum] != MODSEL_DATA)
   {
      UMode[portnum] = MODSEL_DATA;
      sendpacket[sendlen++] = MODE_DATA;
   }

   // search command
   if (alarm_only)
      sendpacket[sendlen++] = 0xEC; // issue the alarming search command 
   else
      sendpacket[sendlen++] = 0xF0; // issue the search command 

   // change back to command mode
   UMode[portnum] = MODSEL_COMMAND;
   sendpacket[sendlen++] = MODE_COMMAND;

   // search mode on
   sendpacket[sendlen++] = (uchar)(CMD_COMM | FUNCTSEL_SEARCHON | USpeed[portnum]);

   // change back to data mode
   UMode[portnum] = MODSEL_DATA;
   sendpacket[sendlen++] = MODE_DATA;

   // set the temp Last Descrep to none
   tmp_last_desc = 0xFF;  

   // add the 16 bytes of the search
   pos = sendlen;
   for (i = 0; i < 16; i++)
      sendpacket[sendlen++] = 0;

   // only modify bits if not the first search
   if (LastDiscrepancy[portnum] != 0xFF)
   {
      // set the bits in the added buffer
      for (i = 0; i < 64; i++)
      {
         // before last discrepancy
         if (i < (LastDiscrepancy[portnum] - 1)) 
               bitacc(WRITE_FUNCTION,
                   bitacc(READ_FUNCTION,0,i,&SerialNum[portnum][0]), 
                   (short)(i * 2 + 1), 
                   &sendpacket[pos]);
         // at last discrepancy
         else if (i == (LastDiscrepancy[portnum] - 1)) 
                bitacc(WRITE_FUNCTION,1, 
                   (short)(i * 2 + 1), 
                   &sendpacket[pos]);
         // after last discrepancy so leave zeros
      }
   }

   // change back to command mode
   UMode[portnum] = MODSEL_COMMAND;
   sendpacket[sendlen++] = MODE_COMMAND;

   // search OFF
   sendpacket[sendlen++] = (uchar)(CMD_COMM | FUNCTSEL_SEARCHOFF | USpeed[portnum]);

   // flush the buffers
   FlushCOM(portnum);

   // send the packet 
   if (WriteCOM(portnum,sendlen,sendpacket)) 
   {
      // read back the 1 byte response 
      if (ReadCOM(portnum,17,readbuffer) == 17)
      {
         // interpret the bit stream
         for (i = 0; i < 64; i++)
         {
            // get the SerialNum bit
            bitacc(WRITE_FUNCTION,
                   bitacc(READ_FUNCTION,0,(short)(i * 2 + 1),&readbuffer[1]),
                   i,
                   &tmp_serial_num[0]);
            // check LastDiscrepancy
            if ((bitacc(READ_FUNCTION,0,(short)(i * 2),&readbuffer[1]) == 1) &&
                (bitacc(READ_FUNCTION,0,(short)(i * 2 + 1),&readbuffer[1]) == 0))
            {
               tmp_last_desc = i + 1;  
               // check LastFamilyDiscrepancy
               if (i < 8)
                  LastFamilyDiscrepancy[portnum] = i + 1; 
            }
         }

         // do dowcrc
         setcrc8(portnum,0);
         for (i = 0; i < 8; i++)
            lastcrc8 = docrc8(portnum,tmp_serial_num[i]);

         // check results 
         if ((lastcrc8 != 0) || (LastDiscrepancy[portnum] == 63) || (tmp_serial_num[0] == 0))
         {
            // error during search 
            // reset the search
            LastDiscrepancy[portnum] = 0;
            LastDevice[portnum] = FALSE;
            LastFamilyDiscrepancy[portnum] = 0;        
#if DEBUG_OW_NETU
	    printf ("owNext: check results failed\n");
#endif
            return FALSE;
         }
         // successful search
         else
         {
            // check for lastone
            if ((tmp_last_desc == LastDiscrepancy[portnum]) || (tmp_last_desc == 0xFF))
               LastDevice[portnum] = TRUE;

            // copy the SerialNum to the buffer
            for (i = 0; i < 8; i++)
               SerialNum[portnum][i] = tmp_serial_num[i];
         
            // set the count
            LastDiscrepancy[portnum] = tmp_last_desc;
            return TRUE;
         }
      } else {
#if DEBUG_OW_NETU
	printf ("owNext: ReadCOM failed\n");
#endif
      }
   } else {
#if DEBUG_OW_NETU
     printf ("owNext: WriteCOM failed\n");
#endif
   }

   // an error occured so re-sync with DS2480
   DS2480Detect(portnum);

   // reset the search
   LastDiscrepancy[portnum] = 0;
   LastDevice[portnum] = FALSE;
   LastFamilyDiscrepancy[portnum] = 0;          

   return FALSE;
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
// 'portnum'       - number 0 to MAX_PORTNUM-1.  This number was provided to
//                   OpenCOM to indicate the port number.
// 'serialnum_buf' - buffer to that contains the serial number to set
//                   when do_read = FALSE (0) and buffer to get the serial
//                   number when do_read = TRUE (1).
// 'do_read'       - flag to indicate reading (1) or setting (0) the current
//                   serial number.
//
void owSerialNum(int portnum, uchar *serialnum_buf, int do_read)
{
   int i;

   // read the internal buffer and place in 'serialnum_buf'
   if (do_read)
   {
      for (i = 0; i < 8; i++)
         serialnum_buf[i] = SerialNum[portnum][i];
   }
   // set the internal buffer from the data in 'serialnum_buf'
   else
   {
      for (i = 0; i < 8; i++)
         SerialNum[portnum][i] = serialnum_buf[i];
   }
}

//--------------------------------------------------------------------------
// Setup the search algorithm to find a certain family of devices
// the next time a search function is called 'owNext'.
//
// 'portnum'       - number 0 to MAX_PORTNUM-1.  This number was provided to
//                   OpenCOM to indicate the port number.
// 'search_family' - family code type to set the search algorithm to find
//                   next.
// 
void owFamilySearchSetup(int portnum, int search_family)
{
   int i;

   // set the search state to find search_family type devices
   SerialNum[portnum][0] = (uchar)search_family;                 
   for (i = 1; i < 8; i++)
      SerialNum[portnum][i] = 0; 
   LastDiscrepancy[portnum] = 64;     
   LastDevice[portnum] = FALSE;          
}

//--------------------------------------------------------------------------
// Set the current search state to skip the current family code.
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number was provided to
//               OpenCOM to indicate the port number.
//
void owSkipFamily(int portnum)
{
   // set the Last discrepancy to last family discrepancy
   LastDiscrepancy[portnum] = LastFamilyDiscrepancy[portnum];

   // check for end of list
   if (LastDiscrepancy[portnum] == 0) 
      LastDevice[portnum] = TRUE;
}

//--------------------------------------------------------------------------
// The 'owAccess' function resets the 1-Wire and sends a MATCH Serial 
// Number command followed by the current SerialNum code. After this 
// function is complete the 1-Wire device is ready to accept device-specific
// commands. 
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number was provided to
//              OpenCOM to indicate the port number.
//
// Returns:   TRUE (1) : reset indicates present and device is ready
//                       for commands.
//            FALSE (0): reset does not indicate presence or echos 'writes'
//                       are not correct.
//
int owAccess(int portnum)
{
   uchar sendpacket[9];
   int i;

   // reset the 1-wire 
   if (owTouchReset(portnum))
   {
      // create a buffer to use with block function      
      // match Serial Number command 0x55 
      sendpacket[0] = 0x55; 
      // Serial Number
      for (i = 1; i < 9; i++)
         sendpacket[i] = SerialNum[portnum][i-1];
      
      // send/recieve the transfer buffer   
      if (owBlock(portnum,FALSE,sendpacket,9))
      {
         // verify that the echo of the writes was correct
         for (i = 1; i < 9; i++)
            if (sendpacket[i] != SerialNum[portnum][i-1])
               return FALSE;
         if (sendpacket[0] != 0x55)
            return FALSE;
         else
            return TRUE;
      }
   }

   // reset or match echo failed
   return FALSE;
}

//----------------------------------------------------------------------
// The function 'owVerify' verifies that the current device
// is in contact with the 1-Wire Net.    
// Using the find alarm command 0xEC will verify that the device
// is in contact with the 1-Wire Net and is in an 'alarm' state. 
// 
// 'portnum'    - number 0 to MAX_PORTNUM-1.  This number was provided to
//                OpenCOM to indicate the port number.
// 'alarm_only' - TRUE (1) the find alarm command 0xEC 
//                         is sent instead of the normal search 
//                         command 0xF0. 
//
// Returns:   TRUE (1) : when the 1-Wire device was verified
//                       to be on the 1-Wire Net 
//                       with alarm_only == FALSE 
//                       or verified to be on the 1-Wire Net
//                       AND in an alarm state when 
//                       alarm_only == TRUE. 
//            FALSE (0): the 1-Wire device was not on the 
//                       1-Wire Net or if alarm_only
//                       == TRUE, the device may be on the 
//                       1-Wire Net but in a non-alarm state.
// 
int owVerify(int portnum, int alarm_only)
{
   int i,sendlen=0,goodbits=0,cnt=0,s,tst;
   uchar sendpacket[50];
   
   // construct the search rom 
   if (alarm_only)
      sendpacket[sendlen++] = 0xEC; // issue the alarming search command 
   else
      sendpacket[sendlen++] = 0xF0; // issue the search command 
   // set all bits at first
   for (i = 1; i <= 24; i++)
      sendpacket[sendlen++] = 0xFF;   
   // now set or clear apropriate bits for search 
   for (i = 0; i < 64; i++)
      bitacc(WRITE_FUNCTION,bitacc(READ_FUNCTION,0,i,&SerialNum[portnum][0]),(int)((i+1)*3-1),&sendpacket[1]);

   // send/recieve the transfer buffer   
   if (owBlock(portnum,TRUE,sendpacket,sendlen))
   {
      // check results to see if it was a success 
      for (i = 0; i < 192; i += 3)
      {
         tst = (bitacc(READ_FUNCTION,0,i,&sendpacket[1]) << 1) |
                bitacc(READ_FUNCTION,0,(int)(i+1),&sendpacket[1]);

         s = bitacc(READ_FUNCTION,0,cnt++,&SerialNum[portnum][0]);

         if (tst == 0x03)  // no device on line 
         {
              goodbits = 0;    // number of good bits set to zero 
              break;     // quit 
         }

         if (((s == 0x01) && (tst == 0x02)) ||
             ((s == 0x00) && (tst == 0x01))    )  // correct bit 
            goodbits++;  // count as a good bit 
      }

      // check too see if there were enough good bits to be successful 
      if (goodbits >= 8) 
         return TRUE;
   }

   // block fail or device not present
   return FALSE;
}

//----------------------------------------------------------------------
// Perform a overdrive MATCH command to select the 1-Wire device with 
// the address in the ID data register.
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number was provided to
//               OpenCOM to indicate the port number.
//
// Returns:  TRUE: If the device is present on the 1-Wire Net and
//                 can do overdrive then the device is selected.
//           FALSE: Device is not present or not capable of overdrive.
//
//  *Note: This function could be converted to send DS2480
//         commands in one packet.  
//
int owOverdriveAccess(int portnum)
{
   uchar sendpacket[8];
   int i, bad_echo = FALSE;

#if DEBUG_OW_NETU
   printf ("owOverdriveAccess\n");
#endif
   // make sure normal level
   owLevel(portnum,MODE_NORMAL);

   // force to normal communication speed
   owSpeed(portnum,MODE_NORMAL);

   // call the 1-Wire Net reset function 
   if (owTouchReset(portnum))
   {
      // send the match command 0x69
      if (owWriteByte(portnum,0x69))
      {
         // switch to overdrive communication speed
         owSpeed(portnum,MODE_OVERDRIVE);

         // create a buffer to use with block function      
         // Serial Number
         for (i = 0; i < 8; i++)
            sendpacket[i] = SerialNum[portnum][i];
      
         // send/recieve the transfer buffer   
         if (owBlock(portnum,FALSE,sendpacket,8))
         {
            // verify that the echo of the writes was correct
            for (i = 0; i < 8; i++)
               if (sendpacket[i] != SerialNum[portnum][i])
                  bad_echo = TRUE;
            // if echo ok then success
            if (!bad_echo) {
#if DEBUG_OW_NETU
	      printf ("owOverdriveAccess success\n");
#endif
               return TRUE;               
	    }
         }
      }
   }
   
   // failure, force back to normal communication speed
   owSpeed(portnum,MODE_NORMAL);

   return FALSE;
}

//--------------------------------------------------------------------------
// Bit utility to read and write a bit in the buffer 'buf'.
//
// 'op'    - operation (1) to set and (0) to read
// 'state' - set (1) or clear (0) if operation is write (1)
// 'loc'   - bit number location to read or write
// 'buf'   - pointer to array of bytes that contains the bit
//           to read or write
//
// Returns: 1   if operation is set (1)
//          0/1 state of bit number 'loc' if operation is reading 
//
int bitacc(int op, int state, int loc, uchar *buf)
{
   int nbyt,nbit;

   nbyt = (loc / 8);
   nbit = loc - (nbyt * 8);

   if (op == WRITE_FUNCTION)
   {
      if (state)
         buf[nbyt] |= (0x01 << nbit);
      else
         buf[nbyt] &= ~(0x01 << nbit);

      return 1;
   }
   else
      return ((buf[nbyt] >> nbit) & 0x01);
}
