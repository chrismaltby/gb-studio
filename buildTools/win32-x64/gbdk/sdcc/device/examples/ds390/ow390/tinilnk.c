#define DEBUG_OW_COM 0
#if DEBUG_OW_COM
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
//  TODO.C - COM functions required by MLANLL.C, MLANTRNU, MLANNETU.C and
//           MLanFile.C for MLANU to communicate with the DS2480 based 
//           Universal Serial Adapter 'U'.  Fill in the platform specific code.
//
//  Version: 1.02
//
//  History: 1.00 -> 1.01  Added function msDelay. 
//
//           1.01 -> 1.02  Changed to generic OpenCOM/CloseCOM for easier 
//                         use with other platforms.
//

//--------------------------------------------------------------------------
// Copyright (C) 1998 Andrea Chambers and University of Newcastle upon Tyne,
// All Rights Reserved.
//--------------------------------------------------------------------------
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
// IN NO EVENT SHALL THE UNIVERSITY OF NEWCASTLE UPON TYNE OR ANDREA CHAMBERS
// BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH
// THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//---------------------------------------------------------------------------
//
//  LinuxLNK.C - COM functions required by MLANLLU.C, MLANTRNU.C, MLANNETU.C 
//             and MLanFile.C for MLANU to communicate with the DS2480 based
//             Universal Serial Adapter 'U'.  Platform specific code.
//
//  Version: 1.03
//  History: 1.00 -> 1.03 modifications by David Smiczek
//                        Changed to use generic OpenCOM/CloseCOM  
//                        Pass port name to OpenCOM instead of hard coded
//                        Changed msDelay to handle long delays 
//                        Reformatted to look like 'TODO.C' 
//                        Added #include "ds2480.h" to use constants.
//                        Added function SetBaudCOM() 
//                        Added function msGettick()
//                        Removed delay from WriteCOM(), used tcdrain()
//                        Added wait for byte available with timeout using
//                          select() in ReadCOM()
//
//           1.03 -> 2.00 Support for multiple ports. Include "ownet.h". Use
//                        'uchar'.  Reorder functions. Provide correct 
//                        return values to OpenCOM.  Replace 'makeraw' call.
//                        Should now be POSIX. 
//

#include <stdio.h>

#include "ownet.h"
#include "ds2480.h"

//---------------------------------------------------------------------------
// Attempt to open a com port.  
// Set the starting baud rate to 9600.
//
// 'portnum'   - number 0 to MAX_PORTNUM-1.  This number provided will 
//               be used to indicate the port number desired when calling
//               all other functions in this library.
//
// 'port_zstr' - zero terminate port name.  For this platform
//               ignored for now
//
//
// Returns: TRUE(1)  - success, COM port opened
//          FALSE(0) - failure, could not open specified port
//
int OpenCOM(int portnum, char *port_zstr)
{     
  unsigned long baud=9600;

  //printf ("OpenCOM(%d,\"%s\")\n", portnum, port_zstr);
  
  // hush the compiler
  portnum;
  port_zstr;
  
  Serial1Init(baud,1);
  
  return TRUE; // changed (2.00), used to return fd;
}

//---------------------------------------------------------------------------
// Closes the connection to the port.
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number was provided to
//              OpenCOM to indicate the port number.
//
void CloseCOM(int portnum)
{
  //printf ("CloseCOM(%d)\n", portnum);

 // hush the compiler
  portnum;
}


//--------------------------------------------------------------------------
// Write an array of bytes to the COM port, verify that it was
// sent out.  Assume that baud rate has been set.
//
// 'portnum'   - number 0 to MAX_PORTNUM-1.  This number provided will 
//               be used to indicate the port number desired when calling
//               all other functions in this library.
// Returns 1 for success and 0 for failure
//   
int WriteCOM(int portnum, int outlen, uchar *outbuf)
{
  int i;

#if DEBUG_OW_COM
  printf ("WriteCOM(%d, %d,...): ", portnum, outlen, outbuf);
#endif

  // hush the compiler
  portnum;

  for (i=0; i<outlen; i++) {
#if DEBUG_OW_COM
    printf ("%02x ", outbuf[i]);
#endif
    Serial1PutChar(outbuf[i]);
  }
#if DEBUG_OW_COM
  printf ("\n");
#endif
  return TRUE;
}  

//--------------------------------------------------------------------------
// Read an array of bytes to the COM port, verify that it was
// sent out.  Assume that baud rate has been set.
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number was provided to
//              OpenCOM to indicate the port number.
// 'outlen'   - number of bytes to write to COM port
// 'outbuf'   - pointer ot an array of bytes to write
//
// Returns:  TRUE(1)  - success 
//           FALSE(0) - failure
//
int ReadCOM(int portnum, int inlen, uchar *inbuf)
{  
  int i;

#if DEBUG_OW_COM
  printf ("ReadCOM(%d,%d,...): ", portnum, inlen);
#endif

  // hush the compiler
  portnum;

  for (i=0; i<inlen; i++) {
    inbuf[i]=Serial1GetChar();
#if DEBUG_OW_COM
    printf ("%02x ", inbuf[i]&0xff);
#endif
  }
#if DEBUG_OW_COM
  printf ("\n");
#endif
  
   // success, so return desired length
   return i;
}


//---------------------------------------------------------------------------
//  Description:
//     flush the rx and tx buffers
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number was provided to
//              OpenCOM to indicate the port number.
//
void FlushCOM(int portnum)    
{    
  //printf ("FlushCOM(%d): ", portnum);

  // hush the compiler
  portnum;

  Serial1Flush();
}  


//--------------------------------------------------------------------------
//  Description:
//     Send a break on the com port for at least 2 ms
// 
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number was provided to
//              OpenCOM to indicate the port number.
//

void BreakCOM(int portnum)      
{
  //printf ("BreakCOM(%d)\n", portnum);
  // hush the compiler
  portnum;

  Serial1SendBreak();
}


//--------------------------------------------------------------------------
// Set the baud rate on the com port. 
//
// 'portnum'   - number 0 to MAX_PORTNUM-1.  This number was provided to
//               OpenCOM to indicate the port number.
// 'new_baud'  - new baud rate defined as
// PARMSET_9600     0x00
// PARMSET_19200    0x02
// PARMSET_57600    0x04
// PARMSET_115200   0x06
// 

void SetBaudCOM(int portnum, int new_baud)
{
  unsigned long baud;

  portnum; // hush the compiler

  switch (new_baud) {
  case PARMSET_9600: baud=9600; break;
  case PARMSET_19200: baud=19200; break;
  case PARMSET_57600: baud=57600; break;
  case PARMSET_115200: baud=115200; break;
  default:
    return;
  }
  Serial1Baud(baud);
}

//--------------------------------------------------------------------------
// Get the current millisecond tick count.  Does not have to represent
// an actual time, it just needs to be an incrementing timer.
//
long msGettick(void)
{
   return ClockTicks();
}


//--------------------------------------------------------------------------
//  Description:
//     Delay for at least 'len' ms
// 
void msDelay(int len)
{
  ClockMilliSecondsDelay(len);
}

