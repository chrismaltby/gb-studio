//----------------------------------------------------------------------------
//Written by Dmitry S. Obukhov, 1996
// dso@usa.net 
//----------------------------------------------------------------------------
//This module implements serial interrupt handler and IO routinwes using
//two 256 byte cyclic buffers. Bit variables can be used as flags for 
//real-time kernel tasks
//Last modified 6 Apr 97
//----------------------------------------------------------------------------

//This module contains definition of I8051 registers
#include "8052.h"


static unsigned char xdata stx_index_in, srx_index_in, stx_index_out, srx_index_out;
static unsigned char xdata stx_buffer[0x100];
static unsigned char xdata srx_buffer[0x100];

static bit work_flag_byte_arrived;
static bit work_flag_buffer_transfered;
static bit tx_serial_buffer_empty;
static bit rx_serial_buffer_empty;


void serial_init(void)
{
    SCON = 0x50;
    T2CON = 0x34;
    PS = 1;
    T2CON = 0x34;
    RCAP2H = 0xFF;
    RCAP2L = 0xDA;
    
    RI = 0;
    TI = 0;
    
    stx_index_in = srx_index_in = stx_index_out = srx_index_out = 0;
    rx_serial_buffer_empty = tx_serial_buffer_empty = 1;
    work_flag_buffer_transfered = 0;
    work_flag_byte_arrived = 0;
    ES=1;
}

void serial_interrupt_handler(void) interrupt 4 using 1
{
    ES=0;
    if ( TI )
	{
	    TI = 0;
	    if (stx_index_out == stx_index_in )
		{
		    tx_serial_buffer_empty = 1;
		    work_flag_buffer_transfered = 1;
		}
	    else SBUF = stx_buffer[stx_index_out++];
	}
    if ( RI )
	{
	    RI = 0;
	    srx_buffer[srx_index_in++]=SBUF;
	    work_flag_byte_arrived = 1;
	    rx_serial_buffer_empty = 0;
	}
    ES=1;
}

//Next two functions are interface

void serial_putc(unsigned char c)
{
    stx_buffer[stx_index_in++]=c;
    ES=0;
    if ( tx_serial_buffer_empty )
	{
	    tx_serial_buffer_empty = 0;
	    TI=1;
	}
    ES=1;
}

unsigned char serial_getc(void)
{
    unsigned char tmp = srx_buffer[srx_index_out++];
    ES=0;
    if ( srx_index_out == srx_index_in) rx_serial_buffer_empty = 1;
    ES=1;
    return tmp;
}

//END OF MODULE
