// Elementary functions for for serial communication for Visual C / MFC
// Bela Torok / bela.torok@kssg.ch, March 2001

// This version is using the CTS/RTS protocol only, with 8 databits + no parity.
// This file was tested with ser_ir_cts_rts.c (in device/lib)

// Todo: Imporve the function SerialInit to support communication with no_protocol & XON/XOFF protocol,
// 7 databits, even & odd parity, 1, 1.5 & 2 stopbits, etc...

#include <stdio.h>
#include <time.h>

//#define VC_EXTRALEAN		// Exclude rarely-used stuff from Windows headers

#include <afxwin.h>    // serial.cpp : Defines the entry point for the console application.

//#include "stdafx.h"
#include <string.h>

#include "serial.h"

// Flow control flags

#define FC_DTRDSR       0x01
#define FC_RTSCTS       0x02
#define FC_XONXOFF      0x04

// ascii definitions

#define ASCII_BEL       0x07
#define ASCII_BS        0x08
#define ASCII_LF        0x0A
#define ASCII_CR        0x0D
#define ASCII_XON       0x11
#define ASCII_XOFF      0x13

	// variables used with the com port
	BOOL			bPortReady;
	DCB				dcb;
	COMMTIMEOUTS	CommTimeouts;
	BOOL			bWriteRC;
	BOOL			bReadRC;
	DWORD			iBytesWritten;
	DWORD			iBytesRead;

HANDLE SerialInit(char *ComPortName, int BaudRate) 
{
	HANDLE hCom;
	
	hCom = CreateFile(ComPortName, 
		GENERIC_READ | GENERIC_WRITE,
		0, // exclusive access
		NULL, // no security
		OPEN_EXISTING,
		0, // no overlapped I/O
		NULL); // null template 

	bPortReady = SetupComm(hCom, 2, 128); // set buffer sizes


	bPortReady = GetCommState(hCom, &dcb);
	dcb.BaudRate = BaudRate;
	dcb.ByteSize = 8;
	dcb.Parity = NOPARITY;
//	dcb.Parity = EVENPARITY;
	dcb.StopBits = ONESTOPBIT;
	dcb.fAbortOnError = TRUE;

	// set XON/XOFF
	dcb.fOutX = FALSE;					// XON/XOFF off for transmit
	dcb.fInX	= FALSE;					// XON/XOFF off for receive
	// set RTSCTS
	dcb.fOutxCtsFlow = TRUE;					// turn on CTS flow control
	dcb.fRtsControl = RTS_CONTROL_HANDSHAKE;	// 
	// set DSRDTR
	dcb.fOutxDsrFlow = FALSE;					// turn on DSR flow control
	dcb.fDtrControl = DTR_CONTROL_ENABLE;	// 
//	dcb.fDtrControl = DTR_CONTROL_DISABLE;	// 
//	dcb.fDtrControl = DTR_CONTROL_HANDSHAKE;	// 

	bPortReady = SetCommState(hCom, &dcb);

	// Communication timeouts are optional

	bPortReady = GetCommTimeouts (hCom, &CommTimeouts);

	CommTimeouts.ReadIntervalTimeout = 5000;
	CommTimeouts.ReadTotalTimeoutConstant = 5000;
	CommTimeouts.ReadTotalTimeoutMultiplier = 1000;
	CommTimeouts.WriteTotalTimeoutConstant = 5000;
	CommTimeouts.WriteTotalTimeoutMultiplier = 1000;

	bPortReady = SetCommTimeouts (hCom, &CommTimeouts);

	return hCom;
}

char SerialGetc(HANDLE *hCom)
{
	char rxchar;
	BOOL	bReadRC;
	static	DWORD	iBytesRead;

	bReadRC = ReadFile(*hCom, &rxchar, 1, &iBytesRead, NULL);

	return rxchar;
}

void SerialPutc(HANDLE *hCom, char txchar)
{
	BOOL	bWriteRC;
	static	DWORD	iBytesWritten;
	
	bWriteRC = WriteFile(*hCom, &txchar, 1, &iBytesWritten,NULL);
}

char* SerialGets(HANDLE *hCom)
{
	static char rxstring[256];
	char c;
	int pos = 0;

	while(pos <= 255) {
		c = SerialGetc(hCom);
		if(c == '\r') continue;		// discard carriage return
		rxstring[pos++] = c;
		if(c == '\n') break;
	}
	rxstring[pos] = 0;

	return	rxstring;
}

void SerialPuts(HANDLE *hCom, char *txstring)
{
	BOOL	bWriteRC;
	static	DWORD	iBytesWritten;

	bWriteRC = WriteFile(*hCom, txstring, strlen(txstring), &iBytesWritten,NULL);

}

void sleep( int _wait)
{
	clock_t goal;
	goal = clock() + _wait;
	while( goal > clock() );
}

