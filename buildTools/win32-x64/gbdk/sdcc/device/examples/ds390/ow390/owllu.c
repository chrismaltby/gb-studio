#define DEBUG_OW_LLU 0
#if DEBUG_OW_LLU
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
//  owLLU.C - Link Layer 1-Wire Net functions using the DS2480/DS2480B (U)
//            serial interface chip.
//
//  Version: 2.00
//
//  History: 1.00 -> 1.01  DS2480 version number now ignored in 
//                         owTouchReset.
//           1.02 -> 1.03  Removed caps in #includes for Linux capatibility
//                         Removed #include <windows.h> 
//                         Add #include "ownet.h" to define TRUE,FALSE
//           1.03 -> 2.00  Changed 'MLan' to 'ow'. Added support for 
//                         multiple ports.  

#include "ownet.h"
#include "ds2480.h"

// local varable flag, true if program voltage available
static int ProgramAvailable[MAX_PORTNUM];

//--------------------------------------------------------------------------
// Reset all of the devices on the 1-Wire Net and return the result.
//
// 'portnum'    - number 0 to MAX_PORTNUM-1.  This number was provided to
//                OpenCOM to indicate the port number.
//
// Returns: TRUE(1):  presense pulse(s) detected, device(s) reset
//          FALSE(0): no presense pulses detected
//
// WARNING: This routine will not function correctly on some
//          Alarm reset types of the DS1994/DS1427/DS2404 with
//          Rev 1,2, and 3 of the DS2480/DS2480B.
//
int owTouchReset(int portnum)
{
   uchar readbuffer[10],sendpacket[10];
   int sendlen=0;

#if DEBUG_OW_LLU
   printf ("owTouchReset\n");
#endif
   // make sure normal level
   owLevel(portnum,MODE_NORMAL);

   // check if correct mode 
   if (UMode[portnum] != MODSEL_COMMAND)
   {
      UMode[portnum] = MODSEL_COMMAND;
      sendpacket[sendlen++] = MODE_COMMAND;
   }

   // construct the command
   sendpacket[sendlen++] = (uchar)(CMD_COMM | FUNCTSEL_RESET | USpeed[portnum]);

   // flush the buffers
   FlushCOM(portnum);

   // send the packet 
   if (WriteCOM(portnum,sendlen,sendpacket)) 
   {
      // read back the 1 byte response 
      if (ReadCOM(portnum,1,readbuffer) == 1)
      {
         // make sure this byte looks like a reset byte
         if (((readbuffer[0] & RB_RESET_MASK) == RB_PRESENCE) ||
             ((readbuffer[0] & RB_RESET_MASK) == RB_ALARMPRESENCE)) 
         {
            // check if programming voltage available
            ProgramAvailable[portnum] = ((readbuffer[0] & 0x20) == 0x20); 
            return TRUE;
         }
         else
            return FALSE;
      }
   }

   // an error occured so re-sync with DS2480
   DS2480Detect(portnum);

   return FALSE;
}

//--------------------------------------------------------------------------
// Send 1 bit of communication to the 1-Wire Net and return the
// result 1 bit read from the 1-Wire Net.  The parameter 'sendbit'
// least significant bit is used and the least significant bit
// of the result is the return bit.
//
// 'portnum' - number 0 to MAX_PORTNUM-1.  This number was provided to
//             OpenCOM to indicate the port number.
// 'sendbit' - the least significant bit is the bit to send
//
// Returns: 0:   0 bit read from sendbit
//          1:   1 bit read from sendbit
//
int owTouchBit(int portnum, int sendbit)
{
   uchar readbuffer[10],sendpacket[10];
   int sendlen=0;

   // make sure normal level
   owLevel(portnum,MODE_NORMAL);

   // check if correct mode 
   if (UMode[portnum] != MODSEL_COMMAND)
   {
      UMode[portnum] = MODSEL_COMMAND;
      sendpacket[sendlen++] = MODE_COMMAND;
   }

   // construct the command
   sendpacket[sendlen] = (sendbit != 0) ? BITPOL_ONE : BITPOL_ZERO;
   sendpacket[sendlen++] |= CMD_COMM | FUNCTSEL_BIT | USpeed[portnum];

   // flush the buffers
   FlushCOM(portnum);

   // send the packet 
   if (WriteCOM(portnum,sendlen,sendpacket)) 
   {
      // read back the response 
      if (ReadCOM(portnum,1,readbuffer) == 1)
      {
         // interpret the response 
         if (((readbuffer[0] & 0xE0) == 0x80) &&
             ((readbuffer[0] & RB_BIT_MASK) == RB_BIT_ONE))
            return 1;
         else
            return 0;
      }
   }

   // an error occured so re-sync with DS2480
   DS2480Detect(portnum);

   return 0;
}

//--------------------------------------------------------------------------
// Send 8 bits of communication to the 1-Wire Net and verify that the
// 8 bits read from the 1-Wire Net is the same (write operation).  
// The parameter 'sendbyte' least significant 8 bits are used.
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number was provided to
//              OpenCOM to indicate the port number.
// 'sendbyte' - 8 bits to send (least significant byte)
//
// Returns:  TRUE: bytes written and echo was the same
//           FALSE: echo was not the same 
//
int owWriteByte(int portnum, int sendbyte)
{
   return (owTouchByte(portnum,sendbyte) == sendbyte) ? TRUE : FALSE;
}


//--------------------------------------------------------------------------
// Send 8 bits of read communication to the 1-Wire Net and and return the
// result 8 bits read from the 1-Wire Net.   
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number was provided to
//              OpenCOM to indicate the port number.
//
// Returns:  8 bytes read from 1-Wire Net
//
int owReadByte(int portnum)
{
   return owTouchByte(portnum,0xFF);
}

//--------------------------------------------------------------------------
// Send 8 bits of communication to the 1-Wire Net and return the
// result 8 bits read from the 1-Wire Net.  The parameter 'sendbyte'
// least significant 8 bits are used and the least significant 8 bits
// of the result is the return byte.
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number was provided to
//              OpenCOM to indicate the port number.
// 'sendbyte' - 8 bits to send (least significant byte)
//
// Returns:  8 bytes read from sendbyte
//
int owTouchByte(int portnum, int sendbyte)
{
   uchar readbuffer[10],sendpacket[10];
   int sendlen=0;

   // make sure normal level
   owLevel(portnum,MODE_NORMAL);

   // check if correct mode 
   if (UMode[portnum] != MODSEL_DATA)
   {
      UMode[portnum] = MODSEL_DATA;
      sendpacket[sendlen++] = MODE_DATA;
   }

   // add the byte to send
   sendpacket[sendlen++] = (uchar)sendbyte;

   // check for duplication of data that looks like COMMAND mode 
   if (sendbyte == MODE_COMMAND) 
      sendpacket[sendlen++] = (uchar)sendbyte;

   // flush the buffers
   FlushCOM(portnum);

   // send the packet 
   if (WriteCOM(portnum,sendlen,sendpacket)) 
   {
      // read back the 1 byte response 
      if (ReadCOM(portnum,1,readbuffer) == 1)
      {
          // return the response 
          return (int)readbuffer[0];
      }
   }

   // an error occured so re-sync with DS2480
   DS2480Detect(portnum);

   return 0;
}

//--------------------------------------------------------------------------
// Set the 1-Wire Net communucation speed.  
//
// 'portnum'   - number 0 to MAX_PORTNUM-1.  This number was provided to
//               OpenCOM to indicate the port number.
// 'new_speed' - new speed defined as
//                MODE_NORMAL     0x00
//                MODE_OVERDRIVE  0x01
//
// Returns:  current 1-Wire Net speed 
//
int owSpeed(int portnum, int new_speed)
{
   uchar sendpacket[5];
   short sendlen=0;
   int rt = FALSE;
   
#if DEBUG_OW_LLU
   printf ("starting owSpeed: %d\n", new_speed);
#endif
   // check if change from current mode
   if (((new_speed == MODE_OVERDRIVE) &&
        (USpeed[portnum] != SPEEDSEL_OD)) ||
       ((new_speed == MODE_NORMAL) &&
        (USpeed[portnum] != SPEEDSEL_FLEX)))
   {
      if (new_speed == MODE_OVERDRIVE) 
      {
         // if overdrive then switch to 115200 baud
         if (DS2480ChangeBaud(portnum,PARMSET_115200) == PARMSET_115200)
         {
            USpeed[portnum] = SPEEDSEL_OD;
            rt = TRUE;
         }
      }
      else if (new_speed == MODE_NORMAL) 
      {
         // else normal so set to 9600 baud
         if (DS2480ChangeBaud(portnum,PARMSET_9600) == PARMSET_9600)
         {
            USpeed[portnum] = SPEEDSEL_FLEX;
            rt = TRUE;
         }
      }

      // if baud rate is set correctly then change DS2480 speed
      if (rt)
      {
         // check if correct mode 
         if (UMode[portnum] != MODSEL_COMMAND)
         {
            UMode[portnum] = MODSEL_COMMAND;
            sendpacket[sendlen++] = MODE_COMMAND;
         }

         // proceed to set the DS2480 communication speed
         sendpacket[sendlen++] = CMD_COMM | FUNCTSEL_SEARCHOFF | USpeed[portnum];

         // send the packet 
         if (!WriteCOM(portnum,sendlen,sendpacket)) 
         {
            rt = FALSE;
            // lost communication with DS2480 then reset 
            DS2480Detect(portnum);
         }
      }
   }
#if DEBUG_OW_LLU
   printf ("owSpeed: %d\n", rt);
#endif
   // return the current speed
   return (USpeed[portnum] == SPEEDSEL_OD) ? MODE_OVERDRIVE : MODE_NORMAL;
}

//--------------------------------------------------------------------------
// Set the 1-Wire Net line level.  The values for new_level are
// as follows:
//
// 'portnum'   - number 0 to MAX_PORTNUM-1.  This number was provided to
//               OpenCOM to indicate the port number.
// 'new_level' - new level defined as
//                MODE_NORMAL     0x00
//                MODE_STRONG5    0x02
//                MODE_PROGRAM    0x04
//                MODE_BREAK      0x08 (not supported)
//
// Returns:  current 1-Wire Net level  
//
int owLevel(int portnum, int new_level)
{
   uchar sendpacket[10],readbuffer[10];
   short sendlen=0;
   short rt=FALSE;

#if DEBUG_OW_LLU
   printf ("owLevel: %d\n", new_level);
#endif
   // check if need to change level
   if (new_level != ULevel[portnum])
   {
      // check if just putting back to normal
      if (new_level == MODE_NORMAL)
      {
         // check if correct mode 
         if (UMode[portnum] != MODSEL_COMMAND)
         {
            UMode[portnum] = MODSEL_COMMAND;
            sendpacket[sendlen++] = MODE_COMMAND;
         }

         // stop pulse command
         sendpacket[sendlen++] = MODE_STOP_PULSE;
   
         // flush the buffers
         FlushCOM(portnum);

         // send the packet 
         if (WriteCOM(portnum,sendlen,sendpacket)) 
         {
            // read back the 1 byte response 
            if (ReadCOM(portnum,1,readbuffer) == 1)
            {
               // check response byte
               if ((readbuffer[0] & 0xE0) == 0xE0)
               {
                  rt = TRUE;
                  ULevel[portnum] = MODE_NORMAL;
               }
            }
         }
      }
      // set new level
      else
      {
         // check if correct mode 
         if (UMode[portnum] != MODSEL_COMMAND)
         {
            UMode[portnum] = MODSEL_COMMAND;
            sendpacket[sendlen++] = MODE_COMMAND;
         }

         // strong 5 volts
         if (new_level == MODE_STRONG5)
         {
            // set the SPUD time value 
            sendpacket[sendlen++] = CMD_CONFIG | PARMSEL_5VPULSE | PARMSET_infinite;
            // add the command to begin the pulse
            sendpacket[sendlen++] = CMD_COMM | FUNCTSEL_CHMOD | SPEEDSEL_PULSE | BITPOL_5V;
         }
         // 12 volts
         else if (new_level == MODE_PROGRAM)
         {
            // check if programming voltage available
            if (!ProgramAvailable[portnum])
               return MODE_NORMAL;

            // set the PPD time value 
            sendpacket[sendlen++] = CMD_CONFIG | PARMSEL_12VPULSE | PARMSET_infinite;
            // add the command to begin the pulse
            sendpacket[sendlen++] = CMD_COMM | FUNCTSEL_CHMOD | SPEEDSEL_PULSE | BITPOL_12V;
         }

         // flush the buffers
         FlushCOM(portnum);

         // send the packet 
         if (WriteCOM(portnum,sendlen,sendpacket)) 
         {
            // read back the 1 byte response from setting time limit
            if (ReadCOM(portnum,1,readbuffer) == 1)
            {
               // check response byte
               if ((readbuffer[0] & 0x81) == 0)
               {
                  ULevel[portnum] = new_level;
                  rt = TRUE;
               }
            }
         }
      }

      // if lost communication with DS2480 then reset 
      if (rt != TRUE)
         DS2480Detect(portnum);
   }

   // return the current level
   return ULevel[portnum];      
}

//--------------------------------------------------------------------------
// This procedure creates a fixed 480 microseconds 12 volt pulse 
// on the 1-Wire Net for programming EPROM iButtons.
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number was provided to
//              OpenCOM to indicate the port number.
//
// Returns:  TRUE  successful
//           FALSE program voltage not available  
//
int owProgramPulse(int portnum)
{
   uchar sendpacket[10],readbuffer[10];
   short sendlen=0;

   // check if programming voltage available
   if (!ProgramAvailable[portnum])
      return FALSE;

   // make sure normal level
   owLevel(portnum,MODE_NORMAL);

   // check if correct mode 
   if (UMode[portnum] != MODSEL_COMMAND)
   {
      UMode[portnum] = MODSEL_COMMAND;
      sendpacket[sendlen++] = MODE_COMMAND;
   }

   // set the SPUD time value 
   sendpacket[sendlen++] = CMD_CONFIG | PARMSEL_12VPULSE | PARMSET_512us;

   // pulse command
   sendpacket[sendlen++] = CMD_COMM | FUNCTSEL_CHMOD | BITPOL_12V | SPEEDSEL_PULSE;
   
   // flush the buffers
   FlushCOM(portnum);

   // send the packet 
   if (WriteCOM(portnum,sendlen,sendpacket)) 
   {
      // read back the 2 byte response 
      if (ReadCOM(portnum,2,readbuffer) == 2)
      {
         // check response byte
         if (((readbuffer[0] | CMD_CONFIG) == 
                (CMD_CONFIG | PARMSEL_12VPULSE | PARMSET_512us)) &&
             ((readbuffer[1] & 0xFC) == 
                (0xFC & (CMD_COMM | FUNCTSEL_CHMOD | BITPOL_12V | SPEEDSEL_PULSE))))
            return TRUE;
      }
   }

   // an error occured so re-sync with DS2480
   DS2480Detect(portnum);

   return FALSE;
}
