#define DEBUG_OW_FILE 0
#if DEBUG_OW_FILE
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
// owFile.C: Rudimentary level functions for reading and writing TMEX
//             files on NVRAM iButton using the packet level functions.
//
// Version:  2.00
//
// History:
//           1.02 -> 1.03  Removed caps in #includes for Linux capatibility
//           1.03 -> 2.00  Changed 'MLan' to 'ow'. Added support for 
//                         multiple ports.  
//

#include "ownet.h"

//--------------------------------------------------------------------------
// Read a TMEX file return it in the provided buffer. 
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number was provided to
//              OpenCOM to indicate the port number.
// 'filename' - pointer to five byte filename to read where the
//              the first four bytes are the name and the fifth is
//              the extension (0 to 101 decimal).             
// 'buf'      - pointer to a buffer to place the file information into.
//              This may need to be as large as 7084 bytes.
// 
// Supported devices: All devices supported by owReadPacketStd
//
// Returns:  >=0  success, number of bytes in the buffer
//           <0   failed to read the file (error code) 
//
int owReadFile(int portnum, uchar *filename, uchar *buf)
{  
  uchar dirpg=0,pgbuf[32],filepg=0;
  char pglen;
  ushort bufcnt=0,i;
               
#if DEBUG_OW_FILE
   printf ("owReadFile: %s\n", filename);
#endif
   // loop read directory pages until the file entry is found
   do
   {
      // read a directory page
      pglen = owReadPacketStd(portnum,TRUE,dirpg,pgbuf);  
       
      // check for reading error
      if (pglen <= 0)
         return READ_ERROR;
         
      // if this is the first page make sure this is a directory
      // structure
      if (  ((dirpg == 0) && 
            ((pgbuf[0] != 0xAA) || (pgbuf[1] != 0) || (pglen < 7)))
            ||
            ((pglen-1) % 7) ) 
         return INVALID_DIR;
      
      // loop through each file entry in directory page (page 0 exception)
      for (i = (dirpg == 0) ? 7 : 0; i < 28; i += 7)
      {     
         // file entry found?
         if ((filename[0] == pgbuf[i]) &&
             (filename[1] == pgbuf[i+1]) &&
             (filename[2] == pgbuf[i+2]) &&
             (filename[3] == pgbuf[i+3]) &&
             (filename[4] == (pgbuf[i+4] & 0x7F)) )
         {
            // get the file starting page number
            filepg = pgbuf[i+5];
#if DEBUG_OW_FILE
	    printf ("owReadFile: file %s starts at %d\n", filename, filepg);
#endif
            break;
         }
      }
      
      // get the next directory page (from page pointer) 
      dirpg = pgbuf[pglen-1];
   }
   while (dirpg && (filepg == 0));  
   
   // check if file found
   if (!filepg)
      return NO_FILE;
   
   // loop to read the file pages
   do
   {
      // read a file page
      pglen = owReadPacketStd(portnum,TRUE,filepg,pgbuf);  
      
      // check result of read
      if (pglen <= 0) {
	return READ_ERROR;
      }
   
      // append the page data to the buffer
      for (i = 0; i < (pglen - 1); i++)
         buf[bufcnt++] = pgbuf[i];

      // get the next file page (from page pointer) 
      filepg = pgbuf[pglen-1];
   }
   while (filepg);

   // return the number of data bytes read
   return bufcnt;
}


//--------------------------------------------------------------------------
// Format and Write a TMEX file. 
// Any previous files will be removed in the Format operation.
// The file length 'fllen' can be up to:
//     420  bytes for a DS1993   
//     1736 bytes for a DS1995
//     7084 bytes for a DS1996.
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number was provided to
//              OpenCOM to indicate the port number.
// 'filename' - pointer to five byte filename to write where the
//              the first four bytes are the name and the fifth is
//              the extension (0 to 101 decimal).             
// 'buf'      - pointer to a buffer containing the file information to write.
//
// Supported devices: DS1993, DS1994, DS1995, DS1996
//
// Returns:  TRUE(1) success, device formated and file written
//           <0      failed to read the file (error code) 
//     
//
int owFormatWriteFile(int portnum, uchar *filename, int fllen, uchar *buf)
{
   uchar dummydir[] = { 0xAA, 0, 0x80, 0x01, 0, 0, 0, 0 },
      newdir[] = { 0xAA, 0, 0x80, 0x01, 0, 0, 0, ' ', ' ', ' ', ' ', 0, 1, 1, 0 },
      bmpg1[] = { 0x03,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0x02 },
      bmpg2[] = { 0,0,0,0,0 }, pgbuf[32];   
   int i,numdirpgs,flpg,bmpg1len,bmpg2len,cntleft,pos,numpgs;

#if DEBUG_OW_FILE
   printf ("owFormatWriteFile: %s %d\n", filename, fllen);
#endif
   // calculate the number of pages needed to write the file
   numpgs = (fllen / 28) + ((fllen % 28) ? 1 : 0);
   
   // put the file in the newdirectory
   for(i = 0; i < 5; i++)
      newdir[i+7] = filename[i];
   newdir[13] = (uchar)numpgs;
   
   // set the directory pages for formatting device depending on the device type
   switch (SerialNum[portnum][0])  //jpe
   {
      case 0x06:  // DS1993
         // check for file too big
         if (numpgs > 15)
            return FILE_TOO_BIG;
         // set the bitmap in the directory page
         for (i = 0; i < numpgs; i++)
            bitacc(WRITE_FUNCTION,1,i+1,&newdir[3]);
         numdirpgs = 1;
         flpg = 1;   
         newdir[12] = (uchar)flpg;
         break;                               
      case 0x0A:  // DS1995
         // check for file too big
         if (numpgs > 62)
            return FILE_TOO_BIG;       
         // set to external bitmap file
         newdir[2] = 0; 
         // set the bitmap in the first (and only) bitmap page
         for (i = 0; i < numpgs; i++)
            bitacc(WRITE_FUNCTION,1,i+2,&bmpg1[0]);
         numdirpgs = 2;
         flpg = 2; 
         newdir[12] = (uchar)flpg; // startpage
         bmpg1len = 9;                          
         newdir[3] = 0; // remove local bitmap
         newdir[5] = 1; // bitmap start page
         newdir[6] = 1; // bitmap number of pages
         break;                               
      case 0x0C:  // DS1996 
         // check for file too big
         if (numpgs > 253)
            return FILE_TOO_BIG;
         // set to external bitmap file
         newdir[2] = 0; 
         // set the 3rd bitmap page in the bitmap
         bitacc(WRITE_FUNCTION,1,2,&bmpg1[0]);
         
         // set the bitmap in the first and second bitmap page
         for (i = 0; i < numpgs; i++)
         {
            if (i <= 221)
               bitacc(WRITE_FUNCTION,1,i+3,&bmpg1[0]);  
            else
               bitacc(WRITE_FUNCTION,1,i-221,&bmpg2[0]);  
         }   
         numdirpgs = 3;
         flpg = 3;   
         newdir[12] = (uchar)flpg; // startpage
         bmpg1len = 29;  
         bmpg2len = 5;  
         newdir[3] = 0; // remove local bitmap
         newdir[5] = 1; // bitmap start page
         newdir[6] = 2; // bitmap number of pages
         break;                               
      default:
         return WRONG_TYPE;
   }
   
   // write a dummy directory in page 0 in case we get interrupted
   if (!owWritePacketStd(portnum,0,dummydir,8,FALSE,FALSE))
      return WRITE_ERROR;
   
   // loop to write the file in contiguous pages start with flpg
   cntleft = fllen;  // count of bytes left to write  
   pos = 0; // current position in the buffer to write
   while (cntleft > 0)
   {
      // get a page of data to write
      for (i = 0; i < ((cntleft > 28) ? 28 : cntleft); i++)
         pgbuf[i] = buf[pos++];
                                    
      // adjust the bytes left
      cntleft -= i;
                                    
      // set the next page pointer   
      pgbuf[i] = (cntleft == 0) ? 0 : flpg+1;
      
      // write the page and check to result
      if (!owWritePacketStd(portnum,flpg,pgbuf,i+1,FALSE,FALSE))
         return WRITE_ERROR;
      
      // set the next page
      flpg++;      
   } 

   // now write the second bitmap page if needed
   if (numdirpgs == 3)
      if (!owWritePacketStd(portnum,2,bmpg2,bmpg2len,FALSE,FALSE))
         return WRITE_ERROR;

   // now write the first bitmap page if needed
   if (numdirpgs >= 2)
      if (!owWritePacketStd(portnum,1,bmpg1,bmpg1len,FALSE,FALSE))
         return WRITE_ERROR;
   
   // now write the directory page
   if (!owWritePacketStd(portnum,0,newdir,15,FALSE,FALSE))
      return WRITE_ERROR;
   
   // success file written
   return TRUE;
} 

