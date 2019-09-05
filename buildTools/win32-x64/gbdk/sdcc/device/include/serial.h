//----------------------------------------------------------------------------
//Written by Dmitry S. Obukhov, 1996
// dso@usa.net 
//----------------------------------------------------------------------------
//This module implements serial interrupt handler and IO routinwes using
//two 256 byte cyclic buffers. Bit variables can be used as flags for 
//real-time kernel tasks
//Last modified 6 Apr 97
//----------------------------------------------------------------------------

void serial_init(void);
void serial_interrupt_handler(void) interrupt 4 using 1;
void serial_putc(unsigned char);
unsigned char serial_getc(void);
void autobaud();
