SRC = main.c bank2.c bank3.c
BIN = banked.gb

TOPDIR = ../../..
GBLIB = $(TOPDIR)/lib/medium/rgbds

LIB = $(GBLIB)/gbz80/gbz80.lib $(GBLIB)/gb/gb.lib
CRT0 = $(GBLIB)/gb/crt0.o

OBJ = $(SRC:.c=.o)

CC = $(TOPDIR)/bin/sdcc -mgbz80 --asm=rgbds -I $(TOPDIR)/include

all: $(BIN)

clean:
	rm $(OBJ)

%.o: %.s

$(BIN): $(OBJ)
	$(CC) -v $(CRT0) $(OBJ) $(LIB)
	rgbfix -p -v a.gb

$(LIB): $(LIBOBJ)
	xlib $@ a $(LIBOBJ)

%.o: %.c
	$(CC) -c $<

%.asm: %.s
	astorgb.pl $< > $@

%.o: %.asm
	rgbasm -o$@ $<

%.s: %.ms
	maccer -o $@ $<
