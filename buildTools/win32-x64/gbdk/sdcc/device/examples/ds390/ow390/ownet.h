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
// ownet.h - Include file for 1-Wire Net library
//
// Version: 2.00
//
// History: 1.02 -> 1.03 Make sure uchar is not defined twice.
//          1.03 -> 2.00  Changed 'MLan' to 'ow'.
//

// Typedefs
#ifndef OW_UCHAR
#define OW_UCHAR
   typedef unsigned char  uchar;
   typedef unsigned int ushort;
   typedef unsigned long ulong;
#endif

// general defines 
#define WRITE_FUNCTION 1
#define READ_FUNCTION  0   

// error codes
#define READ_ERROR    -1
#define INVALID_DIR   -2       
#define NO_FILE       -3    
#define WRITE_ERROR   -4   
#define WRONG_TYPE    -5
#define FILE_TOO_BIG  -6

// Misc 
#define FALSE          0
#define TRUE           1
#define MAX_PORTNUM    16

// mode bit flags
#define MODE_NORMAL                    0x00
#define MODE_OVERDRIVE                 0x01
#define MODE_STRONG5                   0x02
#define MODE_PROGRAM                   0x04
#define MODE_BREAK                     0x08

// family codes of devices
#define DIR_FAMILY 0x01
#define TEMP_FAMILY 0x10
#define NVRAM64K_FAMILY 0x0c
#define SWITCH_FAMILY 0x12
#define COUNT_FAMILY 0x1D
#define ATOD_FAMILY 0X20
#define THERMO_FAM 0x21
#define SBATTERY_FAM  0x26
// this is weird, the DS2502 should be 0x09
#define DS2502_FAMILY 0x89

// tinilnk.c
extern void FlushCOM(int);
extern int  WriteCOM(int,int,uchar*);
extern int  ReadCOM(int,int,uchar*);
extern void BreakCOM(int);
extern void SetBaudCOM(int,int);
extern void msDelay(int);
extern long msGettick(void);
extern int OpenCOM(int,char *);
extern void CloseCOM(int);

// ownetu.c
extern int  owFirst(int,int,int);
extern int  owNext(int,int,int);
extern void owSerialNum(int,uchar *, int);
extern void owFamilySearchSetup(int,int);
extern void owSkipFamily(int);
extern int  owAccess(int);
extern int  owVerify(int,int);
extern int  owOverdriveAccess(int);
extern int bitacc(int,int,int,uchar *);
extern uchar SerialNum[MAX_PORTNUM][8];

// owtrnu.c
extern int owBlock(int,int,uchar *,int);
extern int owReadPacketStd(int,int,int,uchar *);
extern int owWritePacketStd(int,int,uchar *,int,int,int);   
extern int owProgramByte(int,int,int,int,int,int);

// crcutil.c
extern void setcrc16(int,ushort);
extern ushort docrc16(int,ushort);
extern void setcrc8(int,uchar);
extern uchar docrc8(int,uchar);

// owllu.c
extern int owTouchReset(int);
extern int owTouchByte(int, int);
extern int owWriteByte(int,int);
extern int owReadByte(int);
extern int owSpeed(int,int);
extern int owLevel(int,int);
extern int owProgramPulse(int);

// owlli for the internal (TINI) ow bus
extern uchar iowTouchReset(void);
extern uchar iowReadByte(void);
extern uchar iowWriteByte(uchar);
extern uchar iowBlock(uchar, uchar*, uchar);
extern uchar iowFirst(uchar do_reset, uchar alarm_only);
extern uchar iowNext(uchar do_reset, uchar alarm_only);
extern uchar iowSpeed(int speed);
extern uchar iowLevel(int level);
extern uchar iowProgramPulse(void);
extern void iowSerialNum(uchar *, uchar);

// owsesu.c
extern int  owAcquire(int,char *, char *);
//extern int  owAcquire(int,char *);
extern void owRelease(int, char *);
//extern void owRelease(int);

// findtype.c
extern int FindDevices(int, uchar FamilySN[][8], int, int); 

// offile.c
int owReadFile(int,uchar *,uchar *);
int owFormatWriteFile(int,uchar *, int, uchar *);

// sdcc has no exit
#define exit return
// sdcc has no double
#define double float
// sdcc has no key_abort
#define key_abort Serial0CharArrived
