#define DEBUG_OW_TRNU 0
#if DEBUG_OW_TRNU
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
//  owTranU.C - Transport functions for 1-Wire Net
//              using the DS2480 (U) serial interface chip.
//
//  Version: 2.00
//
//  History: 1.02 -> 1.03  Removed caps in #includes for Linux capatibility
//           1.03 -> 2.00  Changed 'MLan' to 'ow'. Added support for 
//                         multiple ports.  
//

#include "ownet.h"
#include "ds2480.h"

// local functions       
static int Write_Scratchpad(int,uchar *,int,int);
static int Copy_Scratchpad(int,int,int);

//--------------------------------------------------------------------------
// The 'owBlock' transfers a block of data to and from the 
// 1-Wire Net with an optional reset at the begining of communication.
// The result is returned in the same buffer.
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number is provided to
//              indicate the symbolic port number.
// 'do_reset' - cause a owTouchReset to occure at the begining of 
//              communication TRUE(1) or not FALSE(0)
// 'tran_buf' - pointer to a block of unsigned
//              chars of length 'tran_len' that will be sent 
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
//  The maximum tran_length is 64
//
int owBlock(int portnum, int do_reset, uchar *tran_buf, int tran_len)
{
   uchar sendpacket[150];
   int sendlen=0,pos,i;

   // check for a block too big
   if (tran_len > 64)
      return FALSE;

   // check if need to do a owTouchReset first
   if (do_reset)
   {
      if (!owTouchReset(portnum))
         return FALSE;
   }  

   // construct the packet to send to the DS2480
   // check if correct mode 
   if (UMode[portnum] != MODSEL_DATA)
   {
      UMode[portnum] = MODSEL_DATA;
      sendpacket[sendlen++] = MODE_DATA;
   }

   // add the bytes to send
   pos = sendlen;
   for (i = 0; i < tran_len; i++)
   {
      sendpacket[sendlen++] = tran_buf[i];

      // check for duplication of data that looks like COMMAND mode 
      if (tran_buf[i] == MODE_COMMAND) 
         sendpacket[sendlen++] = tran_buf[i];
   }

   // flush the buffers
   FlushCOM(portnum);

   // send the packet 
   if (WriteCOM(portnum,sendlen,sendpacket)) 
   {
      // read back the response 
     if (ReadCOM(portnum,tran_len,tran_buf) == tran_len) {
       return TRUE;
     }
   }

   // an error occured so re-sync with DS2480
   DS2480Detect(portnum);

   return FALSE;
}
  
//--------------------------------------------------------------------------
// Read a Universal Data Packet from a standard NVRAM iButton 
// and return it in the provided buffer. The page that the 
// packet resides on is 'start_page'.  Note that this function is limited 
// to single page packets. The buffer 'read_buf' must be at least 
// 29 bytes long.  
//
// The Universal Data Packet always start on page boundaries but 
// can end anywhere.  The length is the number of data bytes not 
// including the length byte and the CRC16 bytes.  There is one 
// length byte. The CRC16 is first initialized to the starting 
// page number.  This provides a check to verify the page that 
// was intended is being read.  The CRC16 is then calculated over 
// the length and data bytes.  The CRC16 is then inverted and stored 
// low byte first followed by the high byte. 
//
// Supported devices: DS1992, DS1993, DS1994, DS1995, DS1996, DS1982, 
//                    DS1985, DS1986, DS2407, and DS1971. 
//
// 'portnum'    - number 0 to MAX_PORTNUM-1.  This number is provided to
//                indicate the symbolic port number.
// 'do_access'  - flag to indicate if an 'owAccess' should be
//                peformed at the begining of the read.  This may
//                be FALSE (0) if the previous call was to read the
//                previous page (start_page-1).
// 'start_page' - page number to start the read from 
// 'read_buf'   - pointer to a location to store the data read
//
// Returns:  >=0 success, number of data bytes in the buffer
//           -1  failed to read a valid UDP 
//     
//
int owReadPacketStd(int portnum, int do_access, int start_page, uchar *read_buf)
{
   int i,length,sendlen=0,head_len=0;
   uchar sendpacket[50];
   ushort lastcrc16;

#if DEBUG_OW_TRNU
   printf ("owReadPacketStd: %d %d\n", do_access, start_page);
#endif
   // check if access header is done 
   // (only use if in sequention read with one access at begining)
   if (do_access)
   {
      // match command
      sendpacket[sendlen++] = 0x55;    
      for (i = 0; i < 8; i++)
         sendpacket[sendlen++] = SerialNum[portnum][i];
      // read memory command
      sendpacket[sendlen++] = 0xF0;     
      // write the target address
      sendpacket[sendlen++] = ((start_page << 5) & 0xFF);    
      sendpacket[sendlen++] = (start_page >> 3);
      // check for DS1982 exception (redirection byte)
      if (SerialNum[portnum][0] == 0x09)
         sendpacket[sendlen++] = 0xFF;
      // record the header length
      head_len = sendlen;
   }
   // read the entire page length byte
   for (i = 0; i < 32; i++)      
      sendpacket[sendlen++] = 0xFF;   

   // send/recieve the transfer buffer   
   if (owBlock(portnum,do_access,sendpacket,sendlen))
   {
      // seed crc with page number
      setcrc16(portnum,(ushort)start_page);               

      // attempt to read UDP from sendpacket
      length = sendpacket[head_len];            
      docrc16(portnum,(ushort)length);

      // verify length is not too large
      if (length <= 29)                
      {
         // loop to read packet including CRC
         for (i = 0; i < length; i++)     
         {
             read_buf[i] = sendpacket[i+1+head_len];
             docrc16(portnum,read_buf[i]);           
         }
            
         // read and compute the CRC16 
         docrc16(portnum,sendpacket[i+1+head_len]);
         lastcrc16 = docrc16(portnum,sendpacket[i+2+head_len]);
         
         // verify the CRC16 is correct           
         if (lastcrc16 == 0xB001) 
           return length;        // return number of byte in record
#if DEBUG_OW_TRNU
	 printf ("owReadPacketStd: crc error in page %d\n", start_page);
#endif
      }  
   }
#if DEBUG_OW_TRNU
   printf ("owReadPacketStd: block>29 : %d\n", length);
#endif
   // failed block or incorrect CRC
   return -1;
}

//--------------------------------------------------------------------------
// Write a Universal Data Packet onto a standard NVRAM 1-Wire device
// on page 'start_page'.  This function is limited to UDPs that
// fit on one page.  The data to write is provided as a buffer
// 'write_buf' with a length 'write_len'.
//
// The Universal Data Packet always start on page boundaries but 
// can end anywhere.  The length is the number of data bytes not 
// including the length byte and the CRC16 bytes.  There is one 
// length byte. The CRC16 is first initialized to the starting 
// page number.  This provides a check to verify the page that 
// was intended is being read.  The CRC16 is then calculated over 
// the length and data bytes.  The CRC16 is then inverted and stored 
// low byte first followed by the high byte. 
//
// Supported devices: is_eprom=0 
//                        DS1992, DS1993, DS1994, DS1995, DS1996
//                    is_eprom=1, crc_type=0(CRC8)
//                        DS1982
//                    is_eprom=1, crc_type=1(CRC16) 
//                        DS1985, DS1986, DS2407 
//
// 'portnum'    - number 0 to MAX_PORTNUM-1.  This number is provided to
//                indicate the symbolic port number.
// 'start_page' - page number to write packet to
// 'write_buf'  - pointer to buffer containing data to write
// 'write_len'  - number of data byte in write_buf
// 'is_eprom'   - flag set if device is an EPROM (1 EPROM, 0 NVRAM)
// 'crc_type'   - if is_eprom=1 then indicates CRC type 
//                (0 CRC8, 1 CRC16)
//
// Returns: TRUE(1)  success, packet written
//          FALSE(0) failure to write, contact lost or device locked
//
//
int owWritePacketStd(int portnum, int start_page, uchar *write_buf, 
                       int write_len, int is_eprom, int crc_type)
{
   uchar construct_buffer[32];
   int i,buffer_cnt=0,start_address,do_access;
   ushort lastcrc16;

#if DEBUG_OW_TRNU
   printf ("owWritePacketStd: %d %d\n", start_page, write_len);
#endif
   // check to see if data too long to fit on device
   if (write_len > 29) {
#if DEBUG_OW_TRNU
     printf ("owWritePacketStd: too long\n");
#endif
     return FALSE;
   }
              
   // seed crc with page number           
   setcrc16(portnum,(ushort)start_page); 
      
   // set length byte
   construct_buffer[buffer_cnt++] = (uchar)(write_len);
   docrc16(portnum,(ushort)write_len);
      
   // fill in the data to write
   for (i = 0; i < write_len; i++)
   {
     lastcrc16 = docrc16(portnum,write_buf[i]);
     construct_buffer[buffer_cnt++] = write_buf[i];
   }  
      
   // add the crc
   construct_buffer[buffer_cnt++] = (uchar)(~(lastcrc16 & 0xFF));
   construct_buffer[buffer_cnt++] = (uchar)(~((lastcrc16 & 0xFF00) >> 8));
   
   // check if not EPROM                 
   if (!is_eprom)
   {
      // write the page
     if (!Write_Scratchpad(portnum,construct_buffer,start_page,buffer_cnt)) {
#if DEBUG_OW_TRNU
       printf ("owWritePacketStd: couldn't Write_Scratchpad\n");
#endif
       return FALSE;
     }
   
      // copy the scratchpad            
     if (!Copy_Scratchpad(portnum,start_page,buffer_cnt)) {
#if DEBUG_OW_TRNU
       printf ("owWritePacketStd: couldn't Copy_Scratchpad\n");
#endif
       return FALSE;
     }
     
      // copy scratch pad was good then success
      return TRUE;
   }
   // is EPROM
   else
   {  
      // calculate the start address
      start_address = ((start_page >> 3) << 8) | ((start_page << 5) & 0xFF);
      do_access = TRUE;
      // loop to program each byte
      for (i = 0; i < buffer_cnt; i++)
      {
         if (owProgramByte(portnum,construct_buffer[i], start_address + i, 
             0x0F, crc_type, do_access) != construct_buffer[i])
            return FALSE;
         do_access = FALSE;
      }
      return TRUE;
   }
}

//--------------------------------------------------------------------------
// Write a byte to an EPROM 1-Wire device.
//
// Supported devices: crc_type=0(CRC8)
//                        DS1982
//                    crc_type=1(CRC16) 
//                        DS1985, DS1986, DS2407 
//
// 'portnum'    - number 0 to MAX_PORTNUM-1.  This number is provided to
//                indicate the symbolic port number.
// 'write_byte' - byte to program
// 'addr'       - address of byte to program
// 'write_cmd'  - command used to write (0x0F reg mem, 0x55 status)
// 'crc_type'   - CRC used (0 CRC8, 1 CRC16)
// 'do_access'  - Flag to access device for each byte 
//                (0 skip access, 1 do the access)
//                WARNING, only use do_access=0 if programing the NEXT
//                byte immediatly after the previous byte.
//
// Returns: >=0   success, this is the resulting byte from the program
//                effort
//          -1    error, device not connected or program pulse voltage
//                not available
//
int owProgramByte(int portnum, int write_byte, int addr, int write_cmd, 
                    int crc_type, int do_access)
{                                
   ushort lastcrc16;
   uchar lastcrc8;

   // optionally access the device
   if (do_access)
   {
      if (!owAccess(portnum))
         return -1;

      // send the write command
      if (!owWriteByte(portnum,write_cmd))
         return -1;

      // send the address
      if (!owWriteByte(portnum,addr & 0xFF))
         return -1;
      if (!owWriteByte(portnum,addr >> 8))
         return -1;
   }

   // send the data to write
   if (!owWriteByte(portnum,write_byte))
      return -1;

   // read the CRC
   if (crc_type == 0)
   {
      // calculate CRC8
      if (do_access)
      {
         setcrc8(portnum,0);
         docrc8(portnum,(uchar)write_cmd);
         docrc8(portnum,(uchar)(addr & 0xFF));
         docrc8(portnum,(uchar)(addr >> 8));
      }
      else
         setcrc8(portnum,(uchar)(addr & 0xFF));

      docrc8(portnum,(uchar)write_byte);
      // read and calculate the read crc
      lastcrc8 = docrc8(portnum,(uchar)owReadByte(portnum));
      // crc should now be 0x00
      if (lastcrc8 != 0)
         return -1;
   }
   else
   {
      // CRC16
      if (do_access)
      {
         setcrc16(portnum,0);
         docrc16(portnum,(ushort)write_cmd);
         docrc16(portnum,(ushort)(addr & 0xFF));
         docrc16(portnum,(ushort)(addr >> 8));
      }
      else
         setcrc16(portnum,(ushort)addr);
      docrc16(portnum,(ushort)write_byte);
      // read and calculate the read crc
      docrc16(portnum,(ushort)owReadByte(portnum));
      lastcrc16 = docrc16(portnum,(ushort)owReadByte(portnum));
      // crc should now be 0xB001
      if (lastcrc16 != 0xB001)
         return -1;
   }

   // send the program pulse
   if (!owProgramPulse(portnum))
      return -1;

   // read back and return the resulting byte   
   return owReadByte(portnum);
}

//--------------------------------------------------------------------------
// Write the scratchpad of a standard NVRam device such as the DS1992,3,4
// and verify its contents. 
//
// 'portnum'    - number 0 to MAX_PORTNUM-1.  This number is provided to
//                indicate the symbolic port number.
// 'write_buf'  - pointer to buffer containing data to write
// 'start_page'    - page number to write packet to
// 'write_len'  - number of data byte in write_buf
//
// Returns: TRUE(1)  success, the data was written and verified
//          FALSE(0) failure, the data could not be written
// 
//
int Write_Scratchpad(int portnum, uchar *write_buf, int start_page, int write_len)
{
   int i,sendlen=0;
   uchar sendpacket[50];
   
#if DEBUG_OW_TRNU
   printf ("Write_Scratchpad: %d %d\n", start_page, write_len);
#endif
   // match command
   sendpacket[sendlen++] = 0x55;    
   for (i = 0; i < 8; i++)
      sendpacket[sendlen++] = SerialNum[portnum][i];
   // write scratchpad command
   sendpacket[sendlen++] = 0x0F;     
   // write the target address
   sendpacket[sendlen++] = ((start_page << 5) & 0xFF);    
   sendpacket[sendlen++] = (start_page >> 3);

   // write packet bytes 
   for (i = 0; i < write_len; i++)
      sendpacket[sendlen++] = write_buf[i];
   
   // send/recieve the transfer buffer   
   if (owBlock(portnum,TRUE,sendpacket,sendlen))
   {
      // now attempt to read back to check
      sendlen = 0;
      // match command
      sendpacket[sendlen++] = 0x55;    
      for (i = 0; i < 8; i++)
         sendpacket[sendlen++] = SerialNum[portnum][i];
      // read scratchpad command
      sendpacket[sendlen++] = 0xAA;     
      // read the target address, offset and data
      for (i = 0; i < (write_len + 3); i++)
         sendpacket[sendlen++] = 0xFF;
   
      // send/recieve the transfer buffer   
      if (owBlock(portnum,TRUE,sendpacket,sendlen))
      {
         // check address and offset of scratchpad read
	if ((sendpacket[10] != (int)((start_page << 5) & 0xFF)) ||
	    (sendpacket[11] != (int)(start_page >> 3)) ||
	    (sendpacket[12] != (int)(write_len - 1))) {
#if DEBUG_OW_TRNU
	   printf ("\nWrite_Scratchpad: check failed\n");
#endif
	   //return FALSE;
	 }

         // verify each data byte
         for (i = 0; i < write_len; i++)
	   if (sendpacket[i+13] != write_buf[i]) {
#if DEBUG_OW_TRNU
	     printf ("\nWrite_Scratchpad: data check failed\n");
#endif
	     return FALSE;
	   }

         // must have verified
         return TRUE;
      }
   } 
#if DEBUG_OW_TRNU
   printf ("\nWrite_Scratchpad: owBlock failed\n");
#endif
   
   // failed a block tranfer
   return FALSE;
}

//--------------------------------------------------------------------------
// Copy the contents of the scratchpad to its intended nv ram page.  The
// page and length of the data is needed to build the authorization bytes
// to copy.
//
// 'portnum'    - number 0 to MAX_PORTNUM-1.  This number is provided to
//                indicate the symbolic port number.
// 'start_page' - page number to write packet to
// 'write_len'  - number of data bytes that are being copied
//
// Returns: TRUE(1)  success
//          FALSE(0) failure
//
int Copy_Scratchpad(int portnum, int start_page, int write_len)
{
   int i,sendlen=0;
   uchar sendpacket[50];

#if DEBUG_OW_TRNU
   printf ("Copy_Scratchpad: %d %d\n", start_page, write_len);
#endif
   
   // match command
   sendpacket[sendlen++] = 0x55;    
   for (i = 0; i < 8; i++)
      sendpacket[sendlen++] = SerialNum[portnum][i];
   // copy scratchpad command
   sendpacket[sendlen++] = 0x55;     
   // write the target address
   sendpacket[sendlen++] = ((start_page << 5) & 0xFF);    
   sendpacket[sendlen++] = (start_page >> 3);
   sendpacket[sendlen++] = write_len - 1;
   // read copy result
   sendpacket[sendlen++] = 0xFF;
   
#if DEBUG_OW_TRNU
   printf ("Copy_Scratchpad: %d, %02x %02x %02x %02x\n", sendlen,
	   sendpacket[10],sendpacket[11],sendpacket[12],sendpacket[13]);
#endif
   // send/recieve the transfer buffer   
   if (owBlock(portnum,TRUE,sendpacket,sendlen))
   {
      // check address and offset of scratchpad read
      if ((sendpacket[10] != (int)((start_page << 5) & 0xFF)) ||
          (sendpacket[11] != (int)(start_page >> 3)) ||
          (sendpacket[12] != (int)(write_len - 1)) ||
          (sendpacket[13] & 0xF0)) {
#if DEBUG_OW_TRNU
	printf ("Copy_Scratchpad: %d, check failed: %02x %02x %02x %02x\n",
		sendlen,
		sendpacket[10],sendpacket[11],sendpacket[12],sendpacket[13]);
#endif
	return FALSE;
      }
      else {
#if DEBUG_OW_TRNU
	printf ("Copy_Scratchpad: %02x %02x %02x %02x\n",
		sendpacket[10],sendpacket[11],sendpacket[12],sendpacket[13]);
#endif
         return TRUE;   
      }
   }
#if DEBUG_OW_TRNU
   printf ("Copy_Scratchpad: owBlock failed\n");
#endif
   // failed a block tranfer
   return FALSE;
}
                       
