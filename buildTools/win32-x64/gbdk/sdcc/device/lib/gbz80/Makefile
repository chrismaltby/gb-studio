# libc/z80 Makefile

TOPDIR = ../../..

SCC = $(TOPDIR)/bin/sdcc -mgbz80
SAS = $(TOPDIR)/bin/as-gbz80

OBJ = div.o mul.o putchar.o printf.o shift.o stubs.o crt0_rle.o

LIB = gbz80.lib
CC = $(SCC)
AS = $(SAS)
CFLAGS = -I../../include -I.

all: $(LIB) crt0.o

$(LIB): $(OBJ) Makefile _dummy
	rm -f $(LIB)
	for i in $(OBJ); do echo $$i >> $(LIB); done

.c.o:
	$(CC) $(CFLAGS) -c $<

_dummy:

clean:
	rm -f *.o *.sym *.lst *~ $(CLEANSPEC) *.dump* *.asm *.lib
