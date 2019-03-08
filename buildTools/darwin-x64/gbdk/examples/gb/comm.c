#include <gb/gb.h>
#include <stdio.h>

const char * str = "Hello World!";
char buffer[32];

void main(void)
{
  UBYTE i, n = 0;
  char *s;

  puts("Byte");
  puts("  A      : Send");
  puts("  B      : Receive");
  puts("String");
  puts("  START  : Send");
  puts("  SELECT : Receive");

  while(1) {
    i = waitpad(J_A | J_B | J_START | J_SELECT);
    waitpadup();

    if(i == J_A) {
      /* Send 1 byte */
      printf("Sending b... ");
      _io_out = n++;
      send_byte();
      /* Wait for IO completion... */
      while(_io_status == IO_SENDING && joypad() == 0)
	;
      if(_io_status == IO_IDLE)
	printf("OK\n");
      else
	printf("#%d\n", _io_status);
    } else if(i == J_B) {
      /* Receive 1 byte */
      printf("Receiving b... ");
      receive_byte();
      /* Wait for IO completion... */
      while(_io_status == IO_RECEIVING && joypad() == 0)
	;
      if(_io_status == IO_IDLE)
	printf("OK\n%d\n", _io_in);
      else
	printf("#%d\n", _io_status);
    } else if(i == J_START) {
      /* Send a string */
      printf("Sending s... ");
      s = str;
      while(1) {
	_io_out = *s;
	do {
	  send_byte();
	  /* Wait for IO completion... */
	  while(_io_status == IO_SENDING && joypad() == 0)
	    ;
	} while(_io_status != IO_IDLE && joypad() == 0);
	if(_io_status != IO_IDLE) {
	  printf("#%d\n", _io_status);
	  break;
	}
	if(*s == 0)
	  break;
	s++;
      }
      if(_io_status == IO_IDLE)
	printf("OK\n");
    } else if(i == J_SELECT) {
      /* Receive a string */
      printf("Receiving s... ");
      s = buffer;
      while(1) {
	receive_byte();
	/* Wait for IO completion... */
	while(_io_status == IO_RECEIVING && joypad() == 0)
	  ;
	if(_io_status != IO_IDLE) {
	  printf("#%d\n", _io_status);
	  break;
	}
	putchar(_io_in);
	*s = _io_in;
	if(*s == 0)
	  break;
	s++;
      }
      if(_io_status == IO_IDLE)
	printf("OK\n%s\n", buffer);
    }
    /* In case of user cancellation */
    waitpadup();
  }
}
